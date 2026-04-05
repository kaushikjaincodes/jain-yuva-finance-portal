"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Plus } from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { format } from "date-fns"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function FinancialsPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/financials", fetcher)
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    month_year: "",
    interest_income: "",
    total_deposit: "",
    temp_loans: "",
  })

  const handleAddFinancial = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      const res = await fetch("/api/financials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month_year: formData.month_year + "-01",
          interest_income: Number(formData.interest_income),
          total_deposit: Number(formData.total_deposit),
          temp_loans: Number(formData.temp_loans),
        }),
      })

      if (res.ok) {
        setIsAddOpen(false)
        setFormData({
          month_year: "",
          interest_income: "",
          total_deposit: "",
          temp_loans: "",
        })
        mutate()
      }
    } catch (error) {
      console.error("Error adding financial:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const financials = data?.financials || []
  
  const totalInterest = financials.reduce(
    (sum: number, f: { interest_income: number }) => sum + Number(f.interest_income),
    0
  )
  const totalDeposit = financials.reduce(
    (sum: number, f: { total_deposit: number }) => sum + Number(f.total_deposit),
    0
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monthly Financials</h1>
          <p className="text-muted-foreground">
            Interest income and deposit tracking
          </p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={financials}
            filename="monthly-financials"
            columns={["month_year", "interest_income", "total_deposit", "temp_loans"]}
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Record
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Monthly Financial Record</DialogTitle>
                <DialogDescription>
                  Record monthly financial data
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddFinancial}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="month_year">Month</FieldLabel>
                    <Input
                      id="month_year"
                      type="month"
                      value={formData.month_year}
                      onChange={(e) =>
                        setFormData({ ...formData, month_year: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="interest_income">Interest Income</FieldLabel>
                    <Input
                      id="interest_income"
                      type="number"
                      value={formData.interest_income}
                      onChange={(e) =>
                        setFormData({ ...formData, interest_income: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="total_deposit">Total Deposit</FieldLabel>
                    <Input
                      id="total_deposit"
                      type="number"
                      value={formData.total_deposit}
                      onChange={(e) =>
                        setFormData({ ...formData, total_deposit: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="temp_loans">Temporary Loans</FieldLabel>
                    <Input
                      id="temp_loans"
                      type="number"
                      value={formData.temp_loans}
                      onChange={(e) =>
                        setFormData({ ...formData, temp_loans: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Spinner className="mr-2" />
                        Adding...
                      </>
                    ) : (
                      "Add Record"
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Interest Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalInterest)}</div>
            <p className="text-xs text-muted-foreground">
              Across {financials.length} months
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalDeposit)}</div>
            <p className="text-xs text-muted-foreground">
              Across {financials.length} months
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Records</CardTitle>
          <CardDescription>
            Detailed monthly financial breakdown
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
              Failed to load financials
            </div>
          ) : financials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No financial records yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Interest Income</TableHead>
                    <TableHead className="text-right">Total Deposit</TableHead>
                    <TableHead className="text-right">Temp Loans</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {financials.map((financial: {
                    id: number
                    month_year: string
                    interest_income: number
                    total_deposit: number
                    temp_loans: number
                  }) => (
                    <TableRow key={financial.id}>
                      <TableCell className="font-medium">
                        {format(new Date(financial.month_year), "MMMM yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(financial.interest_income)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(financial.total_deposit)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(financial.temp_loans)}
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
