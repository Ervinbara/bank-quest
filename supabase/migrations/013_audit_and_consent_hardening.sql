-- Audit + consent hardening baseline

ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS analytics_cookies_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analytics_cookies_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_in_updated_at TIMESTAMPTZ;

UPDATE advisors
SET marketing_opt_in_updated_at = COALESCE(marketing_opt_in_updated_at, created_at)
WHERE marketing_opt_in_updated_at IS NULL;

CREATE TABLE IF NOT EXISTS advisor_consent_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL CHECK (consent_type IN ('terms', 'privacy', 'marketing', 'cookies_analytics')),
  status BOOLEAN NOT NULL,
  legal_version TEXT,
  source TEXT NOT NULL DEFAULT 'app',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisor_consent_events_advisor_created_at
  ON advisor_consent_events(advisor_id, created_at DESC);

CREATE TABLE IF NOT EXISTS advisor_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error')),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advisor_audit_logs_advisor_created_at
  ON advisor_audit_logs(advisor_id, created_at DESC);

ALTER TABLE advisor_consent_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS consent_events_rw_own_advisor ON advisor_consent_events;
CREATE POLICY consent_events_rw_own_advisor
  ON advisor_consent_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_consent_events.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_consent_events.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS audit_logs_rw_own_advisor ON advisor_audit_logs;
CREATE POLICY audit_logs_rw_own_advisor
  ON advisor_audit_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_audit_logs.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_audit_logs.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE OR REPLACE FUNCTION public.log_advisor_event(
  p_action TEXT,
  p_category TEXT DEFAULT 'general',
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_severity TEXT DEFAULT 'info'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_advisor_id UUID;
BEGIN
  v_email := lower(COALESCE(auth.jwt() ->> 'email', ''));
  IF v_email = '' THEN
    RETURN;
  END IF;

  SELECT id
  INTO v_advisor_id
  FROM advisors
  WHERE lower(email) = v_email
  LIMIT 1;

  IF v_advisor_id IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO advisor_audit_logs(advisor_id, action, category, severity, metadata)
  VALUES (
    v_advisor_id,
    COALESCE(NULLIF(p_action, ''), 'unknown_action'),
    COALESCE(NULLIF(p_category, ''), 'general'),
    CASE
      WHEN p_severity IN ('info', 'warning', 'error') THEN p_severity
      ELSE 'info'
    END,
    COALESCE(p_metadata, '{}'::jsonb)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.log_advisor_event(TEXT, TEXT, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_advisor_event(TEXT, TEXT, JSONB, TEXT) TO authenticated;
