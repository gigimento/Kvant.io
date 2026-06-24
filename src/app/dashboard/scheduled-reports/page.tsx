'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Mail, Check, X } from 'lucide-react';

interface Report {
  id: string;
  client_name: string;
  period_start: string;
  period_end: string;
}

interface ScheduledReport {
  id: string;
  report_id: string;
  frequency: string;
  day_of_week: number;
  day_of_month: number;
  recipient_email: string;
  subject: string;
  is_active: boolean;
  last_sent_at: string | null;
  next_send_at: string;
  created_at: string;
  reports: { client_name: string };
}

export default function ScheduledReportsPage() {
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [reportId, setReportId] = useState('');
  const [freq, setFreq] = useState('weekly');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [creating, setCreating] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [schRes, repRes] = await Promise.all([
        fetch('/api/scheduled-reports'),
        fetch('/api/reports'),
      ]);
      const schData = await schRes.json();
      const repData = await repRes.json();
      if (Array.isArray(schData)) setSchedules(schData);
      if (repData?.data && Array.isArray(repData.data)) setReports(repData.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function createSchedule() {
    if (!reportId || !email) return;
    setCreating(true);
    try {
      const res = await fetch('/api/scheduled-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          report_id: reportId,
          frequency: freq,
          recipient_email: email,
          subject: subject || undefined,
        }),
      });
      if (res.ok) {
        setReportId(''); setFreq('weekly'); setEmail(''); setSubject(''); setShowForm(false);
        await loadData();
      }
    } catch (e) { console.error(e); }
    setCreating(false);
  }

  async function toggleActive(id: string, current: boolean) {
    try {
      await fetch('/api/scheduled-reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_active: !current }),
      });
      await loadData();
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadData(); }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Scheduled Reports</h1>
          <p className="text-muted-foreground">Automatically email reports to clients on a schedule</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> New Schedule
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create Schedule</CardTitle>
            <CardDescription>Choose a report and set delivery frequency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Report</Label>
              <select
                value={reportId}
                onChange={(e) => setReportId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select a report</option>
                {reports.map((r) => (
                  <option key={r.id} value={r.id}>{r.client_name} ({r.period_start})</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Frequency</Label>
              <select
                value={freq}
                onChange={(e) => setFreq(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div>
              <Label>Recipient Email</Label>
              <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="client@example.com" />
            </div>
            <div>
              <Label>Subject (optional)</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Your Monthly Report" />
            </div>
            <Button onClick={createSchedule} disabled={creating || !reportId || !email}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-accent" />
        </div>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No schedules yet</p>
            <p className="text-muted-foreground">Set up automated email delivery for your reports.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((s) => (
            <Card key={s.id} className={s.is_active ? '' : 'opacity-60'}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.reports?.client_name || 'Report'}</span>
                    <span className="text-xs bg-accent/10 text-accent px-2 py-0.5 rounded-full capitalize">{s.frequency}</span>
                    {s.is_active ? (
                      <span className="text-xs text-green-400">Active</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Paused</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-3 w-3" /> {s.recipient_email}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Next: {new Date(s.next_send_at).toLocaleDateString()}
                    {s.last_sent_at && <> | Last sent: {new Date(s.last_sent_at).toLocaleDateString()}</>}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toggleActive(s.id, s.is_active)}>
                  {s.is_active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
