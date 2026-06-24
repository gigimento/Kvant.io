'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Users, MousePointerClick, Eye, DollarSign, TrendingUp, BarChart, PieChart } from 'lucide-react';

interface GA4Data {
  sessions: number;
  users: number;
  pageviews: number;
  bounceRate: number;
  avgSessionDuration: number;
  sessionsChange: number;
  usersChange: number;
  topPages: { path: string; views: number }[];
  sessionsBySource: { source: string; sessions: number }[];
  sparklines?: {
    sessions: number[];
    users: number[];
    pageviews: number[];
  };
}

interface MetaData {
  impressions: number;
  clicks: number;
  spend: number;
  reach: number;
  ctr: number;
  cpc: number;
  sparklines?: {
    spend: number[];
  };
}

interface GoogleAdsCampaign {
  id: string;
  name: string;
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
}

interface GoogleAdsData {
  campaigns: GoogleAdsCampaign[];
  totalImpressions: number;
  totalClicks: number;
  totalCost: number;
  totalConversions: number;
  sparklines?: {
    cost: number[];
  };
}

interface AnalyticsData {
  hasConnections?: boolean;
  hasErrors?: boolean;
  sources: {
    ga4?: GA4Data;
    meta_ads?: MetaData;
    google_ads?: GoogleAdsData;
  };
  errors?: Record<string, string>;
}

function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}m ${s}s`;
}

/** Inline SVG bar sparkline — 7 bars, responsive, accent-colored */
function SparklineBars({ data, className }: { data: number[]; className?: string }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const barWidth = 100 / data.length;
  return (
    <svg
      viewBox="0 0 100 32"
      className={`w-full h-8 ${className || ''}`}
      preserveAspectRatio="none"
    >
      {data.map((val, i) => {
        const h = (val / max) * 28;
        return (
          <rect
            key={i}
            x={i * barWidth + barWidth * 0.15}
            y={30 - h}
            width={barWidth * 0.7}
            height={Math.max(h, 1)}
            rx={1.5}
            className="fill-accent/70 hover:fill-accent transition-colors"
          />
        );
      })}
    </svg>
  );
}

const PERIODS = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_90_days', label: 'Last 90 Days' },
] as const;

export default function AnalyticsHubPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState('this_month');

  const loadData = useCallback(async (selectedPeriod: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/hub?period=${selectedPeriod}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }, []);

  async function refresh() {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/analytics/hub?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    }
    setRefreshing(false);
  }

  useEffect(() => { loadData(period); }, [period, loadData]);

  const hasData = data?.sources && Object.keys(data.sources).length > 0;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Analytics Hub</h1>
          <p className="text-muted-foreground">Unified metrics from all connected sources</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
          >
            {PERIODS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
          <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : !hasData ? (
        data?.hasConnections ? (
          <Card className="border-red-500/20">
            <CardContent className="py-12 text-center">
              <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">Data unavailable</p>
              <p className="text-muted-foreground mb-4">Your sources are connected but data could not be fetched. Try reconnecting.</p>
              <Button asChild variant="outline"><a href="/dashboard/connections">Reconnect Sources</a></Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <BarChart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium mb-2">No connected sources</p>
              <p className="text-muted-foreground mb-4">Connect GA4, Meta Ads, or Google Ads to see analytics here.</p>
              <Button asChild><a href="/dashboard/connections">Go to Connections</a></Button>
            </CardContent>
          </Card>
        )
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {data?.sources?.ga4 && (
              <>
                <Card className="relative overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Users className="h-4 w-4" />GA4 Sessions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold mb-0.5">{formatNumber(data.sources.ga4.sessions)}</div>
                    <p className={`text-xs ${data.sources.ga4.sessionsChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {data.sources.ga4.sessionsChange >= 0 ? '+' : ''}{data.sources.ga4.sessionsChange}% vs last period
                    </p>
                    {data.sources.ga4.sparklines?.sessions && (
                      <div className="mt-2 h-8">
                        <SparklineBars data={data.sources.ga4.sparklines.sessions} />
                      </div>
                    )}
                  </CardContent>
                </Card>
                <Card className="relative overflow-hidden">
                  <CardHeader className="pb-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Eye className="h-4 w-4" />GA4 Pageviews
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3">
                    <div className="text-2xl font-bold mb-0.5">{formatNumber(data.sources.ga4.pageviews)}</div>
                    <p className="text-xs text-muted-foreground">{formatNumber(data.sources.ga4.users)} users</p>
                    {data.sources.ga4.sparklines?.pageviews && (
                      <div className="mt-2 h-8">
                        <SparklineBars data={data.sources.ga4.sparklines.pageviews} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
            {data?.sources?.meta_ads && (
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />Meta Ad Spend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold mb-0.5">${data.sources.meta_ads.spend.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{formatNumber(data.sources.meta_ads.impressions)} impressions</p>
                  {data.sources.meta_ads.sparklines?.spend && (
                    <div className="mt-2 h-8">
                      <SparklineBars data={data.sources.meta_ads.sparklines.spend} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            {data?.sources?.google_ads && (
              <Card className="relative overflow-hidden">
                <CardHeader className="pb-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />Google Ads Spend
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-2xl font-bold mb-0.5">${data.sources.google_ads.totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{formatNumber(data.sources.google_ads.totalClicks)} clicks</p>
                  {data.sources.google_ads.sparklines?.cost && (
                    <div className="mt-2 h-8">
                      <SparklineBars data={data.sources.google_ads.sparklines.cost} />
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {data?.sources?.ga4 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />Sessions by Source
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {data.sources.ga4.sessionsBySource.map((s) => (
                      <div key={s.source} className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground truncate">{s.source}</span>
                        <div className="flex items-center gap-3">
                          <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent rounded-full"
                              style={{ width: `${(s.sessions / Math.max(...data.sources.ga4!.sessionsBySource.map(x => x.sessions))) * 100}%` }}
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
                    {data.sources.ga4.topPages.map((p) => (
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

          {data?.sources?.meta_ads && (
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Impressions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data.sources.meta_ads.impressions)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(data.sources.meta_ads.reach)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">CTR / CPC</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{(data.sources.meta_ads.ctr * 100).toFixed(2)}%</div>
                  <p className="text-xs text-muted-foreground">${data.sources.meta_ads.cpc.toFixed(2)} per click</p>
                </CardContent>
              </Card>
            </div>
          )}

          {data?.sources?.google_ads && data.sources.google_ads.campaigns.length > 0 && (
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
                      {data.sources.google_ads.campaigns.map((c) => (
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

          {data?.errors && Object.keys(data.errors).length > 0 && (
            <Card className="border-red-500/20">
              <CardHeader>
                <CardTitle className="text-sm text-red-400">Connection Errors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm text-red-300">
                  {Object.entries(data.errors).map(([provider, msg]) => (
                    <p key={provider}><strong>{provider}:</strong> {msg}</p>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
