-- Add user_features column for per-feature subscription gating
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_features TEXT[] DEFAULT ARRAY['reports','seo','competitive','content-briefs','content-calendar','invoices','proposals','branding']::TEXT[];
