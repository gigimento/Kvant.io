'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, RefreshCw, Users, Eye, DollarSign, TrendingUp, BarChart, PieChart } from 'lucide-react'

interface GA4Data {
  sessions: number
  users: number
  pageviews: number
  bounceRate: number
  avgSessionDuration: number
  sessionsChange: number
  usersChange: number
  topPages: { path: string; views: number }[]
  sessionsBySource: { source: string; sessions: number }[]
}

interface MetaData {
  impressions: number
  clicks: number
  spend: number
  reach: number
  ctr: number
  cpc: number
}

interface GoogleAdsCampaign {
  id: string
  name: string
  impressions: number
  clicks: number
  cost: number
  conversions: number
}

interface GoogleAdsData {
  campaigns: GoogleAdsCampaign[]
  totalImpressions: number
  totalClicks: number
  totalCost: number
  totalConversions: number
}

interface AnalyticsResponse {
  analytics: GA4Data | null
  googleAds: GoogleAdsData | null
  metaAds: MetaData | null
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K'
  return n.toLocaleString()
}

export default function AnalyticsHubPage() {
  const [data, setData] = useState<AnalyticsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/analytics/hub')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [])

  async function refresh() {
    setRefreshing(true)
    try {
      const res = await fetch('/api/analytics/hub')
      const json = await res.json()
      setData(json)
    } catch (e) {
      console.error(e)
    }
    setRefreshing(false)
  }

  useEffect(() => { loadData() }, [loadData])

  const hasGA4 = !!data?.analytics
  const hasGoogleAds = !!data?.googleAds
  const hasMeta = !!data?.metaAds
  const hasData = hasGA4 || hasGoogleAds || hasMeta

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Hub</h1>
          <p className="text-muted-foreground">Unified metrics from all connected sources</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : !hasData ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No data available</p>
            <p className="text-muted-foreground mb-4">Connect GA4, Meta Ads, or Google Ads to see analytics here.</p>
            <Button asChild><a href="/dashboard/connections">Go to Connections</a></Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {hasGA4 && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold mb-0.5">{formatNumber(data!.analytics!.sessions)}</div>
                    <p className={`text-xs ${data!.analytics!.sessionsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data!.analytics!.sessionsChange >= 0 ? '+' : ''}{data!.analytics!.sessionsChange}% vs last period
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />Pageviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold mb-0.5">{formatNumber(data!.analytics!.pageviews)}</div>
                    <p className="text-xs text-muted-foreground">{formatNumber(data!.analytics!.users)} users</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold">{data!.analytics!.bounceRate}%</div>
                    <p className="text-xs text-muted-foreground">{Math.round(data!.analytics!.avgSessionDuration)}s avg session</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Users</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold mb-0.5">{formatNumber(data!.analytics!.users)}</div>
                    <p className={`text-xs ${data!.analytics!.usersChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data!.analytics!.usersChange >= 0 ? '+' : ''}{data!.analytics!.usersChange}% vs last period
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />Sessions by Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data!.analytics!.sessionsBySource.map((s) => (
                      <div key={s.source} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground truncate">{s.source}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${(s.sessions / Math.max(...data!.analytics!.sessionsBySource.map(x => x.sessions))) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">{formatNumber(s.sessions)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {data!.analytics!.topPages.map((p) => (
                      <div key={p.path} className="flex items-center justify-between py-1">
                        <span className="text-sm text-muted-foreground truncate">{p.path}</span>
                        <span className="text-sm font-medium">{formatNumber(p.views)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {hasMeta && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Meta Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data!.metaAds!.impressions)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Meta Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data!.metaAds!.reach)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Meta Spend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${data!.metaAds!.spend.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">${data!.metaAds!.cpc.toFixed(2)} CPC / {data!.metaAds!.ctr.toFixed(2)}% CTR</p>
                </CardContent>
              </Card>
            </div>
          )}

          {hasGoogleAds && data!.googleAds!.campaigns.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Google Ads Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 font-medium">Campaign</th>
                        <th className="text-right py-2 font-medium">Impressions</th>
                        <th className="text-right py-2 font-medium">Clicks</th>
                        <th className="text-right py-2 font-medium">Cost</th>
                        <th className="text-right py-2 font-medium">Conv.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data!.googleAds!.campaigns.map((c) => (
                        <tr key={c.id} className="border-b border-border/50">
                          <td className="py-2 text-muted-foreground">{c.name}</td>
                          <td className="py-2 text-right">{formatNumber(c.impressions)}</td>
                          <td className="py-2 text-right">{formatNumber(c.clicks)}</td>
                          <td className="py-2 text-right">${c.cost.toFixed(2)}</td>
                          <td className="py-2 text-right">{c.conversions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
