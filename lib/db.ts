import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set")
}

export const sql = neon(process.env.DATABASE_URL)

// Type definitions
export interface Admin {
  id: number
  email: string
  password_hash: string
  name: string
  created_at: Date
  updated_at: Date
}

export interface Member {
  id: number
  name: string
  email: string | null
  phone: string | null
  monthly_contribution: number
  per_member_contribution: number
  status: "new" | "old"
  standard_contribution: number
  created_at: Date
  updated_at: Date
}

export interface Loan {
  id: number
  member_id: number
  member_name?: string
  loan_amount: number
  loan_month: Date
  rec_interest_no: number
  installment_number: number
  due_amount: number
  loan_installment: number
  interest: number
  loan_type: "normal" | "temporary"
  status: "active" | "closed"
  created_at: Date
  updated_at: Date
}

export interface Penalty {
  id: number
  member_id: number
  member_name?: string
  month_year: Date
  penalty_type: "contribution_missed" | "loan_installment_missed"
  amount: number
  consecutive_months: number
  created_at: Date
}

export interface MonthlyContribution {
  id: number
  member_id: number
  member_name?: string
  month_year: Date
  contribution_paid: boolean
  contribution_amount: number
  loan_installment_paid: boolean
  loan_installment_amount: number
  created_at: Date
  updated_at: Date
}

export interface TrustStatistic {
  id: number
  entry_name: string
  entry_value: number
  entry_type: "book_size" | "monthly_detail"
  is_fixed: boolean
  sort_order: number
  created_at: Date
  updated_at: Date
}

export interface MonthlyFinancial {
  id: number
  month_year: Date
  interest_income: number
  total_deposit: number
  temp_loans: number
  created_at: Date
  updated_at: Date
}

export interface Session {
  id: number
  admin_id: number
  token: string
  expires_at: Date
  created_at: Date
}
