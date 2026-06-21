import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
import { buildContentBriefPrompt } from "@/lib/llm/prompts/content-brief"

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

    return NextResponse.json({ success: true, brief })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
