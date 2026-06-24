import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: audit, error: auditError } = await supabase
    .from('citation_audits')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (auditError || !audit) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const { data: results, error: resultsError } = await supabase
    .from('citation_results')
    .select('*')
    .eq('audit_id', id)
    .order('prompt_index', { ascending: true });

  if (resultsError) {
    return NextResponse.json({ error: resultsError.message }, { status: 500 });
  }

  return NextResponse.json({ audit, results });
}
