'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Copy, Check, Lightbulb, Search, TrendingUp, Target } from 'lucide-react';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useToast } from '@/lib/use-toast';

export default function ContentBriefDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { addToast } = useToast();
  const [brief, setBrief] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      supabase.from('content_briefs').select('*').eq('id', id).single().then((res) => {
        setBrief(res.data);
        setLoading(false);
      });
    });
  }, [router, id]);

  function copyText(text: string, key: string) {
    navigator.clipboard.writeText(text);
    setCopied(key);
    addToast('Copied', 'info');
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );

  if (!brief) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Brief not found.</p>
      <Button className="mt-4" asChild><Link href="/dashboard/content-briefs">Back</Link></Button>
    </div>
  );

  const serp = brief.serp_analysis || {};
  const gaps = brief.content_gap || [];
  const kwData = brief.keyword_data || {};

  return (
    <div className="space-y-8">
      <div>
        <Link href="/dashboard/content-briefs" className="mb-4 flex items-center gap-1 text-sm text-muted-foreground hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back
        </Link>
        <h1 className="text-2xl font-bold">{brief.title || brief.keyword}</h1>
        <p className="text-muted-foreground">
          {brief.keyword} · {formatDate(brief.created_at)}
          {brief.audience && ` · ${brief.audience}`}
          {brief.goal && ` · Goal: ${brief.goal}`}
        </p>
      </div>

      {/* SERP + Keyword Data Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {serp.search_intent && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Search className="h-3 w-3" /> Search Intent</CardTitle></CardHeader>
            <CardContent><span className="text-lg font-semibold capitalize">{serp.search_intent}</span></CardContent>
          </Card>
        )}
        {serp.estimated_difficulty && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><TrendingUp className="h-3 w-3" /> Difficulty</CardTitle></CardHeader>
            <CardContent>
              <span className={`text-lg font-semibold ${serp.estimated_difficulty === 'easy' ? 'text-green-500' : serp.estimated_difficulty === 'medium' ? 'text-yellow-500' : 'text-red-500'}`}>
                {serp.estimated_difficulty}
              </span>
            </CardContent>
          </Card>
        )}
        {kwData.monthly_search_volume_estimate && (
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Target className="h-3 w-3" /> Search Volume</CardTitle></CardHeader>
            <CardContent><span className="text-lg font-semibold capitalize">{kwData.monthly_search_volume_estimate.replace('_', ' ')}</span></CardContent>
          </Card>
        )}
      </div>

      {/* Main Brief Content */}
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle>Article Outline</CardTitle><CardDescription>{brief.outline?.length || 0} sections</CardDescription></div>
            <button onClick={() => copyText(brief.outline?.join('\n') || '', 'outline')} className="text-muted-foreground hover:text-white">
              {copied === 'outline' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal pl-5 space-y-2">
              {(brief.outline || []).map((s: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">{s}</li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-start justify-between">
            <div><CardTitle>Key Points</CardTitle></div>
            <button onClick={() => copyText(brief.key_points?.join('\n') || '', 'points')} className="text-muted-foreground hover:text-white">
              {copied === 'points' ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-2">
              {(brief.key_points || []).map((p: string, i: number) => (
                <li key={i} className="text-sm text-muted-foreground">{p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {brief.tone_and_style && (
          <Card>
            <CardHeader><CardTitle>Tone & Style</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{brief.tone_and_style}</p></CardContent>
          </Card>
        )}

        {(brief.faq_ideas || []).length > 0 && (
          <Card>
            <CardHeader><CardTitle>FAQ Ideas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {brief.faq_ideas.map((faq: any, i: number) => (
                <div key={i}>
                  <p className="text-sm font-medium">Q: {faq.question}</p>
                  <p className="text-sm text-muted-foreground mt-1">A: {faq.answer}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      {/* SERP Analysis */}
      {serp.search_intent && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-4 w-4 text-accent" /> SERP Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {serp.featured_snippet_opportunity !== undefined && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Featured snippet opportunity:</span>
                <Badge variant={serp.featured_snippet_opportunity ? 'success' : 'secondary'}>
                  {serp.featured_snippet_opportunity ? 'Yes' : 'No'}
                </Badge>
              </div>
            )}
            {serp.people_also_ask?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">People Also Ask</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {serp.people_also_ask.map((q: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{q}</li>
                  ))}
                </ul>
              </div>
            )}
            {serp.related_searches?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Related Searches</h4>
                <div className="flex flex-wrap gap-2">
                  {serp.related_searches.map((s: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                  ))}
                </div>
              </div>
            )}
            {serp.opportunity_brief && (
              <p className="text-sm italic text-accent">{serp.opportunity_brief}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Content Gaps */}
      {gaps.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Lightbulb className="h-4 w-4 text-accent" /> Content Gap Analysis</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {gaps.map((g: any, i: number) => (
              <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                <Badge variant={g.importance === 'high' ? 'warning' : g.importance === 'medium' ? 'secondary' : 'success'} className="shrink-0">
                  {g.importance}
                </Badge>
                <div className="flex-1">
                  <p className="text-sm font-medium">{g.topic}</p>
                  {g.competitors_covering_it?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Covered by: {g.competitors_covering_it.join(', ')}
                    </p>
                  )}
                  <div className="flex gap-2 mt-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{g.content_format}</span>
                    {g.quick_win && <Badge variant="success" className="text-[10px] px-1">Quick Win</Badge>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Keyword Data */}
      {kwData.monthly_search_volume_estimate && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-accent" /> Keyword Intelligence</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold capitalize">{kwData.trend || '-'}</p>
                <p className="text-xs text-muted-foreground">Trend</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold capitalize">{kwData.cpc_estimate || '-'}</p>
                <p className="text-xs text-muted-foreground">CPC Estimate</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold capitalize">{kwData.seasonality || '-'}</p>
                <p className="text-xs text-muted-foreground">Seasonality</p>
              </div>
            </div>
            {kwData.related_keywords?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Related Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {kwData.related_keywords.map((kw: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-xs">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
            {kwData.long_tail_variations?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Long-tail Variations</h4>
                <ul className="list-disc pl-5 space-y-1">
                  {kwData.long_tail_variations.map((v: string, i: number) => (
                    <li key={i} className="text-sm text-muted-foreground">{v}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
