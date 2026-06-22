import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { askLLMWithSystem } from "@/lib/llm/client"

export async function POST(request: Request) {
  try {
    const { reportId } = await request.json()
    if (!reportId) {
      return NextResponse.json({ error: "Missing reportId" }, { status: 400 })
    }

    const supabase = await createClient()

    const { data: report } = await supabase
      .from("reports")
      .select("*")
      .eq("id", reportId)
      .single()

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    await supabase.from("reports").update({
      status: "generating",
    }).eq("id", report.id)

    const prompt = report.narrative_prompt || ""

    const llmResponse = await askLLMWithSystem(
      "You are a senior marketing analyst writing client reports.",
      prompt,
      "quality"
    )

    await supabase.from("reports").update({
      narrative_text: llmResponse.content,
      status: "ready",
    }).eq("id", report.id)

    return NextResponse.json({
      success: true,
      reportId: report.id,
      status: "ready",
    })
  } catch (err: any) {
    console.error("process-single error:", err)
    return NextResponse.json({
      success: false,
      error: err.message,
    }, { status: 500 })
  }
}
