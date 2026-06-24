import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

  const { data } = await supabase
    .from("keyword_rank_history")
    .select("position, checked_at")
    .eq("keyword_id", id)
    .order("checked_at", { ascending: true })
    .limit(10)

  return NextResponse.json(data || [])
}
