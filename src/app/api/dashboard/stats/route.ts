import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [reportsRes, monitorsRes, briefsRes, subsRes] = await Promise.all([
      supabase.from("reports").select("id, created_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("brand_monitors").select("id, created_at, brand_name", { count: "exact" }).eq("user_id", user.id),
      supabase.from("content_briefs").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("subscriptions").select("id, status").eq("user_id", user.id).in("status", ["active", "trialing"]),
    ])

    const activeSubscriptions = (subsRes.data || []).length

    const recentMonitors = (monitorsRes.data || [])
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4)

    return NextResponse.json({
      reportCount: reportsRes.count || 0,
      monitorCount: monitorsRes.count || 0,
      briefCount: briefsRes.count || 0,
      activeSubscriptions,
      recentMonitors,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
