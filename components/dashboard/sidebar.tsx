"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  Wallet,
  AlertTriangle,
  BarChart3,
  ClipboardCheck,
  FileText,
  Settings,
} from "lucide-react"

const navItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Members",
    href: "/dashboard/members",
    icon: Users,
  },
  {
    title: "Monthly Checklist",
    href: "/dashboard/checklist",
    icon: ClipboardCheck,
  },
  {
    title: "Loans",
    href: "/dashboard/loans",
    icon: Wallet,
  },
  {
    title: "Penalties",
    href: "/dashboard/penalties",
    icon: AlertTriangle,
  },
  {
    title: "Trust Statistics",
    href: "/dashboard/statistics",
    icon: BarChart3,
  },
  {
    title: "Monthly Financials",
    href: "/dashboard/financials",
    icon: FileText,
  },
  {
    title: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-card">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">JYS</span>
          </div>
          <span className="font-semibold text-lg">Jain Yuva Seva Sangathan Samiti</span>
        </Link>
      </div>
      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.title}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </aside>
  )
}
