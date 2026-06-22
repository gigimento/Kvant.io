import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { entries } = await request.json()
    if (!Array.isArray(entries) || entries.length === 0) {
      return NextResponse.json({ error: "entries array required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const rows = entries.map((e: any) => ({
      user_id: user.id,
      title: e.title,
      scheduled_date: e.scheduled_date,
      platform: e.platform || [],
      content_type: e.content_type || null,
      scheduled_time: e.scheduled_time || null,
      assigned_to: e.assigned_to || null,
      media_urls: e.media_urls || [],
      ai_caption: e.ai_caption || null,
      status: e.status || "draft",
    }))

    const { data, error } = await supabase.from("content_calendar").insert(rows).select()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, entries: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
