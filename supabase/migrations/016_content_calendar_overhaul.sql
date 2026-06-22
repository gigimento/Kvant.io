-- 016: Content Calendar Overhaul — new columns and tables

-- Extend content_calendar
ALTER TABLE content_calendar
  ADD COLUMN IF NOT EXISTS platform TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS content_type TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_time TIME,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS ai_generated BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_caption TEXT,
  ADD COLUMN IF NOT EXISTS evergreen_config JSONB;

-- Update status CHECK constraint
ALTER TABLE content_calendar DROP CONSTRAINT IF EXISTS content_calendar_status_check;
ALTER TABLE content_calendar ADD CONSTRAINT content_calendar_status_check
  CHECK (status IN ('draft', 'review', 'approved', 'scheduled', 'published'));

-- New indexes
CREATE INDEX IF NOT EXISTS idx_calendar_status ON content_calendar(user_id, status);
CREATE INDEX IF NOT EXISTS idx_calendar_assigned ON content_calendar(user_id, assigned_to);

-- Comments table
CREATE TABLE IF NOT EXISTS calendar_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES content_calendar(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE calendar_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read comments on their entries"
  ON calendar_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM content_calendar
      WHERE content_calendar.id = calendar_comments.entry_id
      AND content_calendar.assigned_to = auth.uid()
    )
  );

CREATE POLICY "Users can insert own comments"
  ON calendar_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON calendar_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_calendar_comments_entry ON calendar_comments(entry_id);
