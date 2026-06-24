import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: portal } = await supabase
    .from('client_portal')
    .select('*')
    .eq('share_token', token)
    .eq('user_id', user.id)
    .single();

  if (!portal) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://kvantio.vercel.app'}/client/${token}`;

  const emailRes = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Kvant Client Portal <reports@kvantio.vercel.app>',
      to: [portal.client_email],
      subject: `Your Client Portal for ${portal.project_name}`,
      html: `<h2>Welcome, ${portal.client_name}!</h2>
<p>Your agency has shared a client portal with you for <strong>${portal.project_name}</strong>.</p>
<p><a href="${shareUrl}" style="display:inline-block;padding:12px 24px;background:#E19C63;color:#fff;text-decoration:none;border-radius:6px">View Your Portal</a></p>
<p>Or copy this link: <a href="${shareUrl}">${shareUrl}</a></p>`,
    }),
  });

  if (!emailRes.ok) {
    const err = await emailRes.text();
    return NextResponse.json({ error: 'Failed to send invite', details: err }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Invite sent' });
}
