import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
import { buildNarrativePrompt } from "@/lib/llm/prompts/narrative"
import { checkServerAccess } from "@/lib/subscription-guard"
import { sendReportEmail } from "@/lib/email/send-report"

export async function POST(request: Request) {
  try {
    const { configId } = await request.json()
    if (!configId) {
      return NextResponse.json({ error: "configId required" }, { status: 400 })
    }

    const access = await checkServerAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: "Subscription required. Subscribe to generate reports." }, { status: 402 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: config } = await supabase
      .from("report_configs")
      .select("*")
      .eq("id", configId)
      .single()

    if (!config) {
      return NextResponse.json({ error: "Config not found" }, { status: 404 })
    }

    const periodEnd = new Date()
    const periodStart = new Date()
    periodStart.setDate(periodStart.getDate() - 30)

    // Mock GA4 data (in production, fetch from GA4 API)
    const mockData = {
      clientName: config.client_name,
      periodStart: periodStart.toISOString().split("T")[0],
      periodEnd: periodEnd.toISOString().split("T")[0],
      metrics: {
        sessions: 12543,
        users: 8932,
        pageviews: 45231,
        bounceRate: 38.5,
        avgSessionDuration: 187,
        sessionsChange: 12.3,
        usersChange: 8.7,
        topPages: [
          { path: "/pricing", views: 4521 },
          { path: "/blog/top-10-tips", views: 3210 },
          { path: "/features", views: 2890 },
          { path: "/about", views: 1543 },
          { path: "/contact", views: 1234 },
        ],
        sessionsBySource: [
          { source: "Organic Search", sessions: 4520 },
          { source: "Direct", sessions: 3210 },
          { source: "Social", sessions: 2340 },
          { source: "Email", sessions: 1450 },
          { source: "Referral", sessions: 1023 },
        ],
      },
    }

    // Insert report as pending
    const { data: report, error: insertError } = await supabase
      .from("reports")
      .insert({
        config_id: configId,
        user_id: user.id,
        client_name: config.client_name,
        period_start: periodStart.toISOString().split("T")[0],
        period_end: periodEnd.toISOString().split("T")[0],
        raw_data: mockData,
        status: "generating",
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Generate narrative via LLM
    try {
      const prompt = buildNarrativePrompt(mockData)
      const llmResponse = await askLLMWithSystem(
        "You are a senior marketing analyst writing client reports. Write in clear, professional English. Be specific and data-driven.",
        prompt,
        "quality"
      )

      await supabase
        .from("reports")
        .update({
          narrative_text: llmResponse.content,
          status: "ready",
        })
        .eq("id", report.id)

      if (config.recipients && config.recipients.length > 0) {
        const reportData = {
          id: report.id,
          client_name: config.client_name,
          period_start: report.period_start,
          period_end: report.period_end,
          narrative_text: llmResponse.content,
          raw_data: mockData,
          created_at: report.created_at,
        }
        sendReportEmail(config.recipients, reportData)
      }

      return NextResponse.json({
        success: true,
        reportId: report.id,
        narrative: llmResponse.content,
      })
    } catch (llmError: any) {
      await supabase
        .from("reports")
        .update({ status: "failed" })
        .eq("id", report.id)

      return NextResponse.json({ error: llmError.message }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
