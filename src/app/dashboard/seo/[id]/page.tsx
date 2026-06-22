"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Search, Sparkles, ThumbsUp, ThumbsDown, Minus } from "lucide-react"
import Link from "next/link"
import { formatDate } from "@/lib/utils"
import { SubscriptionGate } from "@/components/dashboard/subscription-gate"

function SentimentDonut({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral
  if (total === 0) return <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">No data</div>

  const posPct = positive / total
  const negPct = negative / total
  const neuPct = neutral / total

  const radius = 50
  const circum = 2 * Math.PI * radius
  const posLen = circum * posPct
  const negLen = circum * negPct
  const neuLen = circum * neuPct

  return (
    <div className="flex items-center gap-6">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="16" />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#22c55e" strokeWidth="16"
          strokeDasharray={`${posLen} ${circum - posLen}`}
          strokeDashoffset={-neuLen - negLen}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#ef4444" strokeWidth="16"
          strokeDasharray={`${negLen} ${circum - negLen}`}
          strokeDashoffset={-neuLen}
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
        <circle cx="60" cy="60" r={radius} fill="none" stroke="#a855f7" strokeWidth="16"
          strokeDasharray={`${neuLen} ${circum - neuLen}`}
          strokeDashoffset="0"
          transform="rotate(-90 60 60)"
          strokeLinecap="round"
        />
      </svg>
      <div className="space-y-1.5">
        <div className="flex items-center gap-2 text-xs"><ThumbsUp className="h-3.5 w-3.5 text-green-400" /> <span className="text-muted-foreground">Positive</span> <span className="font-medium">{positive}</span></div>
        <div className="flex items-center gap-2 text-xs"><ThumbsDown className="h-3.5 w-3.5 text-red-400" /> <span className="text-muted-foreground">Negative</span> <span className="font-medium">{negative}</span></div>
        <div className="flex items-center gap-2 text-xs"><Minus className="h-3.5 w-3.5 text-purple-400" /> <span className="text-muted-foreground">Neutral</span> <span className="font-medium">{neutral}</span></div>
      </div>
    </div>
  )
}

export default function MonitorDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [monitor, setMonitor] = useState<any>(null)
  const [mentions, setMentions] = useState<any[]>([])
  const [scanning, setScanning] = useState(false)
  const [loading, setLoading] = useState(true)

  async function loadData() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }
    const { data: mon } = await supabase.from("brand_monitors").select("*").eq("id", params.id).single()
    setMonitor(mon)
    const { data: mnts } = await supabase.from("brand_mentions").select("*").eq("monitor_id", params.id).order("scanned_at", { ascending: false })
    setMentions(mnts || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [params.id])

  async function handleScan() {
    setScanning(true)
    try {
      const res = await fetch("/api/seo/scan", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ monitorId: params.id }) })
      if (!res.ok) {
        const err = await res.json()
        alert(`Scan failed: ${err.error || res.statusText}`)
        return
      }
      await loadData()
    } catch (e: any) {
      alert(`Network error: ${e.message}`)
    } finally {
      setScanning(false)
    }
  }

  const positiveMentions = mentions.filter((m) => m.sentiment === "positive").length
  const negativeMentions = mentions.filter((m) => m.sentiment === "negative").length
  const neutralMentions = mentions.filter((m) => m.sentiment === "neutral").length
  const totalMentions = mentions.length
  const sentimentScore = totalMentions > 0 ? Math.round((positiveMentions / totalMentions) * 100) : 0

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <div className="skeleton-text-short" />
          <div className="skeleton-text" />
          <div className="skeleton-text-short" />
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <div className="skeleton-card" />
          <div className="skeleton-card" />
          <div className="skeleton-card" />
        </div>
      </div>
    )
  }
  if (!monitor) return <div className="text-center py-16"><p className="text-muted-foreground">Monitor not found.</p><Button className="mt-4" asChild><Link href="/dashboard/seo">Back</Link></Button></div>

  return (
    <SubscriptionGate>
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div>
          <Link href="/dashboard/seo" className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>
          <h1 className="text-2xl font-bold">{monitor.brand_name}</h1>
          <p className="text-muted-foreground">{(monitor.competitors as any[])?.join(", ") || "No competitors"} &middot; {monitor.schedule}</p>
        </div>
        <Button onClick={handleScan} disabled={scanning}>
          {scanning ? <><Sparkles className="mr-1 h-4 w-4 animate-spin" /> Scanning...</> : <><Sparkles className="mr-1 h-4 w-4" /> Run Scan</>}
        </Button>
      </div>

      <div className="grid gap-6 sm:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{totalMentions}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Positive</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">{positiveMentions}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Negative</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold text-red-400">{negativeMentions}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sentiment Score</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold">{sentimentScore}%</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Sentiment Breakdown</CardTitle></CardHeader>
        <CardContent>
          <SentimentDonut positive={positiveMentions} negative={negativeMentions} neutral={neutralMentions} />
        </CardContent>
      </Card>

      {mentions.length === 0 ? (
        <Card className="text-center py-12 animate-fade-in-blur">
          <CardContent>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center animate-float-icon">
              <Search className="h-8 w-8 text-accent/60" />
            </div>
            <div className="animate-glow-pulse rounded-2xl p-6">
              <h3 className="font-semibold">No scans yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">Run your first scan to see brand mentions.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {mentions.map((m, i) => (
            <Card key={m.id} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
              <CardHeader className="flex flex-row items-center justify-between py-3">
                <div className="flex items-center gap-2">
                  <Badge variant={m.sentiment === "positive" ? "success" : m.sentiment === "negative" ? "danger" : "secondary"}>{m.sentiment}</Badge>
                  <span className="text-sm font-medium">{m.query}</span>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(m.scanned_at)}</span>
              </CardHeader>
              {m.context_snippet && <CardContent className="pb-3"><p className="text-xs text-muted-foreground line-clamp-3">{m.context_snippet}</p></CardContent>}
            </Card>
          ))}
        </div>
      )}
    </div>
    </SubscriptionGate>
  )
}
