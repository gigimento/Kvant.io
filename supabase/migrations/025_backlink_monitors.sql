CREATE TABLE IF NOT EXISTS backlink_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  target_url TEXT NOT NULL,
  referring_domain TEXT NOT NULL,
  page_title TEXT DEFAULT '',
  link_type TEXT DEFAULT 'dofollow' CHECK (link_type IN ('dofollow', 'nofollow', 'redirect')),
  domain_authority INTEGER DEFAULT 0,
  first_seen_at TIMESTAMPTZ DEFAULT now(),
  is_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE backlink_monitors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own backlinks" ON backlink_monitors;
CREATE POLICY "Users can manage own backlinks"
  ON backlink_monitors
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_backlink_monitors_user ON backlink_monitors(user_id);
CREATE INDEX IF NOT EXISTS idx_backlink_monitors_url ON backlink_monitors(target_url);
