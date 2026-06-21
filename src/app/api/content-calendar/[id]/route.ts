import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await request.json()

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const access = await checkServerAccess("content-calendar")
    if (!access.allowed) return NextResponse.json({ error: "Subscription required" }, { status: 402 })

    const allowed = ["title", "scheduled_date", "status", "notes", "content_brief_id"]
    const updates: Record<string, any> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key]
    }
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("content_calendar")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, entry: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { error } = await supabase
      .from("content_calendar")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
