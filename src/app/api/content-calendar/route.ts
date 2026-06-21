import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get("month")
    const year = searchParams.get("year")

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    let query = supabase.from("content_calendar").select("*").eq("user_id", user.id)
    if (month && year) {
      const start = `${year}-${month.padStart(2, "0")}-01`
      const endDate = new Date(parseInt(year), parseInt(month), 0)
      const end = `${year}-${month.padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`
      query = query.gte("scheduled_date", start).lte("scheduled_date", end)
    }
    query = query.order("scheduled_date", { ascending: true })

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, entries: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { title, scheduled_date, content_brief_id, notes, status } = await request.json()
    if (!title || !scheduled_date) {
      return NextResponse.json({ error: "title and scheduled_date are required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const { data, error } = await supabase
      .from("content_calendar")
      .insert({ user_id: user.id, title, scheduled_date, content_brief_id: content_brief_id || null, notes: notes || null, status: status || "draft" })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, entry: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
