import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = parseInt(searchParams.get("month") || "1")
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString())

    const monthYear = `${year}-${month.toString().padStart(2, "0")}-01`

    // Get all members with their contribution status and active loans
    const checklist = await sql`
      SELECT 
        m.id as member_id,
        m.name as member_name,
        m.monthly_contribution,
        COALESCE(mc.contribution_paid, false) as contribution_paid,
        COALESCE(mc.loan_installment_paid, false) as loan_installment_paid,
        COALESCE(l.loan_installment, 0) as loan_installment,
        CASE WHEN l.id IS NOT NULL THEN true ELSE false END as has_active_loan
      FROM members m
      LEFT JOIN monthly_contributions mc ON m.id = mc.member_id AND mc.month_year = ${monthYear}
      LEFT JOIN loans l ON m.id = l.member_id AND l.status = 'active'
      ORDER BY m.name ASC
    `

    return NextResponse.json({ checklist })
  } catch (error) {
    console.error("Error fetching checklist:", error)
    return NextResponse.json({ error: "Failed to fetch checklist" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { memberId, month, year, type, paid } = body

    const monthYear = `${year}-${month.toString().padStart(2, "0")}-01`

    // Get member's contribution amount
    const members = await sql`
      SELECT monthly_contribution FROM members WHERE id = ${memberId}
    `
    
    if (members.length === 0) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 })
    }

    const contributionAmount = members[0].monthly_contribution

    // Get active loan installment if exists
    const loans = await sql`
      SELECT loan_installment FROM loans WHERE member_id = ${memberId} AND status = 'active'
    `
    const loanInstallment = loans.length > 0 ? loans[0].loan_installment : 0

    if (type === "contribution") {
      // Upsert contribution status
      await sql`
        INSERT INTO monthly_contributions (member_id, month_year, contribution_paid, contribution_amount)
        VALUES (${memberId}, ${monthYear}, ${paid}, ${paid ? contributionAmount : 0})
        ON CONFLICT (member_id, month_year) 
        DO UPDATE SET contribution_paid = ${paid}, contribution_amount = ${paid ? contributionAmount : 0}, updated_at = NOW()
      `

      // Handle penalty if not paid
      if (!paid) {
        // Check consecutive missed months
        const missedMonths = await sql`
          SELECT COUNT(*) as count FROM monthly_contributions 
          WHERE member_id = ${memberId} 
          AND contribution_paid = false 
          AND month_year <= ${monthYear}
          AND month_year >= DATE_TRUNC('year', ${monthYear}::date)
        `
        
        const consecutiveMonths = Number(missedMonths[0]?.count || 1)
        // Penalty formula: 10 * 2^(n-1) where n is the consecutive missed month
        const penaltyAmount = 10 * Math.pow(2, consecutiveMonths - 1)

        // Add or update penalty
        await sql`
          INSERT INTO penalties (member_id, month_year, penalty_type, amount, consecutive_months)
          VALUES (${memberId}, ${monthYear}, 'contribution_missed', ${penaltyAmount}, ${consecutiveMonths})
          ON CONFLICT DO NOTHING
        `

        // Update member's contribution total
        await sql`
          UPDATE members 
          SET per_member_contribution = per_member_contribution - ${contributionAmount},
              updated_at = NOW()
          WHERE id = ${memberId}
        `
      } else {
        // If paid, update member's contribution total
        await sql`
          UPDATE members 
          SET per_member_contribution = per_member_contribution + ${contributionAmount},
              updated_at = NOW()
          WHERE id = ${memberId}
        `

        // Check if member should become "old" status
        const updatedMember = await sql`
          SELECT per_member_contribution, standard_contribution FROM members WHERE id = ${memberId}
        `
        
        if (updatedMember[0].per_member_contribution >= updatedMember[0].standard_contribution && updatedMember[0].standard_contribution > 0) {
          await sql`
            UPDATE members SET status = 'old', updated_at = NOW() WHERE id = ${memberId}
          `
        }

        // Remove any penalty for this month if it exists
        await sql`
          DELETE FROM penalties 
          WHERE member_id = ${memberId} 
          AND month_year = ${monthYear} 
          AND penalty_type = 'contribution_missed'
        `
      }
    } else if (type === "loan") {
      // Update loan installment status
      await sql`
        INSERT INTO monthly_contributions (member_id, month_year, loan_installment_paid, loan_installment_amount)
        VALUES (${memberId}, ${monthYear}, ${paid}, ${paid ? loanInstallment : 0})
        ON CONFLICT (member_id, month_year) 
        DO UPDATE SET loan_installment_paid = ${paid}, loan_installment_amount = ${paid ? loanInstallment : 0}, updated_at = NOW()
      `

      // Handle loan penalty if not paid (flat ₹500)
      if (!paid) {
        await sql`
          INSERT INTO penalties (member_id, month_year, penalty_type, amount, consecutive_months)
          VALUES (${memberId}, ${monthYear}, 'loan_installment_missed', 500, 1)
          ON CONFLICT DO NOTHING
        `
      } else {
        // If paid, update loan due amount
        await sql`
          UPDATE loans 
          SET due_amount = due_amount - ${loanInstallment},
              rec_interest_no = rec_interest_no + 1,
              updated_at = NOW()
          WHERE member_id = ${memberId} AND status = 'active'
        `

        // Check if loan is fully paid
        const updatedLoan = await sql`
          SELECT due_amount, rec_interest_no, installment_number FROM loans 
          WHERE member_id = ${memberId} AND status = 'active'
        `
        
        if (updatedLoan.length > 0 && (updatedLoan[0].due_amount <= 0 || updatedLoan[0].rec_interest_no >= updatedLoan[0].installment_number)) {
          await sql`
            UPDATE loans SET status = 'closed', updated_at = NOW() 
            WHERE member_id = ${memberId} AND status = 'active'
          `
        }

        // Remove loan penalty for this month if it exists
        await sql`
          DELETE FROM penalties 
          WHERE member_id = ${memberId} 
          AND month_year = ${monthYear} 
          AND penalty_type = 'loan_installment_missed'
        `
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error updating checklist:", error)
    return NextResponse.json({ error: "Failed to update checklist" }, { status: 500 })
  }
}
