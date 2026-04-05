"use client"

import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ExportButton } from "@/components/export-button"
import {
  Users,
  Wallet,
  TrendingUp,
  AlertTriangle,
  PiggyBank,
  CreditCard,
  Calendar,
  Banknote,
  DollarSign,
  CircleDollarSign,
  Building,
} from "lucide-react"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

const iconMap: { [key: string]: React.ComponentType<{ className?: string }> } = {
  "Total Members": Users,
  "Active Loans": Wallet,
  "Total Fund Size": PiggyBank,
  "Total Contributions": Banknote,
  "Total Interest Earned": TrendingUp,
  "Total Penalties Collected": AlertTriangle,
  "Normal Loans Outstanding": CreditCard,
  "Temporary Loans Outstanding": CreditCard,
  "Last Month Temp Loans": Calendar,
  "This Month Total Deposit": DollarSign,
  "This Month Interest Income": CircleDollarSign,
}

export default function StatisticsPage() {
  const { data, error, isLoading } = useSWR("/api/statistics", fetcher)

  const stats = data?.statistics || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Trust Statistics</h1>
          <p className="text-muted-foreground">
            Book size and overall trust information
          </p>
        </div>
        <ExportButton
          data={stats}
          filename="trust-statistics"
          columns={["entry_name", "entry_value"]}
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(11)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              Failed to load statistics
            </div>
          </CardContent>
        </Card>
      ) : stats.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              No statistics available
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat: {
            id: number
            entry_name: string
            entry_value: number
            is_fixed: boolean
          }) => {
            const Icon = iconMap[stat.entry_name] || Building
            const isCurrency = !stat.entry_name.includes("Members") && !stat.entry_name.includes("Loans")
            
            return (
              <Card key={stat.id}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.entry_name}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {isCurrency ? formatCurrency(stat.entry_value) : stat.entry_value}
                  </div>
                  {stat.is_fixed && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Fixed entry
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
