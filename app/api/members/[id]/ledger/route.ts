import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const memberId = parseInt(id)

    // Get member details
    const members = await sql`
      SELECT * FROM members WHERE id = ${memberId}
    `

    if (members.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const member = members[0]

    // Get contributions
    const contributions = await sql`
      SELECT * FROM monthly_contributions 
      WHERE member_id = ${memberId}
      ORDER BY month_year DESC
    `

    // Get loans
    const loans = await sql`
      SELECT * FROM loans 
      WHERE member_id = ${memberId}
      ORDER BY loan_month DESC
    `

    // Get penalties
    const penalties = await sql`
      SELECT * FROM penalties 
      WHERE member_id = ${memberId}
      ORDER BY month_year DESC
    `

    // Return data for client-side PDF generation
    return NextResponse.json({
      member,
      contributions,
      loans,
      penalties,
    })
  } catch (error) {
    console.error("Error fetching ledger data:", error)
    return NextResponse.json(
      { error: "Failed to fetch ledger data" },
      { status: 500 }
    )
  }
}
