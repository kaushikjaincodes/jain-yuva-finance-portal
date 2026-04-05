"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
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
import { Check, X, Loader2 } from "lucide-react"
import { ExportButton } from "@/components/export-button"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
]

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function ChecklistPage() {
  const currentDate = new Date()
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth())
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear())
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/checklist?month=${selectedMonth + 1}&year=${selectedYear}`,
    fetcher
  )

  const handlePaymentUpdate = async (
    memberId: number,
    type: "contribution" | "loan",
    paid: boolean
  ) => {
    const updateKey = `${memberId}-${type}`
    setUpdatingId(updateKey)

    try {
      const res = await fetch("/api/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId,
          month: selectedMonth + 1,
          year: selectedYear,
          type,
          paid,
        }),
      })

      if (res.ok) {
        mutate()
      }
    } catch (error) {
      console.error("Error updating payment:", error)
    } finally {
      setUpdatingId(null)
    }
  }

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - 2 + i)

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Checklist</h1>
          <p className="text-muted-foreground">
            Track monthly contributions and loan installments
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedMonth.toString()}
            onValueChange={(v) => setSelectedMonth(parseInt(v))}
          >
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
          <Select
            value={selectedYear.toString()}
            onValueChange={(v) => setSelectedYear(parseInt(v))}
          >
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
            data={data?.checklist || []}
            filename={`checklist-${months[selectedMonth]}-${selectedYear}`}
            columns={["member_name", "monthly_contribution", "contribution_paid", "loan_installment", "loan_installment_paid"]}
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {months[selectedMonth]} {selectedYear}
          </CardTitle>
          <CardDescription>
            Click the check or cross button to mark payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8 text-muted-foreground">
              Failed to load checklist
            </div>
          ) : !data?.checklist || data.checklist.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found. Add members first.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="text-right">Monthly Contribution</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Loan Installment</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.checklist.map((item: {
                    member_id: number
                    member_name: string
                    monthly_contribution: number
                    contribution_paid: boolean
                    loan_installment: number
                    loan_installment_paid: boolean
                    has_active_loan: boolean
                  }) => (
                    <TableRow key={item.member_id}>
                      <TableCell className="font-medium">{item.member_name}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.monthly_contribution)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          {updatingId === `${item.member_id}-contribution` ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <Button
                                variant={item.contribution_paid ? "default" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handlePaymentUpdate(item.member_id, "contribution", true)
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant={!item.contribution_paid ? "destructive" : "outline"}
                                size="icon"
                                className="h-8 w-8"
                                onClick={() =>
                                  handlePaymentUpdate(item.member_id, "contribution", false)
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.has_active_loan
                          ? formatCurrency(item.loan_installment)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.has_active_loan ? (
                          <div className="flex items-center justify-center gap-2">
                            {updatingId === `${item.member_id}-loan` ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <>
                                <Button
                                  variant={item.loan_installment_paid ? "default" : "outline"}
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handlePaymentUpdate(item.member_id, "loan", true)
                                  }
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant={!item.loan_installment_paid ? "destructive" : "outline"}
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() =>
                                    handlePaymentUpdate(item.member_id, "loan", false)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        ) : (
                          <Badge variant="secondary">No Loan</Badge>
                        )}
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
  )
}
