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
  Link2, Plus, X, ExternalLink,
} from 'lucide-react';
import { useToast } from '@/lib/use-toast';
import { formatDate } from '@/lib/utils';

export default function BacklinksPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const [targetUrl, setTargetUrl] = useState('');
  const [referringDomain, setReferringDomain] = useState('');
  const [pageTitle, setPageTitle] = useState('');
  const [linkType, setLinkType] = useState('dofollow');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const totalBacklinks = monitors.length;
  const dofollowCount = monitors.filter((m) => m.link_type === 'dofollow').length;
  const lostCount = monitors.filter((m) => m.is_lost).length;
  const avgDa = monitors.length > 0
    ? Math.round(monitors.reduce((sum, m) => sum + (m.domain_authority || 0), 0) / monitors.length)
    : 0;

  useEffect(() => {
    fetchMonitors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchMonitors() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }
    const { data } = await supabase
      .from('backlink_monitors')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setMonitors(data);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/backlink-monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_url: targetUrl,
          referring_domain: referringDomain,
          page_title: pageTitle,
          link_type: linkType,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        addToast('Backlink added successfully', 'success');
        setTargetUrl('');
        setReferringDomain('');
        setPageTitle('');
        setLinkType('dofollow');
        setShowForm(false);
        fetchMonitors();
      }
    } catch {
      setError('Failed to add backlink');
    }
    setSubmitting(false);
  }

  async function toggleLost(id: string, currentLost: boolean) {
    await fetch('/api/backlink-monitors', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_lost: !currentLost }),
    });
    setMonitors((prev) =>
      prev.map((m) => (m.id === id ? { ...m, is_lost: !currentLost } : m))
    );
    addToast(
      currentLost ? 'Backlink marked as active' : 'Backlink marked as lost',
      'info'
    );
  }

  const statCards = [
    { label: 'Total Backlinks', value: totalBacklinks, color: 'text-white' },
    { label: 'Dofollow', value: dofollowCount, color: 'text-green-400' },
    { label: 'Lost', value: lostCount, color: 'text-red-400' },
    { label: 'Avg Domain Authority', value: avgDa, color: 'text-accent' },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton-text" style={{ width: '30%', height: 24 }} />
        <div className="skeleton-text-short" style={{ width: '50%' }} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton-card rounded-xl" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-bold">Backlink Monitor</h1>
        <p className="text-muted-foreground">
          Track referring domains and link quality
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in" style={{ animationDelay: '50ms' }}>
        {statCards.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="pt-6">
              <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Backlink */}
      <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
        {!showForm ? (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-1 h-4 w-4" /> Add Backlink
          </Button>
        ) : (
          <Card className="relative overflow-hidden">
            <button
              onClick={() => { setShowForm(false); setError(''); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <CardHeader>
              <CardTitle>Add Backlink</CardTitle>
              <CardDescription>Track a new referring domain pointing to your site</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="targetUrl">Target URL *</Label>
                    <Input
                      id="targetUrl"
                      value={targetUrl}
                      onChange={(e) => setTargetUrl(e.target.value)}
                      placeholder="https://yoursite.com/page"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="referringDomain">Referring Domain *</Label>
                    <Input
                      id="referringDomain"
                      value={referringDomain}
                      onChange={(e) => setReferringDomain(e.target.value)}
                      placeholder="example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pageTitle">Page Title</Label>
                    <Input
                      id="pageTitle"
                      value={pageTitle}
                      onChange={(e) => setPageTitle(e.target.value)}
                      placeholder="About Us - Example"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkType">Link Type</Label>
                    <select
                      id="linkType"
                      value={linkType}
                      onChange={(e) => setLinkType(e.target.value)}
                      className="flex h-10 w-full rounded-lg border border-white/10 bg-primary/50 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    >
                      <option value="dofollow">Dofollow</option>
                      <option value="nofollow">Nofollow</option>
                      <option value="redirect">Redirect</option>
                    </select>
                  </div>
                </div>
                <Button type="submit" disabled={submitting || !targetUrl || !referringDomain}>
                  {submitting ? 'Adding...' : <><Plus className="mr-1 h-4 w-4" /> Add Backlink</>}
                </Button>
                {error && <p className="text-sm text-red-400">{error}</p>}
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Backlinks List */}
      {monitors.length === 0 ? (
        <Card className="text-center py-16 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <CardContent>
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/10">
              <Link2 className="h-8 w-8 text-accent" />
            </div>
            <h3 className="text-lg font-semibold">No backlinks tracked yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Add your first backlink to start monitoring referring domains.
            </p>
            <Button className="mt-6" onClick={() => setShowForm(true)}>
              <Plus className="mr-1 h-4 w-4" /> Add Backlink
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '150ms' }}>
          <h2 className="text-lg font-semibold">All Backlinks ({totalBacklinks})</h2>
          <div className="grid gap-3">
            {monitors.map((m, i) => (
              <Card
                key={m.id}
                className="transition-all duration-300 hover:border-accent/30 hover:-translate-y-0.5 hover:shadow-[0_4px_20px_rgba(225,156,99,0.04)]"
                style={{ transitionDelay: `${i * 60}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    {/* Info */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">
                          {m.referring_domain}
                        </span>
                        <Badge
                          variant={
                            m.link_type === 'dofollow'
                              ? 'success'
                              : m.link_type === 'nofollow'
                              ? 'warning'
                              : 'default'
                          }
                          className="shrink-0"
                        >
                          {m.link_type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="truncate max-w-[200px] sm:max-w-[300px]">
                          {m.target_url}
                        </span>
                        <a
                          href={m.target_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:text-accent/80 shrink-0"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {m.page_title && (
                        <div className="text-xs text-muted-foreground/70 truncate">
                          {m.page_title}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground/50">
                        Added {formatDate(m.created_at)}
                      </div>
                    </div>

                    {/* DA + Status */}
                    <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1 shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-muted-foreground">DA</span>
                        <span className="text-sm font-semibold text-accent">
                          {m.domain_authority || '—'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={m.is_lost ? 'danger' : 'success'}>
                          {m.is_lost ? 'Lost' : 'Active'}
                        </Badge>
                        <button
                          onClick={() => toggleLost(m.id, m.is_lost)}
                          className="text-xs text-muted-foreground hover:text-white transition-colors underline underline-offset-2"
                        >
                          {m.is_lost ? 'Restore' : 'Mark lost'}
                        </button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
