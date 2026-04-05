import { NextResponse } from "next/server"
import { sql } from "@/lib/db"
import bcrypt from "bcryptjs"

// This endpoint sets up the database tables and creates a default admin
// Call this once after connecting to a fresh database

export async function POST() {
  try {
    // Create tables
    await sql`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        phone VARCHAR(20),
        monthly_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
        per_member_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'old')),
        standard_contribution DECIMAL(12, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS loans (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        loan_amount DECIMAL(12, 2) NOT NULL,
        loan_month DATE NOT NULL,
        rec_interest_no INTEGER NOT NULL DEFAULT 0,
        installment_number INTEGER NOT NULL,
        due_amount DECIMAL(12, 2) NOT NULL,
        loan_installment DECIMAL(12, 2) NOT NULL,
        interest DECIMAL(12, 2) NOT NULL,
        loan_type VARCHAR(20) NOT NULL DEFAULT 'normal' CHECK (loan_type IN ('normal', 'temporary')),
        status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS penalties (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        month_year DATE NOT NULL,
        penalty_type VARCHAR(50) NOT NULL CHECK (penalty_type IN ('contribution_missed', 'loan_installment_missed')),
        amount DECIMAL(12, 2) NOT NULL,
        consecutive_months INTEGER DEFAULT 1,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS monthly_contributions (
        id SERIAL PRIMARY KEY,
        member_id INTEGER NOT NULL REFERENCES members(id) ON DELETE CASCADE,
        month_year DATE NOT NULL,
        contribution_paid BOOLEAN DEFAULT FALSE,
        contribution_amount DECIMAL(12, 2) DEFAULT 0,
        loan_installment_paid BOOLEAN DEFAULT FALSE,
        loan_installment_amount DECIMAL(12, 2) DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(member_id, month_year)
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS trust_statistics (
        id SERIAL PRIMARY KEY,
        entry_name VARCHAR(255) NOT NULL,
        entry_value DECIMAL(15, 2) NOT NULL DEFAULT 0,
        entry_type VARCHAR(50) NOT NULL CHECK (entry_type IN ('book_size', 'monthly_detail')),
        is_fixed BOOLEAN DEFAULT FALSE,
        sort_order INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS monthly_financials (
        id SERIAL PRIMARY KEY,
        month_year DATE NOT NULL UNIQUE,
        interest_income DECIMAL(12, 2) NOT NULL DEFAULT 0,
        total_deposit DECIMAL(12, 2) NOT NULL DEFAULT 0,
        temp_loans DECIMAL(12, 2) NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    await sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_member_id ON loans(member_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status)`
    await sql`CREATE INDEX IF NOT EXISTS idx_penalties_member_id ON penalties(member_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_penalties_month_year ON penalties(month_year)`
    await sql`CREATE INDEX IF NOT EXISTS idx_monthly_contributions_member_id ON monthly_contributions(member_id)`
    await sql`CREATE INDEX IF NOT EXISTS idx_monthly_contributions_month_year ON monthly_contributions(month_year)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`
    await sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at)`

    // Create default admin with password: admin123
    const passwordHash = await bcrypt.hash("admin123", 10)
    
    await sql`
      INSERT INTO admins (email, password_hash, name)
      VALUES ('admin@bachaat.com', ${passwordHash}, 'Admin')
      ON CONFLICT (email) DO NOTHING
    `

    // Insert initial trust statistics
    const stats = [
      { name: 'Total Members', sort: 1 },
      { name: 'Active Loans', sort: 2 },
      { name: 'Total Fund Size', sort: 3 },
      { name: 'Total Contributions', sort: 4 },
      { name: 'Total Interest Earned', sort: 5 },
      { name: 'Total Penalties Collected', sort: 6 },
      { name: 'Normal Loans Outstanding', sort: 7 },
      { name: 'Temporary Loans Outstanding', sort: 8 },
      { name: 'Last Month Temp Loans', sort: 9 },
      { name: 'This Month Total Deposit', sort: 10 },
      { name: 'This Month Interest Income', sort: 11 },
    ]

    for (const stat of stats) {
      await sql`
        INSERT INTO trust_statistics (entry_name, entry_value, entry_type, is_fixed, sort_order)
        VALUES (${stat.name}, 0, 'book_size', true, ${stat.sort})
        ON CONFLICT DO NOTHING
      `
    }

    return NextResponse.json({
      success: true,
      message: "Database setup complete. Default admin: admin@bachaat.com / admin123",
    })
  } catch (error) {
    console.error("Setup error:", error)
    return NextResponse.json(
      { error: "Failed to setup database", details: String(error) },
      { status: 500 }
    )
  }
}
