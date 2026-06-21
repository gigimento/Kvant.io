CREATE TABLE IF NOT EXISTS service_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE service_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service config readable by authenticated users only"
  ON service_config FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service config writable by service role only"
  ON service_config FOR ALL
  USING (auth.role() = 'service_role');

INSERT INTO service_config (key, value) VALUES
  ('RESEND_API_KEY', 're_EcRSiDAi_8NfK3egbZmk6qVN9JJGV58x7'),
  ('SUPABASE_SERVICE_KEY', 'sb_secret_W68Ov36jdJMzokIJY42r8Q_rS_i_XwP'),
  ('SUPABASE_MGMT_TOKEN', 'sbp_5a30dd9b8077ef196df471addec569110e2e3bde')
ON CONFLICT (key) DO NOTHING;
