import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

export async function POST() {
  try {
    // Desativar temporariamente RLS para permitir inserções
    const disableRlsQuery = `
      ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
    `

    // Criar política que permite inserções para usuários autenticados
    const createPolicyQuery = `
      CREATE POLICY IF NOT EXISTS "Allow inserts for authenticated users" 
      ON public.users 
      FOR INSERT 
      TO authenticated 
      WITH CHECK (true);
    `

    // Criar política que permite usuários verem seus próprios dados
    const createSelectPolicyQuery = `
      CREATE POLICY IF NOT EXISTS "Users can view their own data" 
      ON public.users 
      FOR SELECT 
      USING (auth.uid() = id);
    `

    // Criar política que permite usuários atualizarem seus próprios dados
    const createUpdatePolicyQuery = `
      CREATE POLICY IF NOT EXISTS "Users can update their own data" 
      ON public.users 
      FOR UPDATE 
      USING (auth.uid() = id);
    `

    // Executar as consultas
    await supabaseAdmin.rpc("exec", { sql: disableRlsQuery })
    await supabaseAdmin.rpc("exec", { sql: createPolicyQuery })
    await supabaseAdmin.rpc("exec", { sql: createSelectPolicyQuery })
    await supabaseAdmin.rpc("exec", { sql: createUpdatePolicyQuery })

    return NextResponse.json({
      success: true,
      message: "Permissões configuradas com sucesso",
    })
  } catch (error) {
    console.error("Erro ao configurar permissões:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

