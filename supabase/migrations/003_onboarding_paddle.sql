-- Add onboarding status to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Add Paddle subscription fields to subscriptions table
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS paddle_subscription_id TEXT UNIQUE;
ALTER TABLE subscriptions ALTER COLUMN lemon_squeezy_id DROP NOT NULL;

-- Billing history
CREATE TABLE IF NOT EXISTS billing_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  paddle_transaction_id TEXT UNIQUE,
  product TEXT CHECK (product IN ('reports', 'seo', 'combined')),
  plan TEXT CHECK (plan IN ('monthly', 'yearly')),
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT CHECK (status IN ('completed', 'refunded', 'pending')),
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own billing history"
  ON billing_history FOR SELECT
  USING (auth.uid() = user_id);
