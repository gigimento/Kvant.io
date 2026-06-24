import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { fetchGA4Metrics } from "@/lib/api/ga4"
import { getGoogleAdsClient } from "@/lib/api/google-ads"
import { getMetaAdsInsights } from "@/lib/api/meta-ads"
import { refreshAccessToken } from "@/lib/api/ga4"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: connections } = await supabase
      .from("data_connections")
      .select("*")
      .eq("user_id", user.id)

    if (!connections?.length) {
      return NextResponse.json({ analytics: null, googleAds: null, metaAds: null })
    }

    const result: any = { analytics: null, googleAds: null, metaAds: null }

    const ga4Conn = connections.find(c => c.provider === "ga4" && c.is_valid)
    if (ga4Conn) {
      try {
        const periodEnd = new Date()
        const periodStart = new Date()
        periodStart.setDate(periodStart.getDate() - 30)
        const prevEnd = new Date(periodStart.getTime() - 86400000)
        const prevStart = new Date(prevEnd)
        prevStart.setDate(prevStart.getDate() - 30)
        const fmt = (d: Date) => d.toISOString().split("T")[0]

        const metrics = await fetchGA4Metrics(
          ga4Conn.access_token,
          ga4Conn.refresh_token,
          ga4Conn.provider_account_id,
          ga4Conn.expires_at,
          fmt(periodStart),
          fmt(periodEnd),
          fmt(prevStart),
          fmt(prevEnd),
        )

        if (metrics.refreshedToken && metrics.newExpiresAt) {
          await supabase.from("data_connections").update({
            access_token: metrics.refreshedToken,
            expires_at: metrics.newExpiresAt,
          }).eq("id", ga4Conn.id)
        }

        result.analytics = {
          sessions: metrics.sessions,
          users: metrics.users,
          pageviews: metrics.pageviews,
          bounceRate: metrics.bounceRate,
          avgSessionDuration: metrics.avgSessionDuration,
          sessionsChange: metrics.sessionsChange,
          usersChange: metrics.usersChange,
          topPages: metrics.topPages,
          sessionsBySource: metrics.sessionsBySource,
        }
      } catch (err) {
        console.warn("GA4 fetch failed in analytics hub:", err)
      }
    }

    const adsConn = connections.find(c => c.provider === "google_ads" && c.is_valid)
    if (adsConn) {
      try {
        let token = adsConn.access_token
        if (new Date(adsConn.expires_at) < new Date()) {
          const refreshed = await refreshAccessToken(adsConn.refresh_token)
          token = refreshed.access_token
          await supabase.from("data_connections").update({
            access_token: refreshed.access_token,
            expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          }).eq("id", adsConn.id)
        }

        const adsData = await getGoogleAdsClient(token, adsConn.provider_account_id)
        const campaigns = adsData?.results || []
        result.googleAds = {
          campaigns: campaigns.map((r: any) => ({
            id: r.campaign?.id,
            name: r.campaign?.name,
            impressions: parseInt(r.metrics?.impressions || "0"),
            clicks: parseInt(r.metrics?.clicks || "0"),
            cost: Math.round(parseInt(r.metrics?.cost_micros || "0") / 10000) / 100,
            conversions: parseFloat(r.metrics?.conversions || "0"),
          })),
          totalImpressions: campaigns.reduce((s: number, r: any) => s + parseInt(r.metrics?.impressions || "0"), 0),
          totalClicks: campaigns.reduce((s: number, r: any) => s + parseInt(r.metrics?.clicks || "0"), 0),
          totalCost: campaigns.reduce((s: number, r: any) => s + Math.round(parseInt(r.metrics?.cost_micros || "0") / 10000) / 100, 0),
          totalConversions: campaigns.reduce((s: number, r: any) => s + parseFloat(r.metrics?.conversions || "0"), 0),
        }
      } catch (err) {
        console.warn("Google Ads fetch failed in analytics hub:", err)
      }
    }

    const metaConn = connections.find(c => c.provider === "meta_ads" && c.is_valid)
    if (metaConn) {
      try {
        const metaData = await getMetaAdsInsights(metaConn.access_token, metaConn.provider_account_id)
        const dataArr = metaData?.data || []
        result.metaAds = {
          impressions: dataArr.reduce((s: number, d: any) => s + parseInt(d.impressions || "0"), 0),
          clicks: dataArr.reduce((s: number, d: any) => s + parseInt(d.clicks || "0"), 0),
          spend: dataArr.reduce((s: number, d: any) => s + parseFloat(d.spend || "0"), 0),
          reach: dataArr.reduce((s: number, d: any) => s + parseInt(d.reach || "0"), 0),
          ctr: dataArr.length > 0
            ? dataArr.reduce((s: number, d: any) => s + parseFloat(d.ctr || "0"), 0) / dataArr.length
            : 0,
          cpc: dataArr.length > 0
            ? dataArr.reduce((s: number, d: any) => s + parseFloat(d.cpc || "0"), 0) / dataArr.length
            : 0,
        }
      } catch (err) {
        console.warn("Meta Ads fetch failed in analytics hub:", err)
      }
    }

    return NextResponse.json(result)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
