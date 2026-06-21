import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"
import { buildProposalPrompt } from "@/lib/llm/prompts/proposal"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { clientName, projectScope, deliverables, timeline, budget, additionalNotes } = await request.json()
    if (!clientName || !projectScope) {
      return NextResponse.json({ error: "clientName and projectScope are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess()
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const { systemPrompt, userPrompt } = buildProposalPrompt({
      clientName, projectScope, deliverables: deliverables || "", timeline: timeline || "", budget: budget || "", additionalNotes,
    })

    const response = await askLLMWithSystem(systemPrompt, userPrompt, "fast")

    let proposal: any
    try {
      const jsonStr = response.content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim()
      proposal = JSON.parse(jsonStr)
    } catch {
      proposal = { title: "", executiveSummary: response.content.slice(0, 500), approach: "", deliverables: [], timeline: "", investment: "", nextSteps: "" }
    }

    return NextResponse.json({ success: true, proposal })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
