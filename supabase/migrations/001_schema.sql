-- PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  company_name TEXT,
  role TEXT CHECK (role IN ('agency', 'freelancer', 'business')),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- DATA CONNECTIONS (Narrative Reporting)
CREATE TABLE IF NOT EXISTS data_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT CHECK (provider IN ('ga4', 'google_ads', 'meta_ads')),
  access_token TEXT,
  refresh_token TEXT,
  provider_account_id TEXT,
  provider_account_name TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE data_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own connections"
  ON data_connections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own connections"
  ON data_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own connections"
  ON data_connections FOR DELETE
  USING (auth.uid() = user_id);

-- REPORT CONFIGS
CREATE TABLE IF NOT EXISTS report_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  data_sources JSONB NOT NULL DEFAULT '[]',
  schedule TEXT CHECK (schedule IN ('weekly', 'monthly')),
  next_run_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE report_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report configs"
  ON report_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report configs"
  ON report_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own report configs"
  ON report_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own report configs"
  ON report_configs FOR DELETE
  USING (auth.uid() = user_id);

-- GENERATED REPORTS
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID REFERENCES report_configs(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  period_start DATE,
  period_end DATE,
  raw_data JSONB,
  narrative_text TEXT,
  pdf_url TEXT,
  status TEXT CHECK (status IN ('pending', 'generating', 'ready', 'failed')) DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- BRAND MONITORS (LLM SEO Radar)
CREATE TABLE IF NOT EXISTS brand_monitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  competitors JSONB DEFAULT '[]',
  keywords JSONB DEFAULT '[]',
  schedule TEXT CHECK (schedule IN ('daily', 'weekly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_monitors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own monitors"
  ON brand_monitors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own monitors"
  ON brand_monitors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own monitors"
  ON brand_monitors FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own monitors"
  ON brand_monitors FOR DELETE
  USING (auth.uid() = user_id);

-- BRAND MENTIONS
CREATE TABLE IF NOT EXISTS brand_mentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  monitor_id UUID REFERENCES brand_monitors(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  llm_provider TEXT DEFAULT 'groq',
  brand_mentioned BOOLEAN DEFAULT false,
  sentiment TEXT CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
  share_of_voice DECIMAL(5,2),
  context_snippet TEXT,
  raw_response TEXT,
  scanned_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brand_mentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mentions"
  ON brand_mentions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM brand_monitors
      WHERE brand_monitors.id = brand_mentions.monitor_id
      AND brand_monitors.user_id = auth.uid()
    )
  );

-- SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product TEXT CHECK (product IN ('reports', 'seo')),
  lemon_squeezy_id TEXT UNIQUE,
  status TEXT CHECK (status IN ('active', 'cancelled', 'past_due', 'expired')),
  plan TEXT CHECK (plan IN ('monthly', 'yearly')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);
