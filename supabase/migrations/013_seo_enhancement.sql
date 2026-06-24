-- SEO Enhancement: multi-provider scanning, technical audit, keyword research, on-page analysis

ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS seo_scan_data JSONB DEFAULT '{}';
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS keyword_suggestions JSONB DEFAULT '[]';

-- Update default user_features to include 'seo' (already in 010, but ensure)
UPDATE profiles SET user_features = array_append(user_features, 'seo')
WHERE NOT (user_features @> ARRAY['seo']);
