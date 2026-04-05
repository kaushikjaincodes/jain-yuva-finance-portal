"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExportButton } from "@/components/export-button"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const months = [
  "All", "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function PenaltiesPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState("0") // 0 = All
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear().toString())

  const { data, error, isLoading } = useSWR("/api/penalties", fetcher)

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  const filteredPenalties = data?.penalties?.filter((penalty: { month_year: string }) => {
    const penaltyDate = new Date(penalty.month_year)
    const monthMatch = selectedMonth === "0" || penaltyDate.getMonth() === parseInt(selectedMonth) - 1
    const yearMatch = penaltyDate.getFullYear() === parseInt(selectedYear)
    return monthMatch && yearMatch
  }) || []

  const contributionPenalties = filteredPenalties.filter(
    (p: { penalty_type: string }) => p.penalty_type === "contribution_missed"
  )
  const loanPenalties = filteredPenalties.filter(
    (p: { penalty_type: string }) => p.penalty_type === "loan_installment_missed"
  )

  const totalPenalties = filteredPenalties.reduce(
    (sum: number, p: { amount: number }) => sum + Number(p.amount),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Penalties</h1>
          <p className="text-muted-foreground">
            View and manage member penalties
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ExportButton
            data={filteredPenalties}
            filename={`penalties-${selectedYear}`}
            columns={["member_name", "month_year", "penalty_type", "amount"]}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Penalties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPenalties)}</div>
            <p className="text-xs text-muted-foreground">
              {filteredPenalties.length} penalties recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Contribution Missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{contributionPenalties.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(
                contributionPenalties.reduce(
                  (sum: number, p: { amount: number }) => sum + Number(p.amount),
                  0
                )
              )}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Loan Missed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loanPenalties.length}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(
                loanPenalties.reduce(
                  (sum: number, p: { amount: number }) => sum + Number(p.amount),
                  0
                )
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contribution Penalties</CardTitle>
            <CardDescription>
              Escalating penalties for missed monthly contributions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : contributionPenalties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No contribution penalties
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Streak</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contributionPenalties.map((penalty: {
                      id: number
                      member_name: string
                      month_year: string
                      amount: number
                      consecutive_months: number
                    }) => (
                      <TableRow key={penalty.id}>
                        <TableCell className="font-medium">
                          {penalty.member_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(penalty.month_year), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(penalty.amount)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="destructive">
                            {penalty.consecutive_months} month(s)
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Loan Penalties</CardTitle>
            <CardDescription>
              Flat penalties for missed loan installments
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : loanPenalties.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No loan penalties
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Month</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loanPenalties.map((penalty: {
                      id: number
                      member_name: string
                      month_year: string
                      amount: number
                    }) => (
                      <TableRow key={penalty.id}>
                        <TableCell className="font-medium">
                          {penalty.member_name}
                        </TableCell>
                        <TableCell>
                          {format(new Date(penalty.month_year), "MMM yyyy")}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(penalty.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
