import { NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"

export async function POST() {
  try {
    // Check if the packages table exists
    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public")
      .eq("table_name", "packages")

    if (tablesError) {
      console.error("Error checking if packages table exists:", tablesError)
      return NextResponse.json({ error: "Error checking if packages table exists" }, { status: 500 })
    }

    const tableExists = tables && tables.length > 0

    // If table doesn't exist, create it
    if (!tableExists) {
      const { error: createTableError } = await supabase.rpc("create_packages_table")

      if (createTableError) {
        console.error("Error creating packages table:", createTableError)
        return NextResponse.json({ error: "Error creating packages table" }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: "Packages table created successfully",
      })
    }

    // Table exists, check if we need to add new columns
    const { data: columns, error: columnsError } = await supabase
      .from("information_schema.columns")
      .select("column_name")
      .eq("table_schema", "public")
      .eq("table_name", "packages")

    if (columnsError) {
      console.error("Error checking columns:", columnsError)
      return NextResponse.json({ error: "Error checking columns" }, { status: 500 })
    }

    const columnNames = columns.map((col) => col.column_name)
    const hasCategoryColumn = columnNames.includes("category")
    const hasIncludesGamesColumn = columnNames.includes("includes_games")
    const hasDiscountPercentageColumn = columnNames.includes("discount_percentage")

    // Add missing columns if needed
    if (!hasCategoryColumn || !hasIncludesGamesColumn || !hasDiscountPercentageColumn) {
      const { error: alterTableError } = await supabase.rpc("update_packages_table_schema", {
        has_category: hasCategoryColumn,
        has_includes_games: hasIncludesGamesColumn,
        has_discount_percentage: hasDiscountPercentageColumn,
      })

      if (alterTableError) {
        console.error("Error updating packages table schema:", alterTableError)
        return NextResponse.json({ error: "Error updating packages table schema" }, { status: 500 })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Packages table structure updated successfully",
    })
  } catch (error) {
    console.error("Error updating packages table:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

