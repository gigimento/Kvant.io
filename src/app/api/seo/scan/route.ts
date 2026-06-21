import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLM } from "@/lib/llm/client"
import { buildBrandScanPrompt, buildShareOfVoicePrompt } from "@/lib/llm/prompts/seo-scan"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { monitorId } = await request.json()
    if (!monitorId) {
      return NextResponse.json({ error: "monitorId required" }, { status: 400 })
    }

    const access = await checkServerAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: "Subscription required. Subscribe to run brand scans." }, { status: 402 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: monitor } = await supabase
      .from("brand_monitors")
      .select("*")
      .eq("id", monitorId)
      .single()

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 })
    }

    const results = []

    // Scan each keyword
    for (const keyword of monitor.keywords) {
      const prompt = buildBrandScanPrompt({
        brandName: monitor.brand_name,
        competitors: monitor.competitors || [],
        keyword,
      })

      try {
        const response = await askLLM(prompt, "fast")

        // Parse mention from response
        const mentioned = response.content
          .toLowerCase()
          .includes(monitor.brand_name.toLowerCase())

        const sentiment = response.content.toLowerCase().includes("positive")
          ? "positive"
          : response.content.toLowerCase().includes("negative")
          ? "negative"
          : "neutral"

        await supabase.from("brand_mentions").insert({
          monitor_id: monitorId,
          query: keyword,
          llm_provider: "gemini",
          brand_mentioned: mentioned,
          sentiment,
          context_snippet: response.content.slice(0, 500),
          raw_response: response.content,
        })

        results.push({ keyword, mentioned, sentiment, success: true })
      } catch (err: any) {
        results.push({ keyword, mentioned: false, error: err.message, success: false })
      }
    }

    // Run share of voice scan on first keyword
    if (monitor.keywords.length > 0) {
      try {
        const sovPrompt = buildShareOfVoicePrompt({
          brandName: monitor.brand_name,
          competitors: monitor.competitors || [],
          keyword: monitor.keywords[0],
        })
        const sovResponse = await askLLM(sovPrompt, "fast")

        await supabase.from("brand_mentions").insert({
          monitor_id: monitorId,
          query: `[SOV] ${monitor.keywords[0]}`,
          llm_provider: "gemini",
          brand_mentioned: true,
          sentiment: "neutral",
          context_snippet: sovResponse.content.slice(0, 500),
          raw_response: sovResponse.content,
        })
      } catch {}
    }

    return NextResponse.json({ success: true, results })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
