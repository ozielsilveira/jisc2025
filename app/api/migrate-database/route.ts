import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { createDatabaseTables } from "@/lib/database"

async function executeRpc(name: string, rpc: () => Promise<any>) {
  const { error } = await rpc()
  if (error) {
    console.warn(`Error executing ${name}:`, error)
    throw new Error(`Error executing ${name}`)
  }
}

export async function POST() {
  try {
    await executeRpc("create_database_tables", () => supabase.rpc("exec", { sql: createDatabaseTables }))
    await executeRpc("create_packages_table", () => supabase.rpc("create_packages_table"))
    await executeRpc("create_user_settings_table", () => supabase.rpc("create_user_settings_table"))
    await executeRpc("fix_permissions", () => supabase.rpc("fix_permissions"))
    await executeRpc("remove_user_trigger", () => supabase.rpc("remove_user_trigger"))
    await executeRpc("update_athletics_table", () => supabase.rpc("update_athletics_table"))
    await executeRpc("update_packages_table_schema", () =>
      supabase.rpc("update_packages_table_schema", {
        has_category: true,
        has_includes_games: true,
        has_discount_percentage: true,
      }),
    )

    return NextResponse.json({
      success: true,
      message: "Database migrated successfully",
    })
  } catch (error: any) {
    console.warn("Error migrating database:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
