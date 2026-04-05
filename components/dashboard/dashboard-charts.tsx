"use client"

import useSWR from "swr"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function DashboardCharts() {
  const { data, isLoading, error } = useSWR("/api/dashboard/chart-data", fetcher)

  if (isLoading) {
    return <Skeleton className="h-[300px] w-full" />
  }

  if (error || !data?.data) {
    return (
      <div className="h-[300px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart
        data={data.data}
        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
      >
        <defs>
          <linearGradient id="colorDeposit" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInterest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.8} />
            <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
          </linearGradient>
        </defs>
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            borderColor: "hsl(var(--border))",
            borderRadius: "8px",
          }}
          formatter={(value: number) =>
            new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
              maximumFractionDigits: 0,
            }).format(value)
          }
        />
        <Area
          type="monotone"
          dataKey="deposit"
          stroke="hsl(var(--chart-1))"
          fillOpacity={1}
          fill="url(#colorDeposit)"
          name="Deposits"
        />
        <Area
          type="monotone"
          dataKey="interest"
          stroke="hsl(var(--chart-2))"
          fillOpacity={1}
          fill="url(#colorInterest)"
          name="Interest"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
