import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

export async function POST() {
  try {
    // Check if the table already exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'user_settings'
      );
    `

    const { data: tableExists, error: tableCheckError } = await supabaseAdmin.rpc("exec", {
      sql: checkTableQuery,
    })

    if (tableCheckError) {
      console.error("Error checking if table exists:", tableCheckError)
      return NextResponse.json({ error: "Error checking if table exists" }, { status: 500 })
    }

    // If table already exists, return success
    if (tableExists && tableExists[0] && tableExists[0].exists) {
      return NextResponse.json({
        success: true,
        message: "Tabela de configurações já existe",
      })
    }

    // Verificar se a função update_modified_column existe
    const checkFunctionQuery = `
      SELECT EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_modified_column'
      );
    `

    const { data: functionExists, error: functionCheckError } = await supabaseAdmin.rpc("exec", {
      sql: checkFunctionQuery,
    })

    if (functionCheckError) {
      console.error("Erro ao verificar função:", functionCheckError)

      // Criar a função se não existir
      const createFunctionQuery = `
        CREATE OR REPLACE FUNCTION update_modified_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `

      await supabaseAdmin.rpc("exec", { sql: createFunctionQuery })
    }

    // Criar tabela de configurações do usuário
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS user_settings (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        theme_preference TEXT NOT NULL DEFAULT 'system',
        notification_email BOOLEAN NOT NULL DEFAULT true,
        notification_push BOOLEAN NOT NULL DEFAULT true,
        language TEXT NOT NULL DEFAULT 'pt-BR',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id)
      );
    `

    await supabaseAdmin.rpc("exec", { sql: createTableQuery })

    // Criar trigger para atualizar o campo updated_at
    const createTriggerQuery = `
      DROP TRIGGER IF EXISTS update_user_settings_modtime ON user_settings;
      CREATE TRIGGER update_user_settings_modtime
      BEFORE UPDATE ON user_settings
      FOR EACH ROW EXECUTE FUNCTION update_modified_column();
    `

    await supabaseAdmin.rpc("exec", { sql: createTriggerQuery })

    // Habilitar RLS
    const enableRlsQuery = `
      ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
    `

    await supabaseAdmin.rpc("exec", { sql: enableRlsQuery })

    // Criar políticas de acesso
    const createPoliciesQuery = `
      CREATE POLICY IF NOT EXISTS "Users can view their own settings" ON user_settings
      FOR SELECT USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can update their own settings" ON user_settings
      FOR UPDATE USING (auth.uid() = user_id);
      
      CREATE POLICY IF NOT EXISTS "Users can insert their own settings" ON user_settings
      FOR INSERT WITH CHECK (auth.uid() = user_id);
    `

    await supabaseAdmin.rpc("exec", { sql: createPoliciesQuery })

    return NextResponse.json({
      success: true,
      message: "Tabela de configurações criada com sucesso",
    })
  } catch (error) {
    console.error("Erro ao criar tabela de configurações:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

