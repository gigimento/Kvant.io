import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: link } = await supabase
      .from("client_share_links")
      .select("id, report_id")
      .eq("token", token)
      .single()

    if (!link) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }

    const { data: report } = await supabase
      .from("reports")
      .select("user_id")
      .eq("id", link.report_id)
      .single()

    if (!report || report.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { error } = await supabase
      .from("client_share_links")
      .delete()
      .eq("id", link.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
