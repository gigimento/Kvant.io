import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: portal, error } = await supabase
    .from('client_portal')
    .select('*')
    .eq('share_token', token)
    .single();

  if (error || !portal) {
    return NextResponse.json({ error: 'Invalid or expired link' }, { status: 404 });
  }

  const [reportsRes, briefsRes] = await Promise.all([
    supabase.from('reports').select('id, client_name, period_start, period_end, narrative_text, pdf_url, created_at').in('id', portal.allowed_reports).order('created_at', { ascending: false }),
    supabase.from('content_briefs').select('id, title, keyword, outline, created_at').in('id', portal.allowed_briefs).order('created_at', { ascending: false }),
  ]);

  await supabase.from('client_portal').update({ last_viewed_at: new Date().toISOString() }).eq('id', portal.id);

  return NextResponse.json({
    portal: {
      id: portal.id,
      client_name: portal.client_name,
      project_name: portal.project_name,
      branding: portal.branding,
      allowed_reports: portal.allowed_reports,
      allowed_briefs: portal.allowed_briefs,
    },
    reports: reportsRes.data || [],
    briefs: briefsRes.data || [],
  });
}
