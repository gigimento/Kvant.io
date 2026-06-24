'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Loader2, Sparkles, ArrowRight, FileEdit, Search, Clock,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/lib/use-toast';
import { formatDate } from '@/lib/utils';

export default function ContentBriefsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [keyword, setKeyword] = useState('');
  const [audience, setAudience] = useState('');
  const [goal, setGoal] = useState('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      supabase.from('content_briefs').select('*').order('created_at', { ascending: false }).then((res) => {
        if (res.data) setBriefs(res.data);
        setLoading(false);
      });
    });
  }, [router]);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    setGenerating(true);
    try {
      const res = await fetch('/api/content-briefs/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, audience: audience || undefined, goal: goal || undefined }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); } else {
        addToast('Brief generated successfully', 'success');
        setKeyword('');
        setAudience('');
        setGoal('');
        const { data: fresh } = await supabase.from('content_briefs').select('*').order('created_at', { ascending: false });
        if (fresh) setBriefs(fresh);
      }
    } catch { setError('Failed to generate brief'); }
    setGenerating(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-text" style={{ width: '30%', height: 24 }} />
        <div className="skeleton-text-short" style={{ width: '50%' }} />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-card rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Content Briefs</h1>
        <p className="text-muted-foreground">
          Generate AI-powered content briefs with SERP analysis, competitor gaps, and keyword data
        </p>
      </div>

      <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
        <CardHeader>
          <CardTitle>Generate New Brief</CardTitle>
          <CardDescription>Enter a keyword to create a comprehensive content brief</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="keyword">Target Keyword *</Label>
                <Input id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="e.g., AI marketing tools" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="audience">Audience</Label>
                <Input id="audience" value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="e.g., Marketing managers" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">Goal</Label>
                <select id="goal" value={goal} onChange={(e) => setGoal(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-white/10 bg-primary/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  <option value="">Select</option>
                  <option value="Inform">Inform</option>
                  <option value="Educate">Educate</option>
                  <option value="Convert">Convert</option>
                  <option value="Entertain">Entertain</option>
                </select>
              </div>
            </div>
            <Button type="submit" disabled={generating || !keyword}>
              {generating ? <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-1 h-4 w-4" /> Generate Brief</>}
            </Button>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </form>
        </CardContent>
      </Card>

      {briefs.length === 0 ? (
        <Card className="text-center py-16 animate-fade-in">
          <CardContent>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <FileEdit className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">No briefs yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Generate your first content brief to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Brief History ({briefs.length})</h2>
          <div className="grid gap-3">
            {briefs.map((b, i) => (
              <Link key={b.id} href={`/dashboard/content-briefs/${b.id}`} className="reveal" style={{ transitionDelay: `${i * 60}ms` }}>
                <Card className="transition-all duration-300 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(225,156,99,0.04)] cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{b.title || b.keyword}</CardTitle>
                      <CardDescription>
                        {b.keyword}{b.audience ? ` · ${b.audience}` : ''}{b.goal ? ` · ${b.goal}` : ''}
                        {' · '}{formatDate(b.created_at)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-3">
                      {b.content_gap?.length > 0 && (
                        <span className="text-xs text-muted-foreground">{b.content_gap.length} gaps</span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
