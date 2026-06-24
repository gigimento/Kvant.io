import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await supabase.from('backlink_monitors').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
  return NextResponse.json(data || []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { target_url, referring_domain, page_title, link_type } = body;
  if (!target_url || !referring_domain) {
    return NextResponse.json({ error: 'target_url and referring_domain required' }, { status: 400 });
  }
  const { data, error } = await supabase.from('backlink_monitors').insert({
    user_id: user.id, target_url, referring_domain, page_title: page_title || '', link_type: link_type || 'dofollow',
    domain_authority: Math.floor(Math.random() * 60) + 10,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json();
  const { id, is_lost } = body;
  await supabase.from('backlink_monitors').update({ is_lost }).eq('id', id).eq('user_id', user.id);
  return NextResponse.json({ success: true });
}
