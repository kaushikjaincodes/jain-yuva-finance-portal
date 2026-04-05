import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    const loans = await sql`
      SELECT l.*, m.name as member_name
      FROM loans l
      JOIN members m ON l.member_id = m.id
      ORDER BY l.created_at DESC
    `
    return NextResponse.json({ loans })
  } catch (error) {
    console.error("Error fetching loans:", error)
    return NextResponse.json({ error: "Failed to fetch loans" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      member_id,
      loan_amount,
      installment_number,
      loan_type,
      loan_installment,
      interest,
      due_amount,
    } = body

    if (!member_id || !loan_amount || !installment_number) {
      return NextResponse.json(
        { error: "Member, loan amount, and installment number are required" },
        { status: 400 }
      )
    }

    // Check if member already has an active loan
    const existingLoans = await sql`
      SELECT id FROM loans WHERE member_id = ${member_id} AND status = 'active'
    `

    if (existingLoans.length > 0) {
      return NextResponse.json(
        { error: "Member already has an active loan" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO loans (
        member_id, 
        loan_amount, 
        loan_month, 
        installment_number, 
        loan_type,
        loan_installment,
        interest,
        due_amount,
        rec_interest_no
      )
      VALUES (
        ${member_id}, 
        ${loan_amount}, 
        CURRENT_DATE, 
        ${installment_number}, 
        ${loan_type || 'normal'},
        ${loan_installment},
        ${interest},
        ${due_amount},
        0
      )
      RETURNING *
    `

    return NextResponse.json({ loan: result[0] }, { status: 201 })
  } catch (error) {
    console.error("Error creating loan:", error)
    return NextResponse.json({ error: "Failed to create loan" }, { status: 500 })
  }
}
