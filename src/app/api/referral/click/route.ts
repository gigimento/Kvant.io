import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    const { code } = await request.json();
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 });

    const supabase = await createClient();

    const { data: referral } = await supabase
      .from('referral_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (!referral) return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });

    // Record click
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '';
    const ua = request.headers.get('user-agent') || '';

    const admin = createAdminClient();
    await admin.from('referral_clicks').insert({
      referral_code_id: referral.id,
      ip_address: ip,
      user_agent: ua,
    });

    await admin
      .from('referral_codes')
      .update({ total_clicks: (referral.total_clicks || 0) + 1 })
      .eq('id', referral.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
