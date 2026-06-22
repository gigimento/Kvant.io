import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"
import { askLLMWithSystem } from "@/lib/llm/client"

const SYSTEM_PROMPT = `You are a social media content strategist. Given a content brief, platform, and content type, generate engaging post content. Return JSON only: { "caption": "...", "hashtags": ["...", "..."], "suggestions": ["...", "..."] }. Caption should be platform-appropriate length.`

export async function POST(request: Request) {
  try {
    const { brief_id, platform, content_type } = await request.json()
    if (!brief_id || !platform) {
      return NextResponse.json({ error: "brief_id and platform required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const { data: brief } = await supabase
      .from("content_briefs")
      .select("*")
      .eq("id", brief_id)
      .eq("user_id", user.id)
      .single()
    if (!brief) return NextResponse.json({ error: "Brief not found" }, { status: 404 })

    const userPrompt = `Platform: ${platform}\nContent type: ${content_type || "social_post"}\nBrief title: ${brief.title}\nOutline: ${JSON.stringify(brief.outline)}\nKey points: ${JSON.stringify(brief.key_points)}\nTone: ${brief.tone_and_style || "professional"}\n\nGenerate a caption and hashtags.`

    const { content } = await askLLMWithSystem(SYSTEM_PROMPT, userPrompt, "fast")
    let parsed
    try {
      parsed = JSON.parse(content)
    } catch {
      parsed = { caption: content, hashtags: [], suggestions: [] }
    }

    return NextResponse.json({ caption: parsed.caption, hashtags: parsed.hashtags || [], suggestions: parsed.suggestions || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
