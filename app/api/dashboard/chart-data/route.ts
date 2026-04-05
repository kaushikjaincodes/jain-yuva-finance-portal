import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const financials = await sql`
      SELECT 
        TO_CHAR(month_year, 'Mon') as month,
        total_deposit as deposit,
        interest_income as interest
      FROM monthly_financials
      ORDER BY month_year DESC
      LIMIT 12
    `

    // Reverse to show oldest first
    const data = financials.reverse().map((f) => ({
      month: f.month,
      deposit: Number(f.deposit),
      interest: Number(f.interest),
    }))

    // If no data, return sample data for visualization
    if (data.length === 0) {
      const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
      return NextResponse.json({
        data: months.map((month) => ({
          month,
          deposit: Math.floor(Math.random() * 50000) + 10000,
          interest: Math.floor(Math.random() * 5000) + 1000,
        })),
      })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Error fetching chart data:", error)
    return NextResponse.json({ data: [] }, { status: 500 })
  }
}
