ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS website_url TEXT;
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS seo_scan_data JSONB DEFAULT '{}';
ALTER TABLE brand_monitors ADD COLUMN IF NOT EXISTS keyword_suggestions JSONB DEFAULT '[]';
