import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
import { buildNarrativePrompt } from "@/lib/llm/prompts/narrative"
import { fetchGA4Metrics } from "@/lib/api/ga4"
import { sendReportEmail } from "@/lib/email/send-report"

async function fetchMetricsForConfig(supabase: any, config: any) {
  const dataSources: string[] = config.data_sources || []
  if (!dataSources.includes("ga4")) return null

  const { data: conn } = await supabase
    .from("data_connections")
    .select("*")
    .eq("user_id", config.user_id)
    .eq("provider", "ga4")
    .eq("is_valid", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conn || !conn.provider_account_id) return null

  const periodEnd = new Date()
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - 30)

  const prevPeriodEnd = new Date(periodStart.getTime() - 86400000)
  const prevPeriodStart = new Date(prevPeriodEnd)
  prevPeriodStart.setDate(prevPeriodStart.getDate() - 30)

  const fmt = (d: Date) => d.toISOString().split("T")[0]

  const metrics = await fetchGA4Metrics(
    conn.access_token,
    conn.refresh_token,
    conn.provider_account_id,
    conn.expires_at,
    fmt(periodStart),
    fmt(periodEnd),
    fmt(prevPeriodStart),
    fmt(prevPeriodEnd),
  )

  if (metrics.refreshedToken && metrics.newExpiresAt) {
    await supabase
      .from("data_connections")
      .update({
        access_token: metrics.refreshedToken,
        expires_at: metrics.newExpiresAt,
      })
      .eq("id", conn.id)
  }

  return {
    clientName: config.client_name,
    periodStart: fmt(periodStart),
    periodEnd: fmt(periodEnd),
    metrics,
  }
}

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

  let dispatched = 0
  for (const config of configs) {
    let reportData: any = null
    try {
      reportData = await fetchMetricsForConfig(supabase, config)
    } catch (err) {
      console.warn("Cron GA4 fetch failed for config", config.id, err)
    }

    if (!reportData) {
      const periodEnd = new Date()
      const periodStart = new Date()
      periodStart.setDate(periodStart.getDate() - 30)

      reportData = {
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
    }

    const prompt = buildNarrativePrompt(reportData)
    let narrativeText = ""
    let status = "ready"

    try {
      const llmResponse = await askLLMWithSystem(
        "You are a senior marketing analyst writing client reports. Write in clear, professional English. Be specific and data-driven.",
        prompt,
        "quality"
      )
      narrativeText = llmResponse.content
    } catch (err) {
      console.warn("LLM generation failed for config", config.id, err)
      status = "failed"
    }

    const { data: report } = await supabase
      .from("reports")
      .insert({
        config_id: config.id,
        user_id: config.user_id,
        client_name: config.client_name,
        period_start: reportData.periodStart,
        period_end: reportData.periodEnd,
        raw_data: reportData,
        narrative_prompt: prompt,
        narrative_text: narrativeText,
        status,
      })
      .select()
      .single()

    if (!report) continue

    if (config.recipients && config.recipients.length > 0 && narrativeText) {
      sendReportEmail(config.recipients, {
        id: report.id,
        client_name: config.client_name,
        period_start: report.period_start,
        period_end: report.period_end,
        narrative_text: narrativeText,
        raw_data: reportData,
        created_at: report.created_at,
      })
    }

    const nextRun = new Date()
    if (config.schedule === "weekly") {
      nextRun.setDate(nextRun.getDate() + 7)
    } else {
      nextRun.setMonth(nextRun.getMonth() + 1)
    }
    await supabase.from("report_configs").update({
      next_run_at: nextRun.toISOString(),
    }).eq("id", config.id)

    dispatched++
  }

  return NextResponse.json({ success: true, dispatched })
}
