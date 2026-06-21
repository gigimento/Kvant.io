-- Client share links
CREATE TABLE IF NOT EXISTS client_share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES reports(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_share_links ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_share_links' AND policyname = 'Users can view own share links') THEN
    CREATE POLICY "Users can view own share links" ON client_share_links FOR SELECT
      USING (EXISTS (SELECT 1 FROM reports WHERE reports.id = client_share_links.report_id AND reports.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_share_links' AND policyname = 'Users can insert own share links') THEN
    CREATE POLICY "Users can insert own share links" ON client_share_links FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM reports WHERE reports.id = client_share_links.report_id AND reports.user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'client_share_links' AND policyname = 'Anyone can view active share links') THEN
    CREATE POLICY "Anyone can view active share links" ON client_share_links FOR SELECT
      USING (expires_at IS NULL OR expires_at > now());
  END IF;
END $$;

-- Report config recipients
ALTER TABLE report_configs ADD COLUMN IF NOT EXISTS recipients TEXT[] DEFAULT '{}';

-- Profile brand settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS brand_settings JSONB DEFAULT '{}'::jsonb;
