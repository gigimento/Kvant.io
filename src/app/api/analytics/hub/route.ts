import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchGA4Metrics } from '@/lib/api/ga4';
import { getMetaAdsInsights } from '@/lib/api/meta-ads';
import { getGoogleAdsClient } from '@/lib/api/google-ads';

async function refreshGoogleToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error('Google token refresh failed');
  return res.json();
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: connections } = await supabase
      .from('data_connections')
      .select('*')
      .eq('user_id', user.id);

    if (!connections || connections.length === 0) {
      return NextResponse.json({ sources: [], message: 'No data connections found' });
    }

    const results: Record<string, any> = {};
    const errors: Record<string, string> = {};

    for (const conn of connections) {
      try {
        if (conn.provider === 'ga4' && conn.access_token) {
          let token = conn.access_token;
          let newExpiresAt = conn.expires_at;
          if (new Date(conn.expires_at) < new Date() && conn.refresh_token) {
            const refreshed = await refreshGoogleToken(conn.refresh_token);
            token = refreshed.access_token;
            newExpiresAt = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();
            await supabase.from('data_connections').update({ access_token: token, expires_at: newExpiresAt }).eq('id', conn.id);
          }
          const now = new Date();
          const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
          const periodEnd = now.toISOString().split('T')[0];
          const prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
          const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
          const metrics = await fetchGA4Metrics(token, conn.refresh_token || '', conn.provider_account_id || '', newExpiresAt, periodStart, periodEnd, prevStart, prevEnd);
          results.ga4 = {
            sessions: metrics.sessions,
            users: metrics.users,
            pageviews: metrics.pageviews,
            bounceRate: metrics.bounceRate,
            avgSessionDuration: metrics.avgSessionDuration,
            sessionsChange: metrics.sessionsChange,
            usersChange: metrics.usersChange,
            topPages: metrics.topPages,
            sessionsBySource: metrics.sessionsBySource,
          };
        }

        if (conn.provider === 'meta_ads' && conn.access_token) {
          const insights = await getMetaAdsInsights(conn.access_token, conn.provider_account_id || '');
          const data = insights.data?.[0] || {};
          results.meta_ads = {
            impressions: parseInt(data.impressions || '0'),
            clicks: parseInt(data.clicks || '0'),
            spend: parseFloat(data.spend || '0'),
            reach: parseInt(data.reach || '0'),
            ctr: parseFloat(data.ctr || '0'),
            cpc: parseFloat(data.cpc || '0'),
          };
        }

        if (conn.provider === 'google_ads' && conn.access_token) {
          let token = conn.access_token;
          if (new Date(conn.expires_at) < new Date() && conn.refresh_token) {
            const refreshed = await refreshGoogleToken(conn.refresh_token);
            token = refreshed.access_token;
            await supabase.from('data_connections').update({ access_token: token, expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString() }).eq('id', conn.id);
          }
          const campaigns = await getGoogleAdsClient(token, conn.provider_account_id || '');
          const campaignList = (campaigns.results || []).map((c: any) => ({
            id: c.campaign?.id,
            name: c.campaign?.name,
            impressions: parseInt(c.metrics?.impressions || '0'),
            clicks: parseInt(c.metrics?.clicks || '0'),
            cost: Math.round(parseInt(c.metrics?.cost_micros || '0') / 1000000) / 100,
            conversions: parseFloat(c.metrics?.conversions || '0'),
          }));
          results.google_ads = {
            campaigns: campaignList,
            totalImpressions: campaignList.reduce((s: number, c: any) => s + c.impressions, 0),
            totalClicks: campaignList.reduce((s: number, c: any) => s + c.clicks, 0),
            totalCost: campaignList.reduce((s: number, c: any) => s + c.cost, 0),
            totalConversions: campaignList.reduce((s: number, c: any) => s + c.conversions, 0),
          };
        }
      } catch (e: any) {
        errors[conn.provider] = e.message;
      }
    }

    return NextResponse.json({ sources: results, errors: Object.keys(errors).length > 0 ? errors : undefined });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
