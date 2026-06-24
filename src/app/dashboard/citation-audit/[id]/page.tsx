'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionGate } from '@/components/dashboard/subscription-gate';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Loader2,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import Link from 'next/link';

interface AuditResult {
  id: string;
  prompt_index: number;
  prompt_text: string;
  prompt_category: string;
  platform: string;
  brand_mentioned: boolean;
  competitors_mentioned: string[];
  citation_snippet: string;
  latency_ms: number;
}

interface Audit {
  id: string;
  brand_name: string;
  competitors: string[];
  industry: string;
  status: string;
  summary: any;
  created_at: string;
  completed_at: string;
  prompts_executed: number;
  error_message: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  chatgpt: '#10a37f',
  claude: '#d97757',
  gemini: '#4285f4',
  perplexity: '#6366f1',
};

const PLATFORM_NAMES: Record<string, string> = {
  chatgpt: 'ChatGPT',
  claude: 'Claude',
  gemini: 'Gemini',
  perplexity: 'Perplexity',
};

function MetricCard({
  label,
  value,
  icon,
  trend,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <div className="text-accent">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">{value}</span>
          {trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
        </div>
      </CardContent>
    </Card>
  );
}

function PlatformCard({
  platform,
  citationRate,
  total,
  mentions,
}: {
  platform: string;
  citationRate: number;
  total: number;
  mentions: number;
}) {
  const color = PLATFORM_COLORS[platform] || '#888';
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">
            {PLATFORM_NAMES[platform] || platform}
          </CardTitle>
          <div className="h-3 w-3 rounded-full" style={{ background: color }} />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Citation rate</span>
          <span className={citationRate >= 50 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
            {citationRate}%
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Mentions</span>
          <span>{mentions}/{total}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${citationRate}%`,
              background: `linear-gradient(90deg, ${color}88, ${color})`,
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function CitationAuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [audit, setAudit] = useState<Audit | null>(null);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      fetch(`/api/citation-audit/${id}`)
        .then((r) => r.json())
        .then((res) => {
          if (res.error) {
            setLoading(false);
            return;
          }
          setAudit(res.audit);
          setResults(res.results || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router, id]);

  if (loading) {
    return (
      <SubscriptionGate feature="citation-audit">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        </div>
      </SubscriptionGate>
    );
  }

  if (!audit) {
    return (
      <SubscriptionGate feature="citation-audit">
        <div className="text-center py-16">
          <h2 className="text-lg font-semibold">Audit not found</h2>
          <p className="text-muted-foreground mt-2">This audit does not exist or was deleted.</p>
          <Button className="mt-4" asChild>
            <Link href="/dashboard/citation-audit">Back to audits</Link>
          </Button>
        </div>
      </SubscriptionGate>
    );
  }

  const summary = audit.summary || {};
  const platformStats = summary.platform_breakdown || [];
  const fixPack = summary.fix_pack || null;

  const platformBreakdown = platformStats.length > 0
    ? platformStats
    : (() => {
        const map: Record<string, { total: number; mentioned: number }> = {};
        for (const r of results) {
          if (!map[r.platform]) map[r.platform] = { total: 0, mentioned: 0 };
          map[r.platform].total++;
          if (r.brand_mentioned) map[r.platform].mentioned++;
        }
        return Object.entries(map).map(([platform, stats]) => ({
          platform,
          citation_rate: stats.total > 0 ? Math.round((stats.mentioned / stats.total) * 100) : 0,
          total_queries: stats.total,
          mentions: stats.mentioned,
        }));
      })();

  const totalQueries = results.length || summary.total_queries || 0;
  const brandMentions = results.filter((r) => r.brand_mentioned).length || summary.brand_mentions || 0;
  const overallRate = totalQueries > 0 ? Math.round((brandMentions / totalQueries) * 100) : 0;

  const isRunning = audit.status === 'running';
  const isFailed = audit.status === 'failed';

  const groupedByCategory: Record<string, AuditResult[]> = {};
  for (const r of results) {
    const cat = r.prompt_category || 'other';
    if (!groupedByCategory[cat]) groupedByCategory[cat] = [];
    groupedByCategory[cat].push(r);
  }

  return (
    <SubscriptionGate feature="citation-audit">
      <div className="space-y-8">
        <div>
          <Link
            href="/dashboard/citation-audit"
            className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to audits
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold">{audit.brand_name}</h1>
              <p className="text-muted-foreground">
                {audit.industry ? `${audit.industry} · ` : ''}
                {audit.competitors?.length || 0} competitors tracked
                {audit.created_at ? ` · ${new Date(audit.created_at).toLocaleString()}` : ''}
              </p>
            </div>
            <Badge
              variant={isRunning ? 'warning' : isFailed ? 'secondary' : 'success'}
            >
              {audit.status}
            </Badge>
          </div>
        </div>

        {isRunning && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="flex items-center gap-3 py-4">
              <Loader2 className="h-5 w-5 animate-spin text-accent" />
              <p className="text-sm">Audit is running. Refresh to see results.</p>
            </CardContent>
          </Card>
        )}

        {isFailed && audit.error_message && (
          <Card className="border-red-500/20 bg-red-500/5">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <p className="text-sm text-red-400">{audit.error_message}</p>
            </CardContent>
          </Card>
        )}

        {!isRunning && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                label="Overall Citation Rate"
                value={`${overallRate}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                trend={overallRate >= 50 ? 'up' : 'down'}
              />
              <MetricCard
                label="Total Queries"
                value={totalQueries}
                icon={<Loader2 className="h-4 w-4" />}
              />
              <MetricCard
                label="Brand Mentions"
                value={brandMentions}
                icon={<CheckCircle2 className="h-4 w-4" />}
              />
              <MetricCard
                label="Competitors"
                value={audit.competitors?.length || 0}
                icon={<AlertTriangle className="h-4 w-4" />}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformBreakdown.map((p: any) => (
                <PlatformCard
                  key={p.platform}
                  platform={p.platform}
                  citationRate={p.citation_rate}
                  total={p.total_queries}
                  mentions={p.mentions}
                />
              ))}
            </div>

            {fixPack && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-accent" />
                    Fix Pack
                  </CardTitle>
                  <CardDescription>
                    {fixPack.competitor_threat_level && (
                      <span>
                        Threat level: <span className="font-semibold uppercase">{fixPack.competitor_threat_level}</span>
                      </span>
                    )}
                    {fixPack.overall_citation_rate !== undefined && (
                      <span className="ml-4">
                        Target: {fixPack.overall_citation_rate}% citation rate
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fixPack.recommendations?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Recommendations
                      </h4>
                      {fixPack.recommendations.map((rec: any, i: number) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3"
                        >
                          <Badge
                            variant={
                              rec.priority === 'P1'
                                ? 'warning'
                                : rec.priority === 'P2'
                                  ? 'secondary'
                                  : 'success'
                            }
                            className="shrink-0"
                          >
                            {rec.priority}
                          </Badge>
                          <div>
                            <p className="text-sm">{rec.action}</p>
                            {rec.expected_impact && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Impact: {rec.expected_impact}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {fixPack.top_lost_prompts?.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Top Lost Prompts
                      </h4>
                      {fixPack.top_lost_prompts.map((lp: any, i: number) => (
                        <div
                          key={i}
                          className="rounded-lg border border-white/5 bg-white/[0.02] p-3"
                        >
                          <p className="text-sm font-medium">"{lp.prompt}"</p>
                          {lp.winning_competitors?.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Won by: {lp.winning_competitors.join(', ')}
                            </p>
                          )}
                          {lp.fix && (
                            <p className="text-xs text-accent mt-1">{lp.fix}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {results.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Results by Category</CardTitle>
                  <CardDescription>
                    {results.length} prompts across {platformBreakdown.length} AI platforms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(groupedByCategory).map(([category, catResults]) => (
                      <div key={category}>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                          {category}
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/5">
                                <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Prompt</th>
                                <th className="text-left py-2 px-4 text-muted-foreground font-medium">Platform</th>
                                <th className="text-center py-2 px-4 text-muted-foreground font-medium">Cited</th>
                                <th className="text-left py-2 pl-4 text-muted-foreground font-medium">Snippet</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catResults.map((r, i) => {
                                const promptPrefix = r.prompt_text.length > 60
                                  ? r.prompt_text.slice(0, 60) + '...'
                                  : r.prompt_text;
                                return (
                                  <tr
                                    key={`${r.platform}-${r.prompt_index}-${i}`}
                                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                                  >
                                    <td className="py-3 pr-4 text-muted-foreground text-xs max-w-[200px] truncate">
                                      {promptPrefix}
                                    </td>
                                    <td className="py-3 px-4">
                                      <span
                                        className="inline-flex items-center gap-1.5 text-xs font-medium"
                                        style={{ color: PLATFORM_COLORS[r.platform] || '#888' }}
                                      >
                                        <span
                                          className="h-2 w-2 rounded-full inline-block"
                                          style={{ background: PLATFORM_COLORS[r.platform] || '#888' }}
                                        />
                                        {PLATFORM_NAMES[r.platform] || r.platform}
                                      </span>
                                    </td>
                                    <td className="py-3 px-4 text-center">
                                      {r.brand_mentioned ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 inline-block" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500 inline-block" />
                                      )}
                                    </td>
                                    <td className="py-3 pl-4 text-xs text-muted-foreground max-w-[250px] truncate">
                                      {r.citation_snippet || '-'}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {audit.competitors?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Competitors Tracked</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {audit.competitors.map((c: string) => (
                      <Badge key={c} variant="secondary">{c}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </SubscriptionGate>
  );
}
