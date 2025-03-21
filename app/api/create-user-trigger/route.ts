import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

export async function POST() {
  try {
    // Criar função para inserir usuários automaticamente
    const createFunctionQuery = `
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS TRIGGER AS $$
      BEGIN
        INSERT INTO public.users (id, email, name, cpf, phone, gender, role)
        VALUES (
          NEW.id, 
          NEW.email, 
          COALESCE(NEW.raw_user_meta_data->>'name', 'Usuário'),
          COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
          COALESCE(NEW.raw_user_meta_data->>'phone', ''),
          COALESCE(NEW.raw_user_meta_data->>'gender', 'prefer_not_to_say'),
          COALESCE(NEW.raw_user_meta_data->>'role', 'buyer')
        )
        ON CONFLICT (id) DO NOTHING;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `

    // Criar trigger para executar a função quando um novo usuário for criado
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
      CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
    `

    // Executar as consultas
    await supabaseAdmin.rpc("exec", { sql: createFunctionQuery })
    await supabaseAdmin.rpc("exec", { sql: createTriggerQuery })

    return NextResponse.json({
      success: true,
      message: "Trigger de usuário criado com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar trigger de usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

