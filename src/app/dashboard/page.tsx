"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Search, TrendingUp, ArrowUp, ArrowDown, DollarSign, PenSquare } from "lucide-react"
import { useAnimatedCounter } from "@/lib/use-animated-counter"
import { ConnectionWarning } from "@/components/dashboard/connection-warning"

interface DashboardStats {
  reportCount: number
  monitorCount: number
  briefCount: number
  calendarEntries: number
  thisMonthReports: number
  trendDelta: number
  trendUp: boolean
  totalRevenue: number
  paidInvoiceCount: number
  recentReports: { id: string; created_at: string }[]
}

function AnimatedStatCard({
  title, icon: Icon, end, unit, trend, trendUp, href,
}: {
  title: string; icon: any; end: number; unit?: string; trend?: string; trendUp?: boolean; href?: string
}) {
  const { count, ref } = useAnimatedCounter({ end })

  const inner = (
    <Card className="relative overflow-hidden cursor-pointer hover:bg-white/[0.03] transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-accent" />
      </CardHeader>
      <CardContent>
        <div ref={ref} className="text-2xl font-bold">
          {unit === "$" ? `$${count}` : `${count}${unit || ""}`}
        </div>
        {trend && (
          <div className="mt-1 flex items-center gap-1 text-xs">
            {trendUp ? <ArrowUp className="h-3 w-3 text-green-400" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
            <span className={trendUp ? "text-green-400" : "text-red-400"}>{trend}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
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
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        router.push("/login")
        return
      }
      setUser(data.user)
      const [profRes, statsRes] = await Promise.all([
        supabase.from("profiles").select("full_name").eq("user_id", data.user.id).single(),
        fetch("/api/dashboard/stats").then(r => r.json()),
      ])
      if (profRes.data) setProfile(profRes.data)
      if (statsRes && !statsRes.error) setStats(statsRes)
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatSkeleton /><StatSkeleton /><StatSkeleton /><StatSkeleton />
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
          Welcome back, {profile?.full_name || user?.email?.split("@")[0] || "there"}
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <AnimatedStatCard
          title="Reports"
          icon={FileText}
          end={stats?.reportCount || 0}
          trend={stats && stats.thisMonthReports > 0
            ? `${stats.trendDelta > 0 ? "+" : ""}${stats.trendDelta}% this month`
            : undefined}
          trendUp={stats?.trendUp}
          href="/dashboard/reports"
        />
        <AnimatedStatCard
          title="Brand Monitors"
          icon={Search}
          end={stats?.monitorCount || 0}
          href="/dashboard/seo"
        />
        <AnimatedStatCard
          title="Content Briefs"
          icon={PenSquare}
          end={stats?.briefCount || 0}
          href="/dashboard/content-briefs"
        />
        <AnimatedStatCard
          title="Revenue"
          icon={DollarSign}
          end={stats?.totalRevenue || 0}
          unit="$"
          href="/dashboard/invoices"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Recent Reports</CardTitle>
          </CardHeader>
          <CardContent>
            {stats && stats.reportCount > 0 ? (
              <div className="space-y-0">
                {(stats.recentReports || []).map((r, i) => (
                  <div key={r.id} className="reveal flex items-center justify-between border-b border-border py-3 last:border-0"
                    style={{ transitionDelay: `${i * 60}ms` }}>
                    <Link href={`/dashboard/reports/${r.id}`} className="text-sm font-medium hover:text-accent transition-colors">
                      Report generated
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No reports yet</p>
                <Link href="/dashboard/reports/new" className="mt-3 inline-block text-sm text-accent hover:underline">
                  Create your first report
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/dashboard/reports/new" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><FileText className="h-4 w-4 text-accent" /></div>
              <div><p className="text-sm font-medium">New Report</p><p className="text-xs text-muted-foreground">Generate a client report with AI</p></div>
            </Link>
            <Link href="/dashboard/content-briefs" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><PenSquare className="h-4 w-4 text-accent" /></div>
              <div><p className="text-sm font-medium">Content Brief</p><p className="text-xs text-muted-foreground">Create an SEO content brief</p></div>
            </Link>
            <Link href="/dashboard/seo" className="flex items-center gap-3 rounded-lg border border-white/5 p-3 hover:bg-white/[0.03] transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10"><Search className="h-4 w-4 text-accent" /></div>
              <div><p className="text-sm font-medium">Brand Scan</p><p className="text-xs text-muted-foreground">Scan LLMs for brand mentions</p></div>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
