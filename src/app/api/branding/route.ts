import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("brand_settings")
      .eq("user_id", user.id)
      .single()

    return NextResponse.json({
      brandSettings: profile?.brand_settings || {},
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()

    const { data: existing } = await supabase
      .from("profiles")
      .select("brand_settings")
      .eq("user_id", user.id)
      .single()

    const merged = {
      ...(typeof existing?.brand_settings === "object" ? existing.brand_settings : {}),
      ...updates,
    }

    const { error } = await supabase
      .from("profiles")
      .update({ brand_settings: merged })
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, brandSettings: merged })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
