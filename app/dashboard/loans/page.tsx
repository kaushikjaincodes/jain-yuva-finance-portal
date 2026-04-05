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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search } from "lucide-react"
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

// Interest rates
const NORMAL_RATE = 0.25 / 100 // 0.25% monthly
const TEMP_RATE = 1.00 / 100 // 1.00% monthly

export default function LoansPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/loans", fetcher)
  const { data: membersData } = useSWR("/api/members", fetcher)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    member_id: "",
    loan_amount: "",
    installment_number: "",
    loan_type: "normal",
  })

  // Calculate loan details
  const calculateLoan = () => {
    const principal = Number(formData.loan_amount) || 0
    const installments = Number(formData.installment_number) || 1
    const rate = formData.loan_type === "normal" ? NORMAL_RATE : TEMP_RATE
    
    // Simple interest
    const interest = principal * rate * installments
    const totalAmount = principal + interest
    const installmentAmount = totalAmount / installments

    return {
      interest: Math.round(interest * 100) / 100,
      totalAmount: Math.round(totalAmount * 100) / 100,
      installmentAmount: Math.round(installmentAmount * 100) / 100,
    }
  }

  const loanCalc = calculateLoan()

  const handleAddLoan = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      const res = await fetch("/api/loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: Number(formData.member_id),
          loan_amount: Number(formData.loan_amount),
          installment_number: Number(formData.installment_number),
          loan_type: formData.loan_type,
          loan_installment: loanCalc.installmentAmount,
          interest: loanCalc.interest,
          due_amount: loanCalc.totalAmount,
        }),
      })

      if (res.ok) {
        setIsAddOpen(false)
        setFormData({
          member_id: "",
          loan_amount: "",
          installment_number: "",
          loan_type: "normal",
        })
        mutate()
      }
    } catch (error) {
      console.error("Error adding loan:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const activeLoans = data?.loans?.filter((loan: { status: string }) => loan.status === "active") || []
  const closedLoans = data?.loans?.filter((loan: { status: string }) => loan.status === "closed") || []

  const filteredActive = activeLoans.filter((loan: { member_name: string }) =>
    loan.member_name?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredClosed = closedLoans.filter((loan: { member_name: string }) =>
    loan.member_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Loans</h1>
          <p className="text-muted-foreground">Manage member loans</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={data?.loans || []}
            filename="loans"
            columns={["member_name", "loan_amount", "loan_type", "due_amount", "loan_installment", "status"]}
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Loan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Loan</DialogTitle>
                <DialogDescription>
                  Create a new loan for a member
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddLoan}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="member">Member</FieldLabel>
                    <Select
                      value={formData.member_id}
                      onValueChange={(v) => setFormData({ ...formData, member_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select member" />
                      </SelectTrigger>
                      <SelectContent>
                        {membersData?.members?.map((member: { id: number; name: string }) => (
                          <SelectItem key={member.id} value={member.id.toString()}>
                            {member.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="loan_amount">Loan Amount (Principal)</FieldLabel>
                    <Input
                      id="loan_amount"
                      type="number"
                      value={formData.loan_amount}
                      onChange={(e) =>
                        setFormData({ ...formData, loan_amount: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="installment_number">Number of Installments</FieldLabel>
                    <Input
                      id="installment_number"
                      type="number"
                      value={formData.installment_number}
                      onChange={(e) =>
                        setFormData({ ...formData, installment_number: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="loan_type">Loan Type</FieldLabel>
                    <Select
                      value={formData.loan_type}
                      onValueChange={(v) => setFormData({ ...formData, loan_type: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">Normal (0.25% interest)</SelectItem>
                        <SelectItem value="temporary">Temporary (1.00% interest)</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>

                  {formData.loan_amount && formData.installment_number && (
                    <div className="rounded-lg bg-muted p-4 space-y-2">
                      <h4 className="font-medium">Loan Summary</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">Principal:</span>
                        <span className="text-right">{formatCurrency(Number(formData.loan_amount))}</span>
                        <span className="text-muted-foreground">Interest:</span>
                        <span className="text-right">{formatCurrency(loanCalc.interest)}</span>
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="text-right font-medium">{formatCurrency(loanCalc.totalAmount)}</span>
                        <span className="text-muted-foreground">Monthly EMI:</span>
                        <span className="text-right font-medium">{formatCurrency(loanCalc.installmentAmount)}</span>
                      </div>
                    </div>
                  )}

                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding ? (
                      <>
                        <Spinner className="mr-2" />
                        Creating...
                      </>
                    ) : (
                      "Create Loan"
                    )}
                  </Button>
                </FieldGroup>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by member name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="active">
            <TabsList>
              <TabsTrigger value="active">
                Active ({activeLoans.length})
              </TabsTrigger>
              <TabsTrigger value="closed">
                Closed ({closedLoans.length})
              </TabsTrigger>
            </TabsList>
            <TabsContent value="active" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredActive.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No active loans
                </div>
              ) : (
                <LoansTable loans={filteredActive} />
              )}
            </TabsContent>
            <TabsContent value="closed" className="mt-4">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredClosed.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No closed loans
                </div>
              ) : (
                <LoansTable loans={filteredClosed} />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

function LoansTable({ loans }: { loans: {
  id: number
  member_name: string
  loan_amount: number
  loan_month: string
  loan_type: string
  due_amount: number
  loan_installment: number
  interest: number
  rec_interest_no: number
  installment_number: number
  status: string
}[] }) {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Principal</TableHead>
            <TableHead className="text-right">Interest</TableHead>
            <TableHead className="text-right">EMI</TableHead>
            <TableHead className="text-right">Due</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Start Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loans.map((loan) => (
            <TableRow key={loan.id}>
              <TableCell className="font-medium">{loan.member_name}</TableCell>
              <TableCell>
                <Badge variant={loan.loan_type === "normal" ? "default" : "secondary"}>
                  {loan.loan_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(loan.loan_amount)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(loan.interest)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(loan.loan_installment)}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(loan.due_amount)}
              </TableCell>
              <TableCell>
                <span className="text-sm">
                  {loan.rec_interest_no}/{loan.installment_number}
                </span>
              </TableCell>
              <TableCell>
                {format(new Date(loan.loan_month), "MMM yyyy")}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
