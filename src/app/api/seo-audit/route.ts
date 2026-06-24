import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const [
      { data: keywords },
      { data: backlinks },
      { data: citations },
      { data: competitive },
      { data: connections },
    ] = await Promise.all([
      supabase.from("keyword_rankings").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("backlink_monitors").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("citation_audits").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
      supabase.from("competitive_snapshots").select("*").eq("user_id", user.id).order("snapshot_date", { ascending: false }).limit(5),
      supabase.from("data_connections").select("*").eq("user_id", user.id),
    ])

    const totalKeywords = keywords?.length || 0
    const avgPosition = keywords?.length
      ? Math.round(keywords.reduce((s: number, k: any) => s + k.current_position, 0) / keywords.length)
      : null
    const top5 = keywords?.filter((k: any) => k.current_position <= 5).length || 0
    const top10 = keywords?.filter((k: any) => k.current_position <= 10).length || 0

    const totalBacklinks = backlinks?.length || 0
    const lostBacklinks = backlinks?.filter((b: any) => b.is_lost).length || 0
    const avgDomainAuthority = backlinks?.length
      ? Math.round(backlinks.reduce((s: number, b: any) => s + (b.domain_authority || 0), 0) / backlinks.length)
      : null

    const totalCitations = citations?.length || 0
    const avgVisibility = citations?.length
      ? Math.round(citations.reduce((s: number, c: any) => s + (c.visibility_score || 0), 0) / citations.length)
      : null

    const ga4Connected = connections?.some((c: any) => c.provider === "ga4" && c.is_valid)
    const adsConnected = connections?.some((c: any) => c.provider === "google_ads" && c.is_valid)
    const metaConnected = connections?.some((c: any) => c.provider === "meta_ads" && c.is_valid)

    return NextResponse.json({
      keywords: {
        total: totalKeywords,
        avgPosition,
        top5,
        top10,
        items: keywords?.slice(0, 10) || [],
      },
      backlinks: {
        total: totalBacklinks,
        lost: lostBacklinks,
        active: totalBacklinks - lostBacklinks,
        avgDomainAuthority,
        items: backlinks?.slice(0, 10) || [],
      },
      citations: {
        total: totalCitations,
        avgVisibility,
        items: citations || [],
      },
      competitive: {
        snapshots: competitive?.length || 0,
        items: competitive || [],
      },
      connections: {
        ga4: ga4Connected,
        googleAds: adsConnected,
        metaAds: metaConnected,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
