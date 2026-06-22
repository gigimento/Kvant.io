-- Remove dangerous SELECT policy that let any authenticated user read secrets
DROP POLICY IF EXISTS "Service config readable by authenticated users only" ON service_config;
DROP POLICY IF EXISTS "Service config all by service role" ON service_config;

-- Only service_role can read/write service_config
CREATE POLICY "svc_config_select" ON service_config FOR SELECT
  USING (auth.role() = 'service_role');

CREATE POLICY "svc_config_all" ON service_config FOR ALL
  USING (auth.role() = 'service_role');
