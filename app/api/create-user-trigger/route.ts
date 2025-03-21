import { supabaseAdmin } from "@/lib/database"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Drop existing trigger and function
    const dropTriggerQuery = `
      DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    `
    const dropFunctionQuery = `
      DROP FUNCTION IF EXISTS public.handle_new_user();
    `

    // Execute the drop queries
    await supabaseAdmin.rpc("exec", { sql: dropTriggerQuery })
    await supabaseAdmin.rpc("exec", { sql: dropFunctionQuery })

    return NextResponse.json({
      success: true,
      message: "Trigger de usuário removido com sucesso",
    })
  } catch (error) {
    console.error("Erro ao remover trigger de usuário:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
