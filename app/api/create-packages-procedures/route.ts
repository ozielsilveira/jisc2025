import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/database"

export async function POST() {
  try {
    // Create the stored procedure for creating the packages table
    const createTableProcedure = `
      CREATE OR REPLACE FUNCTION create_packages_table()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        CREATE TABLE IF NOT EXISTS packages (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          name TEXT NOT NULL,
          description TEXT,
          price DECIMAL(10, 2) NOT NULL,
          category TEXT NOT NULL DEFAULT 'combined' CHECK (category IN ('games', 'party', 'combined')),
          includes_party BOOLEAN NOT NULL DEFAULT false,
          includes_games BOOLEAN NOT NULL DEFAULT false,
          discount_percentage DECIMAL(5, 2),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create trigger for updated_at
        CREATE TRIGGER update_packages_modtime
        BEFORE UPDATE ON packages
        FOR EACH ROW EXECUTE FUNCTION update_modified_column();
      END;
      $$;
    `

    // Create the stored procedure for updating the packages table schema
    const updateSchemaProcedure = `
      CREATE OR REPLACE FUNCTION update_packages_table_schema(
        has_category BOOLEAN,
        has_includes_games BOOLEAN,
        has_discount_percentage BOOLEAN
      )
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Add category column if it doesn't exist
        IF NOT has_category THEN
          ALTER TABLE packages 
          ADD COLUMN category TEXT NOT NULL DEFAULT 'combined' 
          CHECK (category IN ('games', 'party', 'combined'));
        END IF;
        
        -- Add includes_games column if it doesn't exist
        IF NOT has_includes_games THEN
          ALTER TABLE packages 
          ADD COLUMN includes_games BOOLEAN NOT NULL DEFAULT true;
        END IF;
        
        -- Add discount_percentage column if it doesn't exist
        IF NOT has_discount_percentage THEN
          ALTER TABLE packages 
          ADD COLUMN discount_percentage DECIMAL(5, 2);
        END IF;
        
        -- Update existing records to set appropriate values
        UPDATE packages
        SET 
          category = CASE 
            WHEN includes_party = true AND includes_games = true THEN 'combined'
            WHEN includes_party = true THEN 'party'
            ELSE 'games'
          END,
          includes_games = CASE WHEN includes_party = false THEN true ELSE includes_games END
        WHERE 1=1;
      END;
      $$;
    `

    // Execute the SQL to create the stored procedures
    const { error: createProcedureError } = await supabaseAdmin.query(createTableProcedure)
    if (createProcedureError) {
      console.error("Error creating table procedure:", createProcedureError)
      return NextResponse.json({ error: "Error creating table procedure" }, { status: 500 })
    }

    const { error: updateProcedureError } = await supabaseAdmin.query(updateSchemaProcedure)
    if (updateProcedureError) {
      console.error("Error creating update schema procedure:", updateProcedureError)
      return NextResponse.json({ error: "Error creating update schema procedure" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Database procedures created successfully",
    })
  } catch (error) {
    console.error("Error creating database procedures:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

