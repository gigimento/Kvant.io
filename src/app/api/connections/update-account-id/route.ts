import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id, provider_account_id, provider_account_name } = await request.json()
    if (!id || !provider_account_id) {
      return NextResponse.json({ error: "id and provider_account_id are required" }, { status: 400 })
    }

    const update: Record<string, string> = { provider_account_id }
    if (provider_account_name) update.provider_account_name = provider_account_name

    const { error } = await supabase
      .from("data_connections")
      .update(update)
      .eq("id", id)
      .eq("user_id", user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
