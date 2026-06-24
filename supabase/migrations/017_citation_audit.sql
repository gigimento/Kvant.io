CREATE TABLE IF NOT EXISTS citation_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  competitors TEXT[] DEFAULT '{}',
  industry TEXT DEFAULT '',
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'ready', 'failed')),
  prompts_executed INTEGER DEFAULT 0,
  summary JSONB DEFAULT '{}',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE citation_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own citation audits"
  ON citation_audits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own citation audits"
  ON citation_audits FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own citation audits"
  ON citation_audits FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS citation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID REFERENCES citation_audits(id) ON DELETE CASCADE,
  prompt_index INTEGER NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_category TEXT DEFAULT 'other',
  platform TEXT NOT NULL,
  brand_mentioned BOOLEAN DEFAULT false,
  competitors_mentioned TEXT[] DEFAULT '{}',
  citation_snippet TEXT,
  platform_response_raw TEXT,
  latency_ms INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE citation_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own citation results"
  ON citation_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM citation_audits
      WHERE citation_audits.id = citation_results.audit_id
      AND citation_audits.user_id = auth.uid()
    )
  );

CREATE POLICY IF NOT EXISTS "Service can insert citation results"
  ON citation_results FOR INSERT
  WITH CHECK (true);
