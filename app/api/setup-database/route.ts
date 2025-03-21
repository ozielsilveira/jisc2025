import { NextResponse } from "next/server"
import { supabaseAdmin, createDatabaseTables } from "@/lib/database"

export async function POST() {
  try {
    // Execute the SQL script to create tables
    const { error } = await supabaseAdmin.rpc("exec", { sql: createDatabaseTables })

    if (error) {
      console.error("Error creating database tables:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Database tables created successfully" })
  } catch (error) {
    console.error("Error in setup-database route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

