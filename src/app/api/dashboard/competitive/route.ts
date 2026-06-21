import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await checkServerAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason === "subscription_required" ? "Subscription required. Start a free trial to access this feature." : "Unauthorized" }, { status: 402 })
    }

    const { data: monitors } = await supabase
      .from("brand_monitors")
      .select("id, brand_name, keywords")
      .eq("user_id", user.id)

    if (!monitors || monitors.length === 0) {
      return NextResponse.json({
        totalMentions: 0,
        avgSentiment: 0,
        competitorsCount: 0,
        thisMonthMentions: 0,
        timeline: [],
        sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
      })
    }

    const monitorIds = monitors.map(m => m.id)

    const { data: mentions } = await supabase
      .from("brand_mentions")
      .select("id, query, sentiment, scanned_at, monitor_id")
      .in("monitor_id", monitorIds)

    const totalMentions = mentions?.length || 0

    const positive = mentions?.filter(m => m.sentiment === "positive").length || 0
    const negative = mentions?.filter(m => m.sentiment === "negative").length || 0
    const neutral = mentions?.filter(m => m.sentiment === "neutral" || m.sentiment === "mixed").length || 0

    const avgSentiment = totalMentions > 0
      ? Math.round(((positive - negative) / totalMentions) * 100)
      : 0

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthMentions = mentions?.filter(m => {
      const d = new Date(m.scanned_at)
      return d >= startOfMonth
    }).length || 0

    const monitorMap = new Map(monitors.map(m => [m.id, m.brand_name]))

    const timelineMap = new Map<string, { date: string; keyword: string; count: number; sentiment: string }>()

    for (const mention of mentions || []) {
      const brandName = monitorMap.get(mention.monitor_id) || "Unknown"
      const date = mention.scanned_at?.split("T")[0]?.slice(0, 10)
      if (!date) continue

      const key = `${date}|${brandName}`
      const existing = timelineMap.get(key)
      if (existing) {
        existing.count++
      } else {
        timelineMap.set(key, { date, keyword: brandName, count: 1, sentiment: mention.sentiment })
      }
    }

    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      totalMentions,
      avgSentiment,
      competitorsCount: monitors.length,
      thisMonthMentions,
      timeline,
      sentimentBreakdown: { positive, neutral, negative },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
