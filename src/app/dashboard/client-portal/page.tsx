'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Copy, Check, ExternalLink, Plus, Users } from 'lucide-react';

interface ClientPortal {
  id: string;
  client_name: string;
  client_email: string;
  project_name: string;
  share_token: string;
  last_viewed_at: string | null;
  created_at: string;
}

export default function ClientPortalPage() {
  const [portals, setPortals] = useState<ClientPortal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [project, setProject] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function loadPortals() {
    setLoading(true);
    try {
      const res = await fetch('/api/client-portal');
      const data = await res.json();
      if (Array.isArray(data)) setPortals(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createPortal() {
    if (!name || !email || !project) return;
    setCreating(true);
    try {
      const res = await fetch('/api/client-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_name: name, client_email: email, project_name: project }),
      });
      if (res.ok) {
        setName(''); setEmail(''); setProject(''); setShowForm(false);
        await loadPortals();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  }

  function getShareUrl(token: string) {
    return `${window.location.origin}/client/${token}`;
  }

  async function copyLink(token: string) {
    const url = getShareUrl(token);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(token);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  }

  useEffect(() => { loadPortals(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Client Portal</h1>
          <p className="text-muted-foreground">Share reports and briefs with clients via a white-label link</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> New Client
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Client</CardTitle>
            <CardDescription>They will receive a unique link to view their content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Corp" />
            </div>
            <div>
              <Label>Client Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="client@acme.com" />
            </div>
            <div>
              <Label>Project Name</Label>
              <Input value={project} onChange={(e) => setProject(e.target.value)} placeholder="e.g. Q3 Marketing Campaign" />
            </div>
            <Button onClick={createPortal} disabled={creating || !name || !email || !project}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Portal
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : portals.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No clients yet</p>
            <p className="text-muted-foreground">Create a client portal to share reports and briefs.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {portals.map((p) => (
            <Card key={p.id}>
              <CardHeader>
                <CardTitle className="text-base">{p.project_name}</CardTitle>
                <CardDescription>{p.client_name} - {p.client_email}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input value={getShareUrl(p.share_token)} readOnly className="text-xs" />
                  <Button variant="outline" size="sm" onClick={() => copyLink(p.share_token)}>
                    {copiedId === p.share_token ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href={getShareUrl(p.share_token)} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
                  {p.last_viewed_at ? (
                    <span>Last viewed {new Date(p.last_viewed_at).toLocaleDateString()}</span>
                  ) : (
                    <span>Not yet viewed</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
