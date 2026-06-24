import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: existing } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return NextResponse.json({ code: existing.code, total_clicks: existing.total_clicks, total_signups: existing.total_signups });
  }

  const code = generateCode();
  const { data: inserted, error } = await supabase
    .from('referral_codes')
    .insert({ user_id: user.id, code })
    .select('code, total_clicks, total_signups')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(inserted);
}

export async function POST() {
  return GET();
}
