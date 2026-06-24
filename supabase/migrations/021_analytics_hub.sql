CREATE TABLE IF NOT EXISTS analytics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}',
  cached_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE analytics_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own analytics cache" ON analytics_cache;
CREATE POLICY "Users can manage own analytics cache"
  ON analytics_cache
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
