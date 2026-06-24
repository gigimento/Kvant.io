'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SubscriptionGate } from '@/components/dashboard/subscription-gate';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/lib/use-toast';
import {
  ScanLine,
  Plus,
  ArrowRight,
  Loader2,
  X,
  BarChart3,
  Globe,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const STATUS_MAP: Record<string, { label: string; variant: 'warning' | 'success' | 'secondary' }> = {
  running: { label: 'Running', variant: 'warning' },
  ready: { label: 'Ready', variant: 'success' },
  failed: { label: 'Failed', variant: 'secondary' },
};

export default function CitationAuditPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const [brandName, setBrandName] = useState('');
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [competitorInput, setCompetitorInput] = useState('');
  const [industry, setIndustry] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push('/login');
        return;
      }
      fetch('/api/citation-audit')
        .then((r) => r.json())
        .then((res) => {
          if (Array.isArray(res)) setAudits(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    });
  }, [router]);

  function addCompetitor() {
    const val = competitorInput.trim();
    if (val && !competitors.includes(val)) {
      setCompetitors([...competitors, val]);
      setCompetitorInput('');
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!brandName.trim()) return;
    setCreating(true);

    try {
      const res = await fetch('/api/citation-audit/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brand_name: brandName.trim(),
          competitors,
          industry: industry.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        addToast(data.error || 'Failed to start audit', 'error');
        setCreating(false);
        return;
      }

      addToast('Audit started! Results will appear shortly.', 'success');
      const supabase = createClient();
      const result = await supabase.auth.getUser();
      if (result.data.user) {
        const { data: fresh } = await supabase
          .from('citation_audits')
          .select('*')
          .eq('user_id', result.data.user.id)
          .order('created_at', { ascending: false });
        if (fresh) setAudits(fresh);
      }
    } catch (err: any) {
      addToast(err.message || 'Network error', 'error');
    }

    setCreating(false);
  }

  if (loading) {
    return (
      <SubscriptionGate feature="citation-audit">
        <div className="space-y-6">
          <div className="skeleton-text" style={{ width: '30%', height: 24 }} />
          <div className="skeleton-text-short" style={{ width: '50%' }} />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton-card rounded-xl" style={{ minHeight: 80 }} />
            ))}
          </div>
        </div>
      </SubscriptionGate>
    );
  }

  return (
    <SubscriptionGate feature="citation-audit">
      <div className="space-y-8">
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold">AI Citation Audit</h1>
          <p className="text-muted-foreground">
            Track brand visibility across ChatGPT, Claude, Gemini & Perplexity
          </p>
        </div>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-base">New Audit</CardTitle>
            <CardDescription>
              Enter your brand details to run a citation audit across 4 AI platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand Name *</Label>
                  <Input
                    id="brand"
                    placeholder="e.g. Acme Marketing"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    placeholder="e.g. Digital Marketing"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Competitors</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Competitor Co"
                    value={competitorInput}
                    onChange={(e) => setCompetitorInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === 'Enter' && (e.preventDefault(), addCompetitor())
                    }
                  />
                  <Button type="button" variant="outline" onClick={addCompetitor}>
                    Add
                  </Button>
                </div>
                {competitors.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {competitors.map((c) => (
                      <span
                        key={c}
                        className="flex items-center gap-1 rounded-full bg-white/5 px-3 py-1 text-xs"
                      >
                        {c}
                        <button
                          onClick={() =>
                            setCompetitors(competitors.filter((x) => x !== c))
                          }
                          className="text-muted-foreground hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={creating || !brandName.trim()}
              >
                {creating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running Audit...
                  </>
                ) : (
                  <>
                    <ScanLine className="mr-2 h-4 w-4" /> Run Citation Audit
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Audit History</h2>

          {audits.length === 0 ? (
            <Card className="text-center py-16">
              <CardContent>
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
                  <BarChart3 className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-lg font-semibold">No audits yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Run your first citation audit to see how AI platforms mention your brand.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3">
              {audits.map((a, i) => {
                const status = STATUS_MAP[a.status] || STATUS_MAP.running;
                const rate = a.summary?.overall_citation_rate ?? null;
                return (
                  <Link
                    key={a.id}
                    href={`/dashboard/citation-audit/${a.id}`}
                    className="reveal"
                    style={{ transitionDelay: `${i * 60}ms` }}
                  >
                    <Card className="transition-all duration-300 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(225,156,99,0.04)] cursor-pointer">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle className="text-base">{a.brand_name}</CardTitle>
                          <CardDescription>
                            {a.competitors?.length || 0} competitors
                            {a.industry ? ` · ${a.industry}` : ''}
                            {a.created_at
                              ? ` · ${new Date(a.created_at).toLocaleDateString()}`
                              : ''}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-4">
                          {rate !== null && (
                            <span className="text-sm font-semibold">
                              {rate}% cited
                            </span>
                          )}
                          <Badge variant={status.variant}>{status.label}</Badge>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </CardHeader>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </SubscriptionGate>
  );
}
