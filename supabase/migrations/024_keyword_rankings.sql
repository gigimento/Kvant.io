CREATE TABLE IF NOT EXISTS keyword_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  target_url TEXT NOT NULL,
  current_position INTEGER DEFAULT 0,
  best_position INTEGER DEFAULT 0,
  search_volume INTEGER DEFAULT 0,
  serp_features TEXT[] DEFAULT '{}',
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE keyword_rankings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own keyword rankings" ON keyword_rankings;
CREATE POLICY "Users can manage own keyword rankings"
  ON keyword_rankings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_keyword_rankings_user ON keyword_rankings(user_id);

CREATE TABLE IF NOT EXISTS keyword_rank_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES keyword_rankings(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE keyword_rank_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own rank history" ON keyword_rank_history;
CREATE POLICY "Users can view own rank history"
  ON keyword_rank_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM keyword_rankings
      WHERE keyword_rankings.id = keyword_rank_history.keyword_id
      AND keyword_rankings.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_rank_history_keyword ON keyword_rank_history(keyword_id, checked_at DESC);
