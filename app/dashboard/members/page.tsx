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
import { FieldGroup, Field, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Plus, Search } from "lucide-react"
import { ExportButton } from "@/components/export-button"
import { GenerateLedgerPDF } from "@/components/generate-ledger-pdf"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export default function MembersPage() {
  const { data, error, isLoading, mutate } = useSWR("/api/members", fetcher)
  const [search, setSearch] = useState("")
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    monthly_contribution: "",
    standard_contribution: "",
  })

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAdding(true)

    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          monthly_contribution: Number(formData.monthly_contribution),
          standard_contribution: Number(formData.standard_contribution),
        }),
      })

      if (res.ok) {
        setIsAddOpen(false)
        setFormData({
          name: "",
          email: "",
          phone: "",
          monthly_contribution: "",
          standard_contribution: "",
        })
        mutate()
      }
    } catch (error) {
      console.error("Error adding member:", error)
    } finally {
      setIsAdding(false)
    }
  }

  const filteredMembers = data?.members?.filter((member: { name: string }) =>
    member.name.toLowerCase().includes(search.toLowerCase())
  ) || []

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Members</h1>
          <p className="text-muted-foreground">Manage trust members</p>
        </div>
        <div className="flex gap-2">
          <ExportButton
            data={filteredMembers}
            filename="members"
            columns={["name", "email", "phone", "monthly_contribution", "per_member_contribution", "status"]}
          />
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Member</DialogTitle>
                <DialogDescription>
                  Add a new member to the trust
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddMember}>
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="name">Name</FieldLabel>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="phone">Phone</FieldLabel>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="monthly_contribution">
                      Monthly Contribution
                    </FieldLabel>
                    <Input
                      id="monthly_contribution"
                      type="number"
                      value={formData.monthly_contribution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          monthly_contribution: e.target.value,
                        })
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="standard_contribution">
                      Standard Contribution (for old member status)
                    </FieldLabel>
                    <Input
                      id="standard_contribution"
                      type="number"
                      value={formData.standard_contribution}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          standard_contribution: e.target.value,
                        })
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
                      "Add Member"
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
                placeholder="Search members..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
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
              Failed to load members
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Monthly</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member: {
                    id: number
                    name: string
                    email: string
                    phone: string
                    monthly_contribution: number
                    per_member_contribution: number
                    status: string
                  }) => (
                    <TableRow key={member.id}>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email || "-"}</TableCell>
                      <TableCell>{member.phone || "-"}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(member.monthly_contribution)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(member.per_member_contribution)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={member.status === "old" ? "default" : "secondary"}
                        >
                          {member.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <GenerateLedgerPDF memberId={member.id} memberName={member.name} />
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
