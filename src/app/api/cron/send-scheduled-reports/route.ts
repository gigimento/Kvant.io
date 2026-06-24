import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createAdminClient();
    const now = new Date().toISOString();

    const { data: schedules } = await supabase
      .from('scheduled_reports')
      .select('*, reports!inner(id, client_name, period_start, period_end, narrative_text, pdf_url, user_id)')
      .eq('is_active', true)
      .lte('next_send_at', now);

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    let sent = 0;
    for (const schedule of schedules) {
      try {
        const report = schedule.reports;
        if (!report) continue;

        const { data: profiles } = await supabase
          .from('profiles')
          .select('full_name, company_name')
          .eq('id', report.user_id)
          .single();

        let html = `<h1>${schedule.subject || 'Scheduled Report'}</h1>`;
        html += `<p><strong>Client:</strong> ${report.client_name || 'N/A'}</p>`;
        html += `<p><strong>Period:</strong> ${report.period_start} - ${report.period_end}</p>`;
        if (report.narrative_text) html += `<p>${report.narrative_text.slice(0, 500)}...</p>`;
        if (report.pdf_url) html += `<p><a href="${report.pdf_url}">Download PDF Report</a></p>`;
        if (profiles?.company_name) html += `<p><small>Sent via ${profiles.company_name}</small></p>`;

        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Kvant Reports <reports@kvantio.vercel.app>',
            to: [schedule.recipient_email],
            subject: schedule.subject || 'Your Scheduled Report',
            html,
          }),
        });

        if (!emailRes.ok) {
          const errBody = await emailRes.text();
          console.error(`Email send failed for schedule ${schedule.id}: ${errBody}`);
          continue;
        }

        const nextSend = new Date();
        if (schedule.frequency === 'daily') nextSend.setDate(nextSend.getDate() + 1);
        else if (schedule.frequency === 'weekly') nextSend.setDate(nextSend.getDate() + 7);
        else nextSend.setMonth(nextSend.getMonth() + 1);

        await supabase
          .from('scheduled_reports')
          .update({
            last_sent_at: now,
            next_send_at: nextSend.toISOString(),
          })
          .eq('id', schedule.id);

        sent++;
      } catch (e) {
        console.error(`Schedule ${schedule.id} failed:`, e);
      }
    }

    return NextResponse.json({ sent });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
