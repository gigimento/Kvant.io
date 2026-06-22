import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { buildNarrativePrompt } from "@/lib/llm/prompts/narrative"

export async function GET(request: Request) {
  if (request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: configs } = await supabase
    .from("report_configs")
    .select("*")
    .eq("is_active", true)
    .lte("next_run_at", new Date().toISOString())

  if (!configs?.length) {
    return NextResponse.json({ success: true, dispatched: 0 })
  }

  const periodEnd = new Date()
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 30)

  let dispatched = 0
  for (const config of configs) {
    const mockData = {
      clientName: config.client_name,
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      metrics: {
        sessions: 12543, users: 8932, pageviews: 45231,
        bounceRate: 38.5, avgSessionDuration: 187,
        sessionsChange: 12.3, usersChange: 8.7,
        topPages: [
          { path: "/pricing", views: 4521 },
          { path: "/blog/top-10-tips", views: 3210 },
          { path: "/features", views: 2890 },
        ],
        sessionsBySource: [
          { source: "Organic Search", sessions: 4520 },
          { source: "Direct", sessions: 3210 },
          { source: "Social", sessions: 2340 },
        ],
      },
    }

    const prompt = buildNarrativePrompt(mockData)

    const { data: report } = await supabase
      .from("reports")
      .insert({
        config_id: config.id,
        user_id: config.user_id,
        client_name: config.client_name,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        raw_data: mockData,
        narrative_prompt: prompt,
        status: "pending",
      })
      .select()
      .single()

    if (!report) continue

    const nextRun = new Date()
    if (config.schedule === "weekly") {
      nextRun.setDate(nextRun.getDate() + 7)
    } else {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
    await supabase.from("report_configs").update({
      next_run_at: nextRun.toISOString(),
    }).eq("id", config.id)

    // Dispatch to process-single via internal fetch (fire-and-forget)
    const origin = request.headers.get("origin") || request.headers.get("host") || "localhost:3000"
    const baseUrl = origin.startsWith("http") ? origin : `https://${origin}`
    fetch(`${baseUrl}/api/reports/process-single`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportId: report.id }),
    }).catch(() => {})

    dispatched++
  }

  return NextResponse.json({ success: true, dispatched })
}
