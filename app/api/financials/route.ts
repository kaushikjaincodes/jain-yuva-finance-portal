import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const financials = await sql`
      SELECT * FROM monthly_financials
      ORDER BY month_year DESC
    `
    return NextResponse.json({ financials })
  } catch (error) {
    console.error("Error fetching financials:", error)
    return NextResponse.json({ error: "Failed to fetch financials" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { month_year, interest_income, total_deposit, temp_loans } = body

    if (!month_year) {
      return NextResponse.json(
        { error: "Month is required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO monthly_financials (month_year, interest_income, total_deposit, temp_loans)
      VALUES (${month_year}, ${interest_income || 0}, ${total_deposit || 0}, ${temp_loans || 0})
      ON CONFLICT (month_year) 
      DO UPDATE SET 
        interest_income = ${interest_income || 0},
        total_deposit = ${total_deposit || 0},
        temp_loans = ${temp_loans || 0},
        updated_at = NOW()
      RETURNING *
    `

    return NextResponse.json({ financial: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating financial:", error)
    return NextResponse.json({ error: "Failed to create financial record" }, { status: 500 })
  }
}
