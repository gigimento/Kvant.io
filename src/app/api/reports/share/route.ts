import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import crypto from "crypto"
import { checkServerAccess } from "@/lib/subscription-guard"

export async function POST(request: Request) {
  try {
    const { reportId, expiresInDays } = await request.json()
    if (!reportId) {
      return NextResponse.json({ error: "reportId required" }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const access = await checkServerAccess()
    if (!access.allowed) {
      return NextResponse.json({ error: access.reason === "subscription_required" ? "Subscription required. Start a free trial to access this feature." : "Unauthorized" }, { status: 402 })
    }

    const { data: report } = await supabase
      .from("reports")
      .select("id")
      .eq("id", reportId)
      .eq("user_id", user.id)
      .single()

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 })
    }

    const token = crypto.randomUUID()

    const expiresAt = expiresInDays
      ? new Date(Date.now() + expiresInDays * 86400000).toISOString()
      : null

    const { error: insertError } = await supabase
      .from("client_share_links")
      .insert({
        report_id: reportId,
        token,
        expires_at: expiresAt,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://kvantio.vercel.app"

    return NextResponse.json({
      shareUrl: `${baseUrl}/share/${token}`,
      token,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
