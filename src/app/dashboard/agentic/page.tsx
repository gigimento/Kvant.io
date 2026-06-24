'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionGate } from '@/components/dashboard/subscription-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/use-toast';
import { Loader2, Globe, AlertTriangle, CheckCircle2, Zap, ThumbsDown, ListChecks } from 'lucide-react';

export default function AgenticPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/agentic/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (data.error) { addToast(data.error, 'error'); } else { setResult(data); addToast('Analysis complete', 'success'); }
    } catch { addToast('Failed to analyze', 'error'); }
    setLoading(false);
  }

  const a = result?.analysis || {};

  return (
    <SubscriptionGate>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Agentic Readiness</h1>
          <p className="text-muted-foreground">Audit how well AI agents can interact with your website and complete tasks</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Analyze Website</CardTitle><CardDescription>Enter a URL to check how AI agents can interact with it</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL *</Label>
                <Input id="url" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />
              </div>
              <Button type="submit" disabled={loading || !url.trim()}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analyzing...</> : <><Zap className="mr-1 h-4 w-4" /> Analyze</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Agentic Score</CardTitle></CardHeader>
                <CardContent>
                  <span className={`text-3xl font-bold ${a.overall_score >= 70 ? 'text-green-500' : a.overall_score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {a.overall_score}/100
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Task Completion</CardTitle></CardHeader>
                <CardContent>
                  <span className={`text-3xl font-bold ${a.task_completion_score >= 70 ? 'text-green-500' : a.task_completion_score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {a.task_completion_score}/100
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">WebMCP</CardTitle></CardHeader>
                <CardContent>
                  <Badge variant={a.webmcp_status === 'implemented' ? 'success' : a.webmcp_status === 'partial' ? 'warning' : 'secondary'}>
                    {a.webmcp_status || 'missing'}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Actions Possible */}
            {(a.actions_possible || []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ListChecks className="h-4 w-4 text-accent" /> Actions Possible by AI Agents</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {a.actions_possible.map((action: string, i: number) => (
                      <Badge key={i} variant="success" className="text-xs">{action}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Friction Points */}
            {(a.friction_points || []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><ThumbsDown className="h-4 w-4 text-accent" /> Friction Points ({a.friction_points.length})</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {a.friction_points.map((fp: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      <AlertTriangle className={`h-4 w-4 mt-0.5 shrink-0 ${fp.severity === 'high' ? 'text-red-500' : fp.severity === 'medium' ? 'text-yellow-500' : 'text-muted-foreground'}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{fp.page || fp.task}</span>
                          <Badge variant={fp.severity === 'high' ? 'danger' : fp.severity === 'medium' ? 'warning' : 'secondary'} className="text-[10px]">{fp.severity}</Badge>
                        </div>
                        {fp.issue && <p className="text-xs text-muted-foreground mt-1">{fp.issue}</p>}
                        {fp.recommendation && <p className="text-xs text-accent mt-1">{fp.recommendation}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Agent Hostile Patterns */}
            {(a.agent_hostile_patterns || []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Agent-Hostile Patterns</CardTitle></CardHeader>
                <CardContent>
                  <ul className="list-disc pl-5 space-y-1">
                    {a.agent_hostile_patterns.map((p: string, i: number) => (
                      <li key={i} className="text-sm text-muted-foreground">{p}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {a.summary && (
              <p className="text-sm text-muted-foreground italic">{a.summary}</p>
            )}
          </>
        )}
      </div>
    </SubscriptionGate>
  );
}
