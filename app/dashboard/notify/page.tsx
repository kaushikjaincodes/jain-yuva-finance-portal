"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Spinner } from "@/components/ui/spinner"
import { Mail, Send, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function NotifyPage() {
  const { data, error, isLoading } = useSWR("/api/members", fetcher)
  const [selectedMembers, setSelectedMembers] = useState<number[]>([])
  const [isSending, setIsSending] = useState(false)

  const members = data?.members?.filter((m: { email: string }) => m.email) || []

  const handleSelectAll = () => {
    if (selectedMembers.length === members.length) {
      setSelectedMembers([])
    } else {
      setSelectedMembers(members.map((m: { id: number }) => m.id))
    }
  }

  const handleSelectMember = (id: number) => {
    if (selectedMembers.includes(id)) {
      setSelectedMembers(selectedMembers.filter((m) => m !== id))
    } else {
      setSelectedMembers([...selectedMembers, id])
    }
  }

  const handleSendNotifications = async () => {
    if (selectedMembers.length === 0) {
      toast.error("Please select at least one member")
      return
    }

    setIsSending(true)

    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberIds: selectedMembers }),
      })

      const result = await res.json()

      if (res.ok) {
        toast.success(`Notifications sent to ${result.sent} members`)
        setSelectedMembers([])
      } else {
        toast.error(result.error || "Failed to send notifications")
      }
    } catch {
      toast.error("An error occurred")
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notify Members</h1>
          <p className="text-muted-foreground">
            Send monthly reports to members via email
          </p>
        </div>
        <Button
          onClick={handleSendNotifications}
          disabled={isSending || selectedMembers.length === 0}
        >
          {isSending ? (
            <>
              <Spinner className="mr-2" />
              Sending...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send to Selected ({selectedMembers.length})
            </>
          )}
        </Button>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Email Configuration Required</AlertTitle>
        <AlertDescription>
          To enable email notifications, configure your email service (SendGrid, Resend, or SMTP) 
          in the environment variables. Members without email addresses will not appear in this list.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Members with Email
          </CardTitle>
          <CardDescription>
            Select members to receive their personalized PDF report
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
              Failed to load members
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No members with email addresses found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedMembers.length === members.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member: {
                    id: number
                    name: string
                    email: string
                    status: string
                  }) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedMembers.includes(member.id)}
                          onCheckedChange={() => handleSelectMember(member.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{member.name}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell className="capitalize">{member.status}</TableCell>
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
