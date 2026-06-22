"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search, TrendingUp, ArrowUp, ArrowDown } from "lucide-react"
import { useAnimatedCounter } from "@/lib/use-animated-counter"
import { ConnectionWarning } from "@/components/dashboard/connection-warning"

function AnimatedStatCard({
  title,
  icon: Icon,
  end,
  unit,
  trend,
  trendUp,
  sparklineData,
}: {
  title: string
  icon: any
  end: number
  unit?: string
  trend?: string
  trendUp?: boolean
  sparklineData?: number[]
}) {
  const { count, ref } = useAnimatedCounter({ end })

  return (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent>
        <div ref={ref} className="text-2xl font-bold">
          {count}{unit || ""}
        </div>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trendUp ? (
              <ArrowUp className="h-3 w-3 text-green-400" />
            ) : (
              <ArrowDown className="h-3 w-3 text-red-400" />
            )}
            <span className={trendUp ? "text-green-400" : "text-red-400"}>{trend}</span>
          </div>
        )}
        {sparklineData && (
          <svg className="mt-2 h-8 w-full" viewBox="0 0 100 20" preserveAspectRatio="none">
            <path
              d={sparklineData
                .map(
                  (v, i) =>
                    `${i === 0 ? "M" : "L"} ${(i / (sparklineData.length - 1)) * 100} ${20 - (v / Math.max(...sparklineData)) * 18}`
                )
                .join(" ")}
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        )}
      </CardContent>
    </Card>
  )
}

function StatSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="skeleton-text-short" />
        <div className="h-4 w-4 skeleton" />
      </CardHeader>
      <CardContent>
        <div className="skeleton-text" />
        <div className="skeleton-text-short" />
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/login")
      } else {
        setUser(data.user)
      }
      setLoading(false)
    })
  }, [router])

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="skeleton-text" />
          <div className="skeleton-text-short" />
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <ConnectionWarning />
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.email?.split("@")[0] || "there"}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatedStatCard
          title="Active Reports"
          icon={FileText}
          end={12}
          trend="+3 this week"
          trendUp
          sparklineData={[3, 5, 4, 6, 8, 10, 12]}
        />
        <AnimatedStatCard
          title="Brand Monitors"
          icon={Search}
          end={8}
          trend="+2 this week"
          trendUp
          sparklineData={[2, 3, 3, 4, 5, 7, 8]}
        />
        <AnimatedStatCard
          title="Reports Generated"
          icon={TrendingUp}
          end={47}
          trend="+12 this month"
          trendUp
          sparklineData={[5, 8, 12, 18, 25, 34, 47]}
        />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="space-y-0">
            {[
              { action: "Report generated", detail: "Monthly SEO Audit — Acme Corp", time: "2 hours ago" },
              { action: "Brand scan completed", detail: "TechNova — 12 new mentions", time: "5 hours ago" },
              { action: "Invoice paid", detail: "INV-0042 — $2,400.00", time: "1 day ago" },
              { action: "Content brief created", detail: "AI Marketing Tools 2026", time: "2 days ago" },
            ].map((item, i) => (
              <div
                key={i}
                className="reveal flex items-center justify-between border-b border-border py-3 last:border-0"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <div>
                  <p className="text-sm font-medium">{item.action}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
