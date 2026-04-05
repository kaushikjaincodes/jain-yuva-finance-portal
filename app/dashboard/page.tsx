import { sql } from "@/lib/db"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Wallet, AlertTriangle, TrendingUp, Mail, ArrowUpRight, ArrowDownRight } from "lucide-react"
import Link from "next/link"
import { DashboardCharts } from "@/components/dashboard/dashboard-charts"
import { RecentActivity } from "@/components/dashboard/recent-activity"

async function getDashboardStats() {
  try {
    const [members, loans, penalties, financials] = await Promise.all([
      sql`SELECT COUNT(*) as total, SUM(per_member_contribution) as total_contributions FROM members`,
      sql`SELECT COUNT(*) as total, SUM(due_amount) as total_outstanding FROM loans WHERE status = 'active'`,
      sql`SELECT COUNT(*) as total, SUM(amount) as total_amount FROM penalties WHERE EXTRACT(MONTH FROM month_year) = EXTRACT(MONTH FROM CURRENT_DATE) AND EXTRACT(YEAR FROM month_year) = EXTRACT(YEAR FROM CURRENT_DATE)`,
      sql`SELECT SUM(interest_income) as total_interest, SUM(total_deposit) as total_deposit FROM monthly_financials`,
    ])

    return {
      totalMembers: Number(members[0]?.total || 0),
      totalContributions: Number(members[0]?.total_contributions || 0),
      activeLoans: Number(loans[0]?.total || 0),
      outstandingAmount: Number(loans[0]?.total_outstanding || 0),
      monthlyPenalties: Number(penalties[0]?.total || 0),
      penaltyAmount: Number(penalties[0]?.total_amount || 0),
      totalInterest: Number(financials[0]?.total_interest || 0),
      totalDeposit: Number(financials[0]?.total_deposit || 0),
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return {
      totalMembers: 0,
      totalContributions: 0,
      activeLoans: 0,
      outstandingAmount: 0,
      monthlyPenalties: 0,
      penaltyAmount: 0,
      totalInterest: 0,
      totalDeposit: 0,
    }
  }
}

async function getRecentMembers() {
  try {
    const members = await sql`
      SELECT id, name, status, monthly_contribution, per_member_contribution
      FROM members
      ORDER BY created_at DESC
      LIMIT 5
    `
    return members
  } catch {
    return []
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()
  const recentMembers = await getRecentMembers()

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your trust management
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/notify">
            <Mail className="mr-2 h-4 w-4" />
            Notify Members
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.totalContributions)} total contributions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeLoans}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.outstandingAmount)} outstanding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month Penalties</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyPenalties}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(stats.penaltyAmount)} collected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Interest Earned</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalInterest)}</div>
            <p className="text-xs text-muted-foreground">
              Total interest income
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Monthly Overview</CardTitle>
            <CardDescription>
              Deposits and interest income over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardCharts />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Members</CardTitle>
            <CardDescription>Latest member activity</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentActivity members={recentMembers} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
