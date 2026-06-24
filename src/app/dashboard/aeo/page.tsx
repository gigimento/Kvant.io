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
import { Loader2, Globe, FileCode, CheckCircle2, XCircle, AlertTriangle, Copy, Check, ExternalLink } from 'lucide-react';

export default function AEOPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [url, setUrl] = useState('');
  const [brandName, setBrandName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  async function handleAnalyze(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/aeo/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), brand_name: brandName.trim() || undefined }),
      });
      const data = await res.json();
      if (data.error) { addToast(data.error, 'error'); } else { setResult(data); addToast('Analysis complete', 'success'); }
    } catch { addToast('Failed to analyze', 'error'); }
    setLoading(false);
  }

  function copyLLMSTxt() {
    if (!result?.llms_txt_generated?.content) return;
    navigator.clipboard.writeText(result.llms_txt_generated.content);
    setCopied(true);
    addToast('Copied to clipboard', 'info');
    setTimeout(() => setCopied(false), 2000);
  }

  const analysis = result?.analysis || {};

  return (
    <SubscriptionGate>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">AEO Foundations</h1>
          <p className="text-muted-foreground">Analyze AI crawler access, generate llms.txt, and optimize for answer engines</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Analyze Website</CardTitle><CardDescription>Enter a URL to check its AEO readiness</CardDescription></CardHeader>
          <CardContent>
            <form onSubmit={handleAnalyze} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL *</Label>
                  <Input id="url" type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand Name</Label>
                  <Input id="brand" placeholder="e.g., Acme Inc" value={brandName} onChange={(e) => setBrandName(e.target.value)} />
                </div>
              </div>
              <Button type="submit" disabled={loading || !url.trim()}>
                {loading ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analyzing...</> : <><Globe className="mr-1 h-4 w-4" /> Analyze</>}
              </Button>
            </form>
          </CardContent>
        </Card>

        {result && (
          <>
            {/* Score */}
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">AEO Score</CardTitle></CardHeader>
                <CardContent>
                  <span className={`text-3xl font-bold ${analysis.overall_score >= 70 ? 'text-green-500' : analysis.overall_score >= 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {analysis.overall_score}/100
                  </span>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">llms.txt</CardTitle></CardHeader>
                <CardContent>
                  <Badge variant={result.llms_txt_exists ? 'success' : 'warning'}>
                    {result.llms_txt_exists ? 'Present' : 'Missing'}
                  </Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Issues Found</CardTitle></CardHeader>
                <CardContent>
                  <span className="text-3xl font-bold">{(analysis.issues || []).length}</span>
                </CardContent>
              </Card>
            </div>

            {/* AI Crawler Access */}
            {analysis.ai_crawler_access && (
              <Card>
                <CardHeader><CardTitle className="text-base">AI Crawler Access</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {Object.entries(analysis.ai_crawler_access).map(([bot, status]) => (
                      <div key={bot} className="text-center p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                        <p className="text-xs font-medium mb-2 capitalize">{bot.replace(/_/g, ' ')}</p>
                        {status === 'allowed' && <CheckCircle2 className="h-5 w-5 text-green-500 mx-auto" />}
                        {status === 'blocked' && <XCircle className="h-5 w-5 text-red-500 mx-auto" />}
                        {status === 'unknown' && <AlertTriangle className="h-5 w-5 text-yellow-500 mx-auto" />}
                        <p className="text-[10px] mt-1 capitalize">{status as string}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Issues */}
            {(analysis.issues || []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base">Issues & Recommendations</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {analysis.issues.map((issue: any, i: number) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg border border-white/5 bg-white/[0.02] p-3">
                      {issue.status === 'pass' ? <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" /> :
                       issue.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" /> :
                       <XCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{issue.check}</span>
                          <Badge variant={issue.priority === 'P1' ? 'warning' : issue.priority === 'P2' ? 'danger' : 'secondary'} className="text-[10px]">{issue.priority}</Badge>
                        </div>
                        {issue.details && <p className="text-xs text-muted-foreground mt-1">{issue.details}</p>}
                        {issue.recommendation && <p className="text-xs text-accent mt-1">{issue.recommendation}</p>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* llms.txt Section Suggestions */}
            {(analysis.recommended_llms_txt_sections || []).length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileCode className="h-4 w-4 text-accent" /> Recommended llms.txt Sections</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {analysis.recommended_llms_txt_sections.map((s: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Generated llms.txt */}
            {result.llms_txt_generated?.content && (
              <Card>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div><CardTitle className="text-base flex items-center gap-2"><FileCode className="h-4 w-4 text-accent" /> Generated llms.txt</CardTitle><CardDescription>AI-generated llms.txt for {url}</CardDescription></div>
                  <button onClick={copyLLMSTxt} className="text-muted-foreground hover:text-white">
                    {copied ? <Check className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                  </button>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs text-muted-foreground bg-white/[0.02] rounded-lg p-4 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap font-mono">
                    {result.llms_txt_generated.content}
                  </pre>
                </CardContent>
              </Card>
            )}

            {analysis.summary && (
              <p className="text-sm text-muted-foreground italic">{analysis.summary}</p>
            )}
          </>
        )}
      </div>
    </SubscriptionGate>
  );
}
