import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: code } = await supabase
    .from('referral_codes')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!code) {
    return NextResponse.json({ total_clicks: 0, total_signups: 0, clicks_over_time: [] });
  }

  const { data: clicks } = await supabase
    .from('referral_clicks')
    .select('created_at, converted')
    .eq('referral_code_id', code.id)
    .order('created_at', { ascending: false });

  return NextResponse.json({
    code: code.code,
    total_clicks: code.total_clicks,
    total_signups: code.total_signups,
    recent_clicks: clicks || [],
  });
}
