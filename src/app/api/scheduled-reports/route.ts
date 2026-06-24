import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('scheduled_reports')
    .select('*, reports!inner(client_name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { report_id, frequency, recipient_email, day_of_week, day_of_month, subject } = body;

  if (!report_id || !frequency || !recipient_email) {
    return NextResponse.json({ error: 'report_id, frequency, and recipient_email are required' }, { status: 400 });
  }

  const now = new Date();
  let next_send_at = new Date();
  if (frequency === 'daily') next_send_at.setDate(next_send_at.getDate() + 1);
  else if (frequency === 'weekly') next_send_at.setDate(next_send_at.getDate() + 7);
  else next_send_at.setMonth(next_send_at.getMonth() + 1);

  const { data, error } = await supabase
    .from('scheduled_reports')
    .insert({
      user_id: user.id,
      report_id,
      frequency,
      recipient_email,
      day_of_week: day_of_week ?? 1,
      day_of_month: day_of_month ?? 1,
      subject: subject || 'Your Scheduled Report',
      next_send_at: next_send_at.toISOString(),
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { id, is_active } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const { data, error } = await supabase
    .from('scheduled_reports')
    .update({ is_active })
    .eq('id', id)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
