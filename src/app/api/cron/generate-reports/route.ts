import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
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
    return NextResponse.json({ success: true, generated: 0 })
  }

  let generated = 0
  for (const config of configs) {
    const periodEnd = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - 30)

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

    const { data: report } = await supabase
      .from("reports")
      .insert({
        config_id: config.id,
        user_id: config.user_id,
        client_name: config.client_name,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        raw_data: mockData,
        status: "generating",
      })
      .select()
      .single()

    if (!report) continue

    try {
      const prompt = buildNarrativePrompt(mockData)
      const llmResponse = await askLLMWithSystem(
        "You are a senior marketing analyst writing client reports.",
        prompt,
        "quality"
      )
      await supabase.from("reports").update({
        narrative_text: llmResponse.content,
        status: "ready",
      }).eq("id", report.id)

      // Update next_run_at based on schedule
      const nextRun = new Date()
      if (config.schedule === "weekly") {
        nextRun.setDate(nextRun.getDate() + 7)
      } else {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      await supabase.from("report_configs").update({
        next_run_at: nextRun.toISOString(),
      }).eq("id", config.id)

      generated++
    } catch {
      await supabase.from("reports").update({
        status: "failed",
      }).eq("id", report.id)
    }
  }

  return NextResponse.json({ success: true, generated })
}
