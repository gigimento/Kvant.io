ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS serp_analysis JSONB DEFAULT '{}';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS content_gap JSONB DEFAULT '[]';
ALTER TABLE content_briefs ADD COLUMN IF NOT EXISTS keyword_data JSONB DEFAULT '{}';
