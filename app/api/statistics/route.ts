import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    // First, update the calculated statistics
    const [members, activeLoans, penalties, normalLoans, tempLoans, monthlyData] = await Promise.all([
      sql`SELECT COUNT(*) as total, COALESCE(SUM(per_member_contribution), 0) as contributions FROM members`,
      sql`SELECT COUNT(*) as total, COALESCE(SUM(due_amount), 0) as outstanding FROM loans WHERE status = 'active'`,
      sql`SELECT COALESCE(SUM(amount), 0) as total FROM penalties`,
      sql`SELECT COALESCE(SUM(due_amount), 0) as total FROM loans WHERE status = 'active' AND loan_type = 'normal'`,
      sql`SELECT COALESCE(SUM(due_amount), 0) as total FROM loans WHERE status = 'active' AND loan_type = 'temporary'`,
      sql`
        SELECT 
          COALESCE(SUM(interest_income), 0) as total_interest,
          COALESCE((SELECT SUM(total_deposit) FROM monthly_financials WHERE EXTRACT(MONTH FROM month_year) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM month_year) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as this_month_deposit,
          COALESCE((SELECT SUM(interest_income) FROM monthly_financials WHERE EXTRACT(MONTH FROM month_year) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM month_year) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as this_month_interest,
          COALESCE((SELECT SUM(temp_loans) FROM monthly_financials WHERE EXTRACT(MONTH FROM month_year) = EXTRACT(MONTH FROM CURRENT_DATE) - 1 AND EXTRACT(YEAR FROM month_year) = EXTRACT(YEAR FROM CURRENT_DATE)), 0) as last_month_temp
        FROM monthly_financials
      `,
    ])

    const totalMembers = Number(members[0]?.total || 0)
    const totalContributions = Number(members[0]?.contributions || 0)
    const activeLoansCount = Number(activeLoans[0]?.total || 0)
    const totalOutstanding = Number(activeLoans[0]?.outstanding || 0)
    const totalPenalties = Number(penalties[0]?.total || 0)
    const normalOutstanding = Number(normalLoans[0]?.total || 0)
    const tempOutstanding = Number(tempLoans[0]?.total || 0)
    const totalInterest = Number(monthlyData[0]?.total_interest || 0)
    const thisMonthDeposit = Number(monthlyData[0]?.this_month_deposit || 0)
    const thisMonthInterest = Number(monthlyData[0]?.this_month_interest || 0)
    const lastMonthTemp = Number(monthlyData[0]?.last_month_temp || 0)
    const totalFundSize = totalContributions + totalInterest + totalPenalties - totalOutstanding

    // Update the statistics
    const updates = [
      { name: 'Total Members', value: totalMembers },
      { name: 'Active Loans', value: activeLoansCount },
      { name: 'Total Fund Size', value: totalFundSize },
      { name: 'Total Contributions', value: totalContributions },
      { name: 'Total Interest Earned', value: totalInterest },
      { name: 'Total Penalties Collected', value: totalPenalties },
      { name: 'Normal Loans Outstanding', value: normalOutstanding },
      { name: 'Temporary Loans Outstanding', value: tempOutstanding },
      { name: 'Last Month Temp Loans', value: lastMonthTemp },
      { name: 'This Month Total Deposit', value: thisMonthDeposit },
      { name: 'This Month Interest Income', value: thisMonthInterest },
    ]

    for (const update of updates) {
      await sql`
        UPDATE trust_statistics 
        SET entry_value = ${update.value}, updated_at = NOW()
        WHERE entry_name = ${update.name}
      `
    }

    // Fetch updated statistics
    const statistics = await sql`
      SELECT * FROM trust_statistics 
      WHERE entry_type = 'book_size'
      ORDER BY sort_order ASC
    `

    return NextResponse.json({ statistics })
  } catch (error) {
    console.error("Error fetching statistics:", error)
    return NextResponse.json({ error: "Failed to fetch statistics" }, { status: 500 })
  }
}
