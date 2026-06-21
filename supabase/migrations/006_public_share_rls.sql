-- Allow reading reports that have an active share link (for client portal)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'reports' AND policyname = 'Anyone can view reports via share links') THEN
    CREATE POLICY "Anyone can view reports via share links"
      ON reports FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM client_share_links
          WHERE client_share_links.report_id = reports.id
          AND (client_share_links.expires_at IS NULL OR client_share_links.expires_at > now())
        )
      );
  END IF;
END $$;

-- Allow reading brand settings for users who have reports shared via active links
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Anyone can view brand settings via share links') THEN
    CREATE POLICY "Anyone can view brand settings via share links"
      ON profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM client_share_links
          JOIN reports ON reports.id = client_share_links.report_id
          WHERE reports.user_id = profiles.user_id
          AND (client_share_links.expires_at IS NULL OR client_share_links.expires_at > now())
        )
      );
  END IF;
END $$;

-- Allow reading report_configs that have active share links
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'report_configs' AND policyname = 'Anyone can view report configs via share links') THEN
    CREATE POLICY "Anyone can view report configs via share links"
      ON report_configs FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM client_share_links
          WHERE client_share_links.report_id = report_configs.id
          AND (client_share_links.expires_at IS NULL OR client_share_links.expires_at > now())
        )
      );
  END IF;
END $$;
