CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  keyword TEXT NOT NULL,
  audience TEXT,
  goal TEXT,
  title TEXT NOT NULL,
  outline JSONB NOT NULL DEFAULT '[]',
  key_points JSONB NOT NULL DEFAULT '[]',
  faq_ideas JSONB NOT NULL DEFAULT '[]',
  tone_and_style TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own briefs"
  ON content_briefs
  USING (user_id = auth.uid());

CREATE INDEX idx_content_briefs_user_id ON content_briefs(user_id);
CREATE INDEX idx_content_briefs_created_at ON content_briefs(created_at DESC);
