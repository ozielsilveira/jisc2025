import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

export async function POST() {
  try {
    // Check if the athletics table exists
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public'
        AND table_name = 'athletics'
      );
    `

    const { data: tableExists, error: tableCheckError } = await supabaseAdmin.rpc("exec", {
      sql: checkTableQuery,
    })

    if (tableCheckError) {
      console.error("Error checking if athletics table exists:", tableCheckError)
      return NextResponse.json({ error: "Error checking if athletics table exists" }, { status: 500 })
    }

    // If table doesn't exist, return error
    if (!tableExists || !tableExists[0] || !tableExists[0].exists) {
      return NextResponse.json({
        error: "Athletics table does not exist. Please run database setup first.",
      }, { status: 400 })
    }

    // Check if pix_code and pix_approved columns exist
    const checkColumnsQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'athletics'
      AND column_name IN ('pix_code', 'pix_approved', 'representative_id');
    `

    const { data: existingColumns, error: columnsError } = await supabaseAdmin.rpc("exec", {
      sql: checkColumnsQuery,
    })

    if (columnsError) {
      console.error("Error checking columns:", columnsError)
      return NextResponse.json({ error: "Error checking columns" }, { status: 500 })
    }

    const columnNames = existingColumns?.map((col: any) => col.column_name) || []
    const hasPixCode = columnNames.includes('pix_code')
    const hasPixApproved = columnNames.includes('pix_approved')
    const hasRepresentativeId = columnNames.includes('representative_id')

    // Add missing columns
    let alterQueries = []

    if (!hasPixCode) {
      alterQueries.push("ALTER TABLE athletics ADD COLUMN pix_code TEXT;")
    }

    if (!hasPixApproved) {
      alterQueries.push("ALTER TABLE athletics ADD COLUMN pix_approved BOOLEAN;")
    }

    if (!hasRepresentativeId) {
      alterQueries.push("ALTER TABLE athletics ADD COLUMN representative_id UUID REFERENCES users(id) ON DELETE SET NULL;")
    }

    // Execute all alter queries
    for (const query of alterQueries) {
      const { error } = await supabaseAdmin.rpc("exec", { sql: query })
      if (error) {
        console.error("Error executing alter query:", error)
        return NextResponse.json({ error: `Error updating athletics table: ${error.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Athletics table updated successfully",
      columnsAdded: {
        pix_code: !hasPixCode,
        pix_approved: !hasPixApproved,
        representative_id: !hasRepresentativeId,
      }
    })
  } catch (error) {
    console.error("Error updating athletics table:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}