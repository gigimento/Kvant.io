-- Add soft delete columns for traceability
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reports ADD COLUMN IF NOT EXISTS deleted_reason TEXT;

-- RLS policies for reports
CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reports"
  ON reports FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for brand_mentions (were missing - blocked INSERT/UPDATE/DELETE)
CREATE POLICY "Users can insert own mentions"
  ON brand_mentions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM brand_monitors
      WHERE brand_monitors.id = brand_mentions.monitor_id
      AND brand_monitors.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own mentions"
  ON brand_mentions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM brand_monitors
      WHERE brand_monitors.id = brand_mentions.monitor_id
      AND brand_monitors.user_id = auth.uid()
    )
  );
