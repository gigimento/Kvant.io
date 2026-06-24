'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, FileEdit } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ClientPortal {
  id: string;
  client_name: string;
  project_name: string;
  branding: Record<string, any>;
  allowed_reports: string[];
  allowed_briefs: string[];
}

export default function ClientViewPage() {
  const { token } = useParams() as { token: string };
  const [portal, setPortal] = useState<ClientPortal | null>(null);
  const [reports, setReports] = useState<any[]>([]);
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/client-portal/${token}`);
        if (!res.ok) { setError('Invalid or expired link'); setLoading(false); return; }
        const data = await res.json();
        setPortal(data.portal);
        setReports(data.reports || []);
        setBriefs(data.briefs || []);
      } catch { setError('Failed to load'); }
      setLoading(false);
    }
    load();
  }, [token]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#27262E]">
      <Loader2 className="h-6 w-6 animate-spin text-accent" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-[#27262E]">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center">
          <p className="text-lg font-medium text-red-400">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#27262E]">
      <header className="border-b border-white/10 px-6 py-4">
        <h1 className="text-xl font-bold text-accent">{portal?.project_name || 'Client Dashboard'}</h1>
        <p className="text-sm text-muted-foreground">Welcome, {portal?.client_name}</p>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        {reports.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-accent" /> Reports
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {reports.map((r) => (
                <Card key={r.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{r.client_name || 'Report'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{r.period_start} - {r.period_end}</p>
                    {r.narrative_text && (
                      <p className="text-sm mt-2 line-clamp-3">{r.narrative_text}</p>
                    )}
                    {r.pdf_url && (
                      <a
                        href={r.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-accent hover:underline mt-2 inline-block"
                      >
                        View PDF
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {briefs.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileEdit className="h-5 w-5 text-accent" /> Content Briefs
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {briefs.map((b) => (
                <Card key={b.id}>
                  <CardHeader>
                    <CardTitle className="text-sm">{b.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">{b.keyword}</p>
                    {b.outline && Array.isArray(b.outline) && b.outline.length > 0 && (
                      <ul className="text-sm mt-2 space-y-1">
                        {b.outline.slice(0, 5).map((item: string, i: number) => (
                          <li key={i} className="text-muted-foreground">- {item}</li>
                        ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {reports.length === 0 && briefs.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No content shared yet.</p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
