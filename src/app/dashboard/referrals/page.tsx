'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Gift, Copy, Check, Users, MousePointerClick, UserPlus, Share2 } from 'lucide-react';
import { useToast } from '@/lib/use-toast';

const REFERRAL_BASE_URL = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';

export default function ReferralsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [code, setCode] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralUrl, setReferralUrl] = useState('');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { router.push('/login'); return; }
      try {
        const res = await fetch('/api/referral/code');
        const data2 = await res.json();
        if (data2.code) {
          setCode(data2.code);
          setReferralUrl(`${REFERRAL_BASE_URL}/register?ref=${data2.code}`);
        }
      } catch {}
      try {
        const res = await fetch('/api/referral/stats');
        const data2 = await res.json();
        setStats(data2);
      } catch {}
      setLoading(false);
    });
  }, [router]);

  function copyReferralLink() {
    if (!referralUrl) return;
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    addToast('Referral link copied!', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Referral Program</h1>
        <p className="text-muted-foreground">Share Kvant and earn rewards</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="animate-fade-in" style={{ animationDelay: '50ms' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4 text-accent" /> Referral Code</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-widest">{code || '---'}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><MousePointerClick className="h-4 w-4 text-accent" /> Total Clicks</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_clicks || 0}</div>
          </CardContent>
        </Card>
        <Card className="animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground flex items-center gap-2"><UserPlus className="h-4 w-4 text-accent" /> Signups</CardTitle></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_signups || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Share Card */}
      <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Share2 className="h-4 w-4 text-accent" /> Share Your Referral Link</CardTitle>
          <CardDescription>Share this link with friends and colleagues</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={referralUrl} readOnly className="font-mono text-sm" onClick={(e) => (e.target as HTMLInputElement).select()} />
            <Button onClick={copyReferralLink}>
              {copied ? <><Check className="mr-1 h-4 w-4" /> Copied</> : <><Copy className="mr-1 h-4 w-4" /> Copy</>}
            </Button>
          </div>
          <div className="flex gap-2">
            {['Twitter', 'LinkedIn', 'Email'].map((platform) => {
              let shareUrl = '';
              const text = encodeURIComponent(`Try Kvant - the AI-powered agency toolkit! Sign up with my referral link: ${referralUrl}`);
              if (platform === 'Twitter') shareUrl = `https://twitter.com/intent/tweet?text=${text}`;
              else if (platform === 'LinkedIn') shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;
              else if (platform === 'Email') shareUrl = `mailto:?subject=${encodeURIComponent('Try Kvant')}&body=${text}`;

              return (
                <Button key={platform} variant="outline" size="sm" onClick={() => window.open(shareUrl, '_blank')}>
                  {platform}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {stats?.recent_clicks?.length > 0 && (
        <Card className="animate-fade-in" style={{ animationDelay: '250ms' }}>
          <CardHeader><CardTitle className="text-base">Recent Activity</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.recent_clicks.slice(0, 10).map((click: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm border-b border-white/5 py-2 last:border-0">
                  <span className="text-muted-foreground">
                    {new Date(click.created_at).toLocaleDateString()} {new Date(click.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <Badge variant={click.converted ? 'success' : 'secondary'}>
                    {click.converted ? 'Converted' : 'Click'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(!stats?.recent_clicks || stats.recent_clicks.length === 0) && (
        <Card className="text-center py-16 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <CardContent>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Gift className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">No referrals yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">Share your referral link to start earning rewards.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
