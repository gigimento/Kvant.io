ALTER TABLE reports
ADD COLUMN IF NOT EXISTS narrative_prompt TEXT;
