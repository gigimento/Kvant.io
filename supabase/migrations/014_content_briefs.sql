-- Content Briefs storage

CREATE TABLE IF NOT EXISTS content_briefs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  audience TEXT DEFAULT '',
  goal TEXT DEFAULT '',
  title TEXT NOT NULL,
  outline JSONB DEFAULT '[]',
  key_points JSONB DEFAULT '[]',
  faq_ideas JSONB DEFAULT '[]',
  tone_and_style TEXT DEFAULT '',
  serp_analysis JSONB DEFAULT '{}',
  content_gap JSONB DEFAULT '[]',
  keyword_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE content_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own content briefs"
  ON content_briefs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content briefs"
  ON content_briefs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own content briefs"
  ON content_briefs FOR DELETE
  USING (auth.uid() = user_id);

-- Update user_features default to include content-briefs (already there from 010)
