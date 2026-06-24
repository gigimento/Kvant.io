CREATE TABLE IF NOT EXISTS scheduled_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE,
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  day_of_week INTEGER DEFAULT 1 CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 31),
  recipient_email TEXT NOT NULL,
  subject TEXT DEFAULT 'Your Scheduled Report',
  is_active BOOLEAN DEFAULT true,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE scheduled_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own scheduled reports" ON scheduled_reports;
CREATE POLICY "Users can manage own scheduled reports"
  ON scheduled_reports
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next ON scheduled_reports(next_send_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_user ON scheduled_reports(user_id);
