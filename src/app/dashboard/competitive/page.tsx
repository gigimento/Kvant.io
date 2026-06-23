"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, BarChart3, Users, CalendarDays, Search, ArrowRight } from "lucide-react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts"

const COLORS = ["#E19C63", "#8BA5BE", "#27262E", "#c77d3d", "#6b8dae", "#4a4854"]
const SENTIMENT_COLORS = { positive: "#22c55e", neutral: "#8BA5BE", negative: "#ef4444" }

interface TimelineItem { date: string; keyword: string; count: number; sentiment: string }
interface DashboardData {
  totalMentions: number; avgSentiment: number; competitorsCount: number; thisMonthMentions: number
  timeline: TimelineItem[]; sentimentBreakdown: { positive: number; neutral: number; negative: number }
}

export default function CompetitivePage() {
  const router = useRouter()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [hasMonitors, setHasMonitors] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.push("/login"); return }
      fetch("/api/dashboard/competitive")
        .then(r => r.json())
        .then(res => {
          if (!res.error) {
            setData(res)
            if (res.totalMentions === 0 && res.competitorsCount === 0) setHasMonitors(false)
          }
          setLoading(false)
        })
        .catch(() => setLoading(false))
    })
  }, [router])

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
  }

  if (!hasMonitors) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Competitive Dashboard</h1>
          <p className="text-muted-foreground">Track share of voice and sentiment trends over time</p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Search className="h-12 w-12 text-muted-foreground mb-4" />
            <h2 className="text-lg font-semibold">No brand monitors yet</h2>
            <p className="text-muted-foreground text-sm mt-2 mb-6 text-center max-w-md">
              Add a brand monitor to start tracking LLM mentions, share of voice, and sentiment analysis.
            </p>
            <Button asChild>
              <Link href="/dashboard/seo/new">Create Monitor <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const timelineByDate = data?.timeline.reduce((acc, item) => {
    const existing = acc.find(e => e.date === item.date)
    if (existing) existing.count += item.count
    else acc.push({ date: item.date, count: item.count })
    return acc
  }, [] as { date: string; count: number }[])

  const sentimentPie = data ? [
    { name: "Positive", value: data.sentimentBreakdown.positive, color: SENTIMENT_COLORS.positive },
    { name: "Neutral", value: data.sentimentBreakdown.neutral, color: SENTIMENT_COLORS.neutral },
    { name: "Negative", value: data.sentimentBreakdown.negative, color: SENTIMENT_COLORS.negative },
  ].filter(s => s.value > 0) : []

  const keywords = [...new Set(data?.timeline.map(t => t.keyword) || [])]

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Competitive Dashboard</h1>
          <p className="text-muted-foreground">Track share of voice and sentiment trends over time</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/seo/new"><Search className="h-4 w-4 mr-1" /> New Monitor</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Mentions</CardTitle>
            <TrendingUp className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.totalMentions ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Sentiment</CardTitle>
            <BarChart3 className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.avgSentiment ?? 0}%</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Competitors Tracked</CardTitle>
            <Users className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.competitorsCount ?? 0}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
            <CalendarDays className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{data?.thisMonthMentions ?? 0}</div></CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Share of Voice</CardTitle>
            <CardDescription>Mentions over time</CardDescription>
          </CardHeader>
          <CardContent>
            {timelineByDate && timelineByDate.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={timelineByDate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#8BA5BE" fontSize={12} />
                  <YAxis stroke="#8BA5BE" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#27262E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} labelStyle={{ color: "#E19C63" }} />
                  <Bar dataKey="count" fill="#E19C63" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Sentiment Breakdown</CardTitle>
            <CardDescription>Positive vs Neutral vs Negative</CardDescription>
          </CardHeader>
          <CardContent>
            {sentimentPie.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={sentimentPie} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {sentimentPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#27262E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">No sentiment data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {keywords.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Brand vs Competitors</CardTitle>
            <CardDescription>Mentions by brand</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" stroke="#8BA5BE" fontSize={12} />
                <YAxis stroke="#8BA5BE" fontSize={12} />
                <Tooltip contentStyle={{ background: "#27262E", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }} />
                <Legend />
                {keywords.map((kw, i) => {
                  const kwData = data?.timeline.filter(t => t.keyword === kw)
                    .reduce((acc, t) => {
                      const existing = acc.find(e => e.date === t.date)
                      if (existing) existing.count += t.count
                      else acc.push({ date: t.date, count: t.count })
                      return acc
                    }, [] as { date: string; count: number }[])
                  return <Line key={kw} data={kwData} type="monotone" dataKey="count" name={kw} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ fill: COLORS[i % COLORS.length], r: 4 }} />
                })}
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
