"use client"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

interface Member {
  id: number
  name: string
  status: string
  monthly_contribution: number
  per_member_contribution: number
}

interface RecentActivityProps {
  members: Member[]
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function RecentActivity({ members }: RecentActivityProps) {
  if (members.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-muted-foreground">
        No members yet
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {members.map((member) => {
        const initials = member.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2)

        return (
          <div key={member.id} className="flex items-center gap-4">
            <Avatar>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-none truncate">
                {member.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(member.per_member_contribution)} contributed
              </p>
            </div>
            <Badge variant={member.status === "old" ? "default" : "secondary"}>
              {member.status}
            </Badge>
          </div>
        )
      })}
    </div>
  )
}
