"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Search, Link2, ScanLine, BarChart3, TrendingUp, Target, Globe,
  ArrowUp, ArrowDown, ExternalLink, AlertTriangle, CheckCircle,
  XCircle, ChevronRight, Zap, FileText, SearchCode,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/lib/use-toast"

interface AuditData {
  keywords: {
    total: number
    avgPosition: number | null
    top5: number
    top10: number
    items: any[]
  }
  backlinks: {
    total: number
    lost: number
    active: number
    avgDomainAuthority: number | null
    items: any[]
  }
  citations: {
    total: number
    avgVisibility: number | null
    items: any[]
  }
  competitive: {
    snapshots: number
    items: any[]
  }
  connections: {
    ga4: boolean
    googleAds: boolean
    metaAds: boolean
  }
}

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string | number; sub?: string; icon: any; color: string }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      {ok ? (
        <CheckCircle className="h-4 w-4 text-green-400" />
      ) : (
        <XCircle className="h-4 w-4 text-red-400" />
      )}
      <span className={ok ? "text-muted-foreground" : "text-red-400"}>{label}</span>
    </div>
  )
}

function getPositionColor(position: number): string {
  if (position <= 5) return "text-green-400"
  if (position <= 15) return "text-yellow-400"
  if (position <= 30) return "text-orange-400"
  return "text-red-400"
}

function getPositionBg(position: number): string {
  if (position <= 5) return "bg-green-500/10 border-green-500/20"
  if (position <= 15) return "bg-yellow-500/10 border-yellow-500/20"
  if (position <= 30) return "bg-orange-500/10 border-orange-500/20"
  return "bg-red-500/10 border-red-500/20"
}

export default function SEOAuditPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [data, setData] = useState<AuditData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      fetchAudit()
    })
  }, [router])

  async function fetchAudit() {
    try {
      const res = await fetch("/api/seo-audit")
      if (!res.ok) { addToast("Failed to load audit data", "error"); return }
      const json = await res.json()
      setData(json)
    } catch { addToast("Failed to load audit data", "error") }
    finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div><h1 className="text-2xl font-bold">SEO Audit</h1><p className="text-muted-foreground">Unified overview of your SEO performance</p></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="p-5 space-y-3"><Skeleton className="h-3 w-20" /><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        <Card><CardContent className="p-6"><Skeleton className="h-64 w-full" /></CardContent></Card>
      </div>
    )
  }

  const connCount = [data?.connections.ga4, data?.connections.googleAds, data?.connections.metaAds].filter(Boolean).length

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">SEO Audit</h1>
          <p className="text-muted-foreground">Unified overview of your SEO performance</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge ok={connCount >= 2} label={`${connCount}/3 sources connected`} />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Keywords Tracked"
          value={data?.keywords.total || 0}
          sub={data?.keywords.avgPosition ? `Avg position #${data.keywords.avgPosition}` : undefined}
          icon={SearchCode}
          color="bg-blue-500/10 text-blue-400"
        />
        <StatCard
          label="Active Backlinks"
          value={data?.backlinks.active || 0}
          sub={data?.backlinks.avgDomainAuthority ? `Avg DA ${data.backlinks.avgDomainAuthority}` : undefined}
          icon={Link2}
          color="bg-purple-500/10 text-purple-400"
        />
        <StatCard
          label="Citations Found"
          value={data?.citations.total || 0}
          sub={data?.citations.avgVisibility ? `Avg visibility ${data.citations.avgVisibility}%` : undefined}
          icon={ScanLine}
          color="bg-amber-500/10 text-amber-400"
        />
        <StatCard
          label="Competitive Snapshots"
          value={data?.competitive.snapshots || 0}
          icon={BarChart3}
          color="bg-emerald-500/10 text-emerald-400"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Keywords Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Target className="h-4 w-4 text-accent" />
                Keyword Positions
              </CardTitle>
              <CardDescription>Top 5 / Top 10: {data?.keywords.top5 || 0} / {data?.keywords.top10 || 0}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/keyword-rankings">View All <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.keywords?.items && data.keywords.items.length > 0 ? (
              data.keywords.items.slice(0, 6).map((kw: any) => (
                <div key={kw.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{kw.keyword}</p>
                    <p className="text-xs text-muted-foreground truncate">{kw.target_url}</p>
                  </div>
                  <div className={`ml-3 flex items-center justify-center h-10 w-10 rounded-lg border ${getPositionBg(kw.current_position)}`}>
                    <span className={`text-sm font-bold ${getPositionColor(kw.current_position)}`}>#{kw.current_position}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <SearchCode className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No keywords tracked yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Backlinks Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Link2 className="h-4 w-4 text-accent" />
                Backlink Monitor
              </CardTitle>
              <CardDescription>{data?.backlinks.active || 0} active, {data?.backlinks.lost || 0} lost</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/backlinks">View All <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.backlinks?.items && data.backlinks.items.length > 0 ? (
              data.backlinks.items.slice(0, 6).map((bl: any) => (
                <div key={bl.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{bl.referring_domain}</p>
                    <p className="text-xs text-muted-foreground truncate">{bl.target_url}</p>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    <Badge variant={bl.is_lost ? "danger" : "default"} className="text-[10px]">
                      {bl.is_lost ? "Lost" : "Active"}
                    </Badge>
                    {bl.domain_authority && (
                      <span className="text-xs text-muted-foreground">DA {bl.domain_authority}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <Link2 className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No backlinks tracked yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Citations Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <ScanLine className="h-4 w-4 text-accent" />
                AI Citations
              </CardTitle>
              <CardDescription>Brand mentions across LLMs</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/dashboard/citation-audit">View All <ChevronRight className="h-3 w-3 ml-0.5" /></Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {data?.citations?.items && data.citations.items.length > 0 ? (
              data.citations.items.map((c: any) => (
                <div key={c.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${c.is_mentioned ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
                      {c.model?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{c.model || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">{c.is_mentioned ? "Mentioned" : "Not found"}</p>
                    </div>
                  </div>
                  <Badge variant={c.is_mentioned ? "default" : "secondary"} className="text-[10px]">
                    {c.is_mentioned ? "Found" : "Missing"}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                <ScanLine className="h-8 w-8 mx-auto mb-2 opacity-40" />
                No citation data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Connections Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4 text-accent" />
              Data Sources
            </CardTitle>
            <CardDescription>Connection status for analytics data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusBadge ok={!!data?.connections.ga4} label="Google Analytics 4 (GA4)" />
            <StatusBadge ok={!!data?.connections.googleAds} label="Google Ads" />
            <StatusBadge ok={!!data?.connections.metaAds} label="Meta Ads" />
            <div className="pt-4">
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href="/dashboard/connections">
                  <Zap className="h-3.5 w-3.5 mr-1.5" />
                  Manage Connections
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
