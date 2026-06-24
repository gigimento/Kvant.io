'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Search,
  Loader2,
  Sparkles,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { SubscriptionGate } from '@/components/dashboard/subscription-gate';

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

const PRIORITY_VARIANTS: Record<string, 'warning' | 'danger' | 'secondary'> = {
  P1: 'warning',
  P2: 'danger',
  P3: 'secondary',
};

function SentimentDonut({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral;
  if (total === 0) return null;
  const pPos = (positive / total) * 100;
  const pNeg = (negative / total) * 100;
  const pNeu = (neutral / total) * 100;
  const r = 40;
  const circ = 2 * Math.PI * r;
  const posLen = (pPos / 100) * circ;
  const negLen = (pNeg / 100) * circ;
  const neuLen = (pNeu / 100) * circ;
  const offset = 0;

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width="100" height="100" viewBox="0 0 100 100" className="rotate-[-90deg]">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="10" />
        {pPos > 0 && (
          <circle cx="50" cy="50" r={r} fill="none" stroke="#22c55e" strokeWidth="10"
            strokeDasharray={`${posLen} ${circ - posLen}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
        )}
        {pNeg > 0 && (
          <circle cx="50" cy="50" r={r} fill="none" stroke="#ef4444" strokeWidth="10"
            strokeDasharray={`${negLen} ${circ - negLen}`}
            strokeDashoffset={-(offset + posLen)}
            strokeLinecap="round"
          />
        )}
        {pNeu > 0 && (
          <circle cx="50" cy="50" r={r} fill="none" stroke="#8b8b8b" strokeWidth="10"
            strokeDasharray={`${neuLen} ${circ - neuLen}`}
            strokeDashoffset={-(offset + posLen + negLen)}
            strokeLinecap="round"
          />
        )}
      </svg>
      <div className="flex gap-4 text-xs">
        <span className="flex items-center gap-1"><ThumbsUp className="h-3 w-3 text-green-400" /> {Math.round(pPos)}%</span>
        <span className="flex items-center gap-1"><ThumbsDown className="h-3 w-3 text-red-400" /> {Math.round(pNeg)}%</span>
        <span className="flex items-center gap-1"><Minus className="h-3 w-3 text-muted-foreground" /> {Math.round(pNeu)}%</span>
      </div>
    </div>
  );
}

function SEOIssueCard({ issue }: { issue: any }) {
  const statusIcon = issue.status === 'pass'
    ? <CheckCircle2 className="h-4 w-4 text-green-500" />
    : issue.status === 'warning'
      ? <AlertTriangle className="h-4 w-4 text-yellow-500" />
      : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <div className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
      {statusIcon}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{issue.check}</span>
          <Badge variant={PRIORITY_VARIANTS[issue.priority] || 'secondary'} className="text-[10px] px-1.5">
            {issue.priority}
          </Badge>
        </div>
        {issue.details && (
          <p className="text-xs text-muted-foreground mt-1">{issue.details}</p>
        )}
        {issue.recommendation && (
          <p className="text-xs text-accent mt-1">{issue.recommendation}</p>
        )}
      </div>
    </div>
  );
}

export default function MonitorDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [monitor, setMonitor] = useState<any>(null);
  const [mentions, setMentions] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  async function loadData() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data: mon } = await supabase.from('brand_monitors').select('*').eq('id', params.id).single();
    setMonitor(mon);
    const { data: mnts } = await supabase.from('brand_mentions').select('*').eq('monitor_id', params.id).order('scanned_at', { ascending: false });
    setMentions(mnts || []);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [params.id]);

  async function handleScan() {
    setScanning(true);
    try {
      const res = await fetch('/api/seo/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monitorId: params.id }),
      });
      if (!res.ok) { const err = await res.json(); alert(`Scan failed: ${err.error || res.statusText}`); return; }
      await loadData();
    } catch (e: any) { alert(`Network error: ${e.message}`); } finally { setScanning(false); }
  }

  if (loading) {
    return (
      <SubscriptionGate>
        <div className="space-y-6">
          <div className="skeleton-text" style={{ width: '20%', height: 16 }} />
          <div className="skeleton-text" style={{ width: '40%', height: 24 }} />
          <div className="grid gap-6 sm:grid-cols-3">
            {[1, 2, 3].map((i) => <div key={i} className="skeleton-card rounded-xl" />)}
          </div>
        </div>
      </SubscriptionGate>
    );
  }

  if (!monitor) {
    return (
      <SubscriptionGate>
        <div className="text-center py-16">
          <p className="text-muted-foreground">Monitor not found.</p>
          <Button className="mt-4" asChild><Link href="/dashboard/seo">Back</Link></Button>
        </div>
      </SubscriptionGate>
    );
  }

  const scanData = monitor.seo_scan_data || {};
  const keywordSuggestions = monitor.keyword_suggestions || [];
  const platformBreakdown = scanData.mention_scan?.platform_breakdown || [];
  const techSEO = scanData.technical || null;
  const onPageData = scanData.onpage || [];

  const positiveMentions = mentions.filter((m) => m.sentiment === 'positive').length;
  const negativeMentions = mentions.filter((m) => m.sentiment === 'negative').length;
  const neutralMentions = mentions.filter((m) => m.sentiment === 'neutral' || m.sentiment === 'mixed' || (!m.sentiment)).length;
  const totalMentions = mentions.length;

  return (
    <SubscriptionGate>
      <div className="space-y-8">
        <div className="animate-fade-in flex items-start justify-between">
          <div>
            <Link
              href="/dashboard/seo"
              className="mb-2 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Link>
            <h1 className="text-2xl font-bold">{monitor.brand_name}</h1>
            <p className="text-muted-foreground">
              {(monitor.competitors as any[])?.join(', ') || 'No competitors'}
              {monitor.industry ? ` · ${monitor.industry}` : ''}
              {monitor.website_url ? (
                <>
                  {' · '}
                  <a
                    href={monitor.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-accent hover:underline"
                  >
                    {monitor.website_url.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              ) : null}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleScan} disabled={scanning}>
              {scanning ? (
                <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Scanning...</>
              ) : (
                <><Sparkles className="mr-1 h-4 w-4" /> Run Scan</>
              )}
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Scans</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{totalMentions}</div></CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Positive</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-green-400">{positiveMentions}</div></CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Negative</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-red-400">{negativeMentions}</div></CardContent>
          </Card>
          <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Sentiment Score</CardTitle></CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalMentions > 0 ? Math.round((positiveMentions / totalMentions) * 100) : 0}%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Multi-Provider Platform Breakdown */}
        {platformBreakdown.length > 0 && (
          <div className="animate-fade-in" style={{ animationDelay: '250ms' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent" />
              Multi-Provider Mention Scan
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {platformBreakdown.map((p: any) => {
                const color = PLATFORM_COLORS[p.platform] || '#888';
                return (
                  <Card key={p.platform}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-semibold" style={{ color }}>
                          {PLATFORM_NAMES[p.platform] || p.platform}
                        </CardTitle>
                        <div className="h-3 w-3 rounded-full" style={{ background: color }} />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mention rate</span>
                        <span className={p.rate >= 50 ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                          {p.rate}%
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Mentions</span>
                        <span>{p.mentioned}/{p.total}</span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${p.rate}%`, background: `linear-gradient(90deg, ${color}44, ${color})` }}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Sentiment */}
        {totalMentions > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '300ms' }}>
            <CardHeader><CardTitle className="text-sm font-medium">Sentiment Breakdown</CardTitle></CardHeader>
            <CardContent>
              <SentimentDonut positive={positiveMentions} negative={negativeMentions} neutral={neutralMentions} />
            </CardContent>
          </Card>
        )}

        {/* Technical SEO Audit */}
        {techSEO && !techSEO.error && (
          <Card className="animate-fade-in" style={{ animationDelay: '350ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4 text-accent" />
                Technical SEO Audit
              </CardTitle>
              <CardDescription>
                {monitor.website_url}
                {techSEO.overall_score !== undefined && (
                  <span className="ml-3">
                    Score: <span className={techSEO.overall_score >= 70 ? 'text-green-500' : techSEO.overall_score >= 40 ? 'text-yellow-500' : 'text-red-500'}>
                      {techSEO.overall_score}/100
                    </span>
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Quick stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {techSEO.page_title && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Title</span>
                    <p className="truncate font-medium">{techSEO.page_title}</p>
                  </div>
                )}
                {techSEO.word_count && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">Word Count</span>
                    <p className="font-medium">{techSEO.word_count}</p>
                  </div>
                )}
                {techSEO.h1_count !== undefined && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">H1 Tags</span>
                    <p className="font-medium">{techSEO.h1_count}</p>
                  </div>
                )}
                {techSEO.h2_count !== undefined && (
                  <div className="text-xs">
                    <span className="text-muted-foreground">H2 Tags</span>
                    <p className="font-medium">{techSEO.h2_count}</p>
                  </div>
                )}
              </div>

              {/* Status badges */}
              <div className="flex flex-wrap gap-2">
                {techSEO.is_https !== undefined && (
                  <Badge variant={techSEO.is_https ? 'success' : 'danger'}>
                    {techSEO.is_https ? 'HTTPS' : 'No HTTPS'}
                  </Badge>
                )}
                {techSEO.has_viewport !== undefined && (
                  <Badge variant={techSEO.has_viewport ? 'success' : 'danger'}>
                    {techSEO.has_viewport ? 'Viewport Meta' : 'No Viewport'}
                  </Badge>
                )}
                {techSEO.has_canonical !== undefined && (
                  <Badge variant={techSEO.has_canonical ? 'success' : 'danger'}>
                    {techSEO.has_canonical ? 'Canonical' : 'No Canonical'}
                  </Badge>
                )}
                {techSEO.has_structured_data !== undefined && (
                  <Badge variant={techSEO.has_structured_data ? 'success' : 'secondary'}>
                    {techSEO.has_structured_data ? 'Schema.org' : 'No Schema'}
                  </Badge>
                )}
                {techSEO.images_missing_alt !== undefined && (
                  <Badge variant={techSEO.images_missing_alt > 0 ? 'warning' : 'success'}>
                    {techSEO.images_missing_alt} imgs missing alt
                  </Badge>
                )}
              </div>

              {/* Issues */}
              {techSEO.issues && techSEO.issues.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                    Issues ({techSEO.issues.length})
                  </h4>
                  {techSEO.issues.map((issue: any, i: number) => (
                    <SEOIssueCard key={i} issue={issue} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* On-page Analysis */}
        {onPageData.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '400ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-accent" />
                On-Page Optimization
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {onPageData.map((item: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                    <Badge variant={PRIORITY_VARIANTS[item.priority] || 'secondary'} className="shrink-0 text-[10px] px-1.5">
                      {item.priority}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{item.element}</p>
                      {item.issue && <p className="text-xs text-muted-foreground mt-1">{item.issue}</p>}
                      {item.recommendation && (
                        <p className="text-xs text-accent mt-1">{item.recommendation}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Keyword Suggestions */}
        {keywordSuggestions.length > 0 && (
          <Card className="animate-fade-in" style={{ animationDelay: '450ms' }}>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-accent" />
                Keyword Suggestions
              </CardTitle>
              <CardDescription>AI-generated keyword opportunities for {monitor.brand_name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Keyword</th>
                      <th className="text-left py-2 px-4 text-muted-foreground font-medium">Intent</th>
                      <th className="text-left py-2 px-4 text-muted-foreground font-medium">Difficulty</th>
                      <th className="text-left py-2 pl-4 text-muted-foreground font-medium">Rationale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {keywordSuggestions.map((s: any, i: number) => (
                      <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-4 font-medium">{s.keyword}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            s.intent === 'transactional' ? 'success' :
                            s.intent === 'commercial' ? 'warning' :
                            'secondary'
                          } className="text-[10px]">{s.intent}</Badge>
                        </td>
                        <td className="py-3 px-4">
                          <span className={
                            s.difficulty === 'easy' ? 'text-green-500' :
                            s.difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'
                          }>{s.difficulty}</span>
                        </td>
                        <td className="py-3 pl-4 text-xs text-muted-foreground">{s.rationale}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Mention History */}
        {mentions.length === 0 ? (
          <Card className="text-center py-16 animate-fade-in" style={{ animationDelay: '150ms' }}>
            <CardContent>
              <div className="animate-float-icon mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                <Search className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-semibold">No scans yet</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Run your first scan to see brand mentions across multiple AI platforms.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Scan History</h2>
            {mentions.map((m, i) => (
              <Card key={m.id} className="reveal" style={{ transitionDelay: `${i * 40}ms` }}>
                <CardHeader className="flex flex-row items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <Badge variant={m.sentiment === 'positive' ? 'success' : m.sentiment === 'negative' ? 'danger' : 'secondary'}>
                      {m.sentiment}
                    </Badge>
                    <span className="text-sm font-medium">{m.query}</span>
                    {m.llm_provider && (
                      <span
                        className="text-xs"
                        style={{ color: PLATFORM_COLORS[m.llm_provider] || '#888' }}
                      >
                        {PLATFORM_NAMES[m.llm_provider] || m.llm_provider}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(m.scanned_at)}
                  </span>
                </CardHeader>
                {m.context_snippet && (
                  <CardContent className="pb-3">
                    <p className="text-xs text-muted-foreground line-clamp-3">{m.context_snippet}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </SubscriptionGate>
  );
}
