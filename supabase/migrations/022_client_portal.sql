CREATE TABLE IF NOT EXISTS client_portal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  project_name TEXT NOT NULL,
  share_token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(24), 'hex'),
  branding JSONB DEFAULT '{}',
  allowed_reports UUID[] DEFAULT '{}',
  allowed_briefs UUID[] DEFAULT '{}',
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE client_portal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own client portals" ON client_portal;
CREATE POLICY "Users can manage own client portals"
  ON client_portal
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_client_portal_share_token ON client_portal(share_token);
CREATE INDEX IF NOT EXISTS idx_client_portal_user_id ON client_portal(user_id);
