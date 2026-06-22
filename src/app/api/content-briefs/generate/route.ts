import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
import { buildContentBriefPrompt } from "@/lib/llm/prompts/content-brief"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { keyword, audience, goal } = await request.json()

    if (!keyword || typeof keyword !== "string") {
      return NextResponse.json({ error: "keyword is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await checkServerAccess("content-briefs")
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason === "subscription_required" ? "Subscription required. Start a free trial to access this feature." : "Unauthorized" }, { status: 402 })
    }

    const { systemPrompt, userPrompt } = buildContentBriefPrompt({
      keyword,
      audience,
      goal,
    })

    const response = await askLLMWithSystem(systemPrompt, userPrompt, "fast")

    let brief: any
    try {
      const jsonStr = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      brief = JSON.parse(jsonStr)
    } catch {
      brief = {
        title: "",
        outline: [],
        keyPoints: [],
        faqIdeas: [],
        toneAndStyle: response.content.slice(0, 500),
      }
    }

    const { data: saved, error: insertError } = await supabase
      .from("content_briefs")
      .insert({
        user_id: user.id,
        keyword,
        audience: audience || null,
        goal: goal || null,
        title: brief.title || "",
        outline: brief.outline || [],
        key_points: brief.keyPoints || [],
        faq_ideas: brief.faqIdeas || [],
        tone_and_style: brief.toneAndStyle || null,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, brief: saved })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
