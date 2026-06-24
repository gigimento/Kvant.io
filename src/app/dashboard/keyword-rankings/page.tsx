"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2, Plus, Trash2, Search, TrendingUp, Target, CalendarDays, BarChart3, Globe } from "lucide-react"
import { useToast } from "@/lib/use-toast"

interface KeywordRanking {
  id: string
  keyword: string
  target_url: string
  current_position: number
  best_position: number
  search_volume: number
  serp_features: string[]
  last_checked_at: string
  created_at: string
}

interface RankHistory {
  keyword_id: string
  position: number
  checked_at: string
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

function MiniSparkline({ history }: { history: number[] }) {
  if (!history || history.length < 2) return null

  const width = 80
  const height = 28
  const max = Math.max(...history, 1)
  const min = Math.min(...history, 0)
  const range = max - min || 1

  const points = history.map((val, i) => {
    const x = (i / (history.length - 1)) * width
    const y = height - ((val - min) / range) * (height - 4) - 2
    return `${x},${y}`
  })

  const pathD = points.map((p, i) => (i === 0 ? `M${p}` : `L${p}`)).join(" ")

  const isGoodTrend = history[history.length - 1] <= history[0]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <path d={pathD} fill="none" stroke={isGoodTrend ? "#22c55e" : "#ef4444"} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function KeywordRankingsPage() {
  const router = useRouter()
  const { addToast } = useToast()
  const [keywords, setKeywords] = useState<KeywordRanking[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newKeyword, setNewKeyword] = useState("")
  const [newTargetUrl, setNewTargetUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [rankHistory, setRankHistory] = useState<Record<string, number[]>>({})
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      fetchKeywords()
    })
  }, [router])

  async function fetchKeywords() {
    try {
      const res = await fetch("/api/keyword-rankings")
      const data = await res.json()
      if (Array.isArray(data)) {
        setKeywords(data)
        // Fetch rank history for all keywords
        const historyMap: Record<string, number[]> = {}
        await Promise.all(
          data.map(async (kw: KeywordRanking) => {
            try {
              const hres = await fetch(`/api/keyword-rankings/history?id=${kw.id}`)
              const hdata = await hres.json()
              if (Array.isArray(hdata) && hdata.length > 0) {
                historyMap[kw.id] = hdata.map((h: RankHistory) => h.position)
              }
            } catch {}
          })
        )
        setRankHistory(historyMap)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  async function handleAddKeyword(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyword.trim() || !newTargetUrl.trim()) {
      addToast("Please fill in both keyword and target URL", "error")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/keyword-rankings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: newKeyword.trim(), target_url: newTargetUrl.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        addToast(err.error || "Failed to add keyword", "error")
        return
      }
      const added = await res.json()
      setKeywords((prev) => [added, ...prev])
      setNewKeyword("")
      setNewTargetUrl("")
      setShowForm(false)
      addToast(`Tracking "${added.keyword}"`, "success")
    } catch {
      addToast("Failed to add keyword", "error")
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/keyword-rankings?id=${id}`, { method: "DELETE" })
      if (!res.ok) {
        addToast("Failed to delete keyword", "error")
        return
      }
      setKeywords((prev) => prev.filter((k) => k.id !== id))
      addToast("Keyword removed", "info")
    } catch {
      addToast("Failed to delete keyword", "error")
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold">Keyword Rank Tracker</h1>
          <p className="text-muted-foreground">Track your keyword positions in Google SERP</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-fade-in" style={{ animationDelay: `${i * 50}ms` }}>
              <CardContent className="p-6 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <div className="flex items-center gap-3 pt-2">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1.5">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">Keyword Rank Tracker</h1>
          <p className="text-muted-foreground">Track your keyword positions in Google SERP</p>
        </div>
        <Button onClick={() => setShowForm((prev) => !prev)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Add Keyword
        </Button>
      </div>

      {/* Add Keyword Form */}
      {showForm && (
        <Card className="animate-fade-in border-accent/20">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Search className="h-4 w-4 text-accent" />
              Track New Keyword
            </CardTitle>
            <CardDescription>Enter a keyword and the URL you want to rank for it</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddKeyword} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="keyword">Keyword</Label>
                  <Input
                    id="keyword"
                    placeholder="e.g. seo agency new york"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="target_url">Target URL</Label>
                  <Input
                    id="target_url"
                    placeholder="https://yoursite.com/service"
                    value={newTargetUrl}
                    onChange={(e) => setNewTargetUrl(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={submitting}>
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Adding...</>
                  ) : (
                    <><Search className="h-4 w-4 mr-1" /> Track Keyword</>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keywords Grid */}
      {keywords.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {keywords.map((kw, i) => (
            <Card
              key={kw.id}
              className="animate-fade-in group relative"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{kw.keyword}</h3>
                    <p className="text-xs text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                      <Globe className="h-3 w-3 shrink-0" />
                      {kw.target_url}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
                    onClick={() => handleDelete(kw.id)}
                    disabled={deleting === kw.id}
                  >
                    {deleting === kw.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div
                    className={`flex items-center justify-center h-14 w-14 rounded-xl border ${getPositionBg(kw.current_position)}`}
                  >
                    <span className={`text-2xl font-bold ${getPositionColor(kw.current_position)}`}>
                      #{kw.current_position}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <TrendingUp className="h-3 w-3" />
                      Best: <span className="font-medium text-white">#{kw.best_position}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BarChart3 className="h-3 w-3" />
                      Volume: <span className="font-medium text-white">{kw.search_volume || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3 w-3" />
                      {kw.last_checked_at
                        ? new Date(kw.last_checked_at).toLocaleDateString()
                        : "Not checked"}
                    </div>
                  </div>
                  <div className="ml-auto self-center">
                    {rankHistory[kw.id] && rankHistory[kw.id].length >= 2 && (
                      <MiniSparkline history={rankHistory[kw.id]} />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="text-center py-16 animate-fade-in">
          <CardContent>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Target className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">No keywords tracked yet</h3>
            <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
              Add your first keyword to start tracking its position in Google search results.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Keyword
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
