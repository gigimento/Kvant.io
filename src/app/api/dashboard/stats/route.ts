import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [reportsRes, monitorsRes, briefsRes, invoicesRes, calendarRes] = await Promise.all([
      supabase.from("reports").select("id, created_at", { count: "exact" }).eq("user_id", user.id),
      supabase.from("brand_monitors").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("content_briefs").select("id", { count: "exact" }).eq("user_id", user.id),
      supabase.from("invoices").select("id, total, status", { count: "exact" }).eq("user_id", user.id),
      supabase.from("content_calendar").select("id", { count: "exact" }).eq("user_id", user.id),
    ])

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthReports = (reportsRes.data || []).filter(r => new Date(r.created_at) >= startOfMonth).length
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthReports = (reportsRes.data || []).filter(r => {
      const d = new Date(r.created_at)
      return d >= lastMonthStart && d < startOfMonth
    }).length

    const trendUp = thisMonthReports >= lastMonthReports
    const trendDelta = lastMonthReports > 0
      ? Math.round(((thisMonthReports - lastMonthReports) / lastMonthReports) * 100)
      : thisMonthReports > 0 ? 100 : 0

    const paidInvoices = (invoicesRes.data || []).filter(i => i.status === "paid")
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + (i.total || 0), 0)

    const recentReports = (reportsRes.data || []).slice(-4).reverse()

    return NextResponse.json({
      reportCount: reportsRes.count || 0,
      monitorCount: monitorsRes.count || 0,
      briefCount: briefsRes.count || 0,
      calendarEntries: calendarRes.count || 0,
      thisMonthReports,
      trendDelta,
      trendUp,
      totalRevenue,
      paidInvoiceCount: paidInvoices.length,
      recentReports,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
