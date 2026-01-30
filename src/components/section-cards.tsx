"use client"

import { useEffect, useMemo, useState } from "react"
import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

/* ---------------- TYPES ---------------- */

type Bill = {
  id: string
  total: number
  customerName?: string
  createdAt: string
}

/* ---------------- COMPONENT ---------------- */

export function SectionCards() {
  const [bills, setBills] = useState<Bill[]>([])
  const [loading, setLoading] = useState(true)

  /* Fetch generated bills */
  useEffect(() => {
    fetch("/api/billing")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setBills(data || []))
      .finally(() => setLoading(false))
  }, [])

  /* ---------------- METRICS ---------------- */

  const metrics = useMemo(() => {
    if (!bills.length) {
      return {
        revenue: 0,
        billCount: 0,
        customers: 0,
        growth: 0,
      }
    }

    const revenue = bills.reduce((sum, b) => sum + (b.total || 0), 0)

    const customers = new Set(
      bills.map((b) => b.customerName).filter(Boolean)
    ).size

    // Simple growth: last 7 days vs previous 7 days
    const now = new Date()
    const last7 = bills.filter(
      (b) => now.getTime() - new Date(b.createdAt).getTime() <= 7 * 86400000
    )
    const prev7 = bills.filter(
      (b) => {
        const diff = now.getTime() - new Date(b.createdAt).getTime()
        return diff > 7 * 86400000 && diff <= 14 * 86400000
      }
    )

    const growth =
      prev7.length === 0
        ? 100
        : Math.round(((last7.length - prev7.length) / prev7.length) * 100)

    return {
      revenue,
      billCount: bills.length,
      customers,
      growth,
    }
  }, [bills])

  /* ---------------- UI DATA ---------------- */

  const cards = [
    {
      title: "Total Revenue",
      value: `₹${metrics.revenue.toLocaleString()}`,
      trend: metrics.growth,
      desc: "Revenue from all generated bills",
    },
    {
      title: "Total Bills",
      value: metrics.billCount.toLocaleString(),
      trend: metrics.growth,
      desc: "Bills generated so far",
    },
    {
      title: "Active Customers",
      value: metrics.customers.toLocaleString(),
      trend: metrics.growth,
      desc: "Unique customers billed",
    },
    {
      title: "Weekly Growth",
      value: `${metrics.growth}%`,
      trend: metrics.growth,
      desc: "Compared to last week",
    },
  ]

  /* ---------------- RENDER ---------------- */

  return (
    <div
      className="
        grid gap-4
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        px-4 lg:px-6
      "
    >
      {cards.map((c) => (
        <Card key={c.title} className="@container/card">
          <CardHeader>
            <CardDescription>{c.title}</CardDescription>

            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              {loading ? "—" : c.value}
            </CardTitle>

            <CardAction>
              <Badge variant="outline">
                {c.trend >= 0 ? (
                  <IconTrendingUp className="mr-1 size-4" />
                ) : (
                  <IconTrendingDown className="mr-1 size-4" />
                )}
                {Math.abs(c.trend)}%
              </Badge>
            </CardAction>
          </CardHeader>

          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="flex gap-2 font-medium">
              {c.trend >= 0 ? "Trending up" : "Trending down"}
            </div>
            <div className="text-muted-foreground">{c.desc}</div>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
