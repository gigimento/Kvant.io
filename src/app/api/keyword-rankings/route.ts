import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data } = await supabase
    .from("keyword_rankings")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
  return NextResponse.json(data || [])
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { keyword, target_url } = body
  if (!keyword || !target_url) {
    return NextResponse.json({ error: "keyword and target_url are required" }, { status: 400 })
  }

  const simulatedPosition = Math.floor(Math.random() * 40) + 1

  const { data, error } = await supabase
    .from("keyword_rankings")
    .insert({
      user_id: user.id,
      keyword,
      target_url,
      current_position: simulatedPosition,
      best_position: simulatedPosition,
      last_checked_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from("keyword_rank_history").insert({
    keyword_id: data.id,
    position: simulatedPosition,
  })

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  await supabase.from("keyword_rankings").delete().eq("id", id).eq("user_id", user.id)
  return NextResponse.json({ success: true })
}
