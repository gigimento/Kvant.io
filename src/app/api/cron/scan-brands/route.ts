import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLM } from "@/lib/llm/client"
import { buildBrandScanPrompt, buildShareOfVoicePrompt } from "@/lib/llm/prompts/seo-scan"

export async function GET(request: Request) {
  if (request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()

  const { data: monitors } = await supabase
    .from("brand_monitors")
    .select("*")
    .eq("is_active", true)

  if (!monitors?.length) {
    return NextResponse.json({ success: true, scanned: 0 })
  }

  let scanned = 0
  for (const monitor of monitors) {
    for (const keyword of monitor.keywords) {
      const prompt = buildBrandScanPrompt({
        brandName: monitor.brand_name,
        competitors: monitor.competitors || [],
        keyword,
      })

      try {
        const response = await askLLM(prompt, "fast")
        const mentioned = response.content
          .toLowerCase()
          .includes(monitor.brand_name.toLowerCase())
        const sentiment = response.content.toLowerCase().includes("positive")
          ? "positive"
          : response.content.toLowerCase().includes("negative")
          ? "negative"
          : "neutral"

        await supabase.from("brand_mentions").insert({
          monitor_id: monitor.id,
          query: keyword,
          llm_provider: "gemini",
          brand_mentioned: mentioned,
          sentiment,
          context_snippet: response.content.slice(0, 500),
          raw_response: response.content,
        })
      } catch {}
    }

    // SOV scan on first keyword
    if (monitor.keywords.length > 0) {
      try {
        const sovPrompt = buildShareOfVoicePrompt({
          brandName: monitor.brand_name,
          competitors: monitor.competitors || [],
          keyword: monitor.keywords[0],
        })
        const sovResponse = await askLLM(sovPrompt, "fast")
        await supabase.from("brand_mentions").insert({
          monitor_id: monitor.id,
          query: `[SOV] ${monitor.keywords[0]}`,
          llm_provider: "gemini",
          brand_mentioned: true,
          sentiment: "neutral",
          context_snippet: sovResponse.content.slice(0, 500),
          raw_response: sovResponse.content,
        })
      } catch {}
    }

    scanned++
  }

  return NextResponse.json({ success: true, scanned })
}
