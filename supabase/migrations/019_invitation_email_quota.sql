-- Track invitation-email usage per advisor and month

CREATE TABLE IF NOT EXISTS advisor_email_usage (
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  usage_month DATE NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0 CHECK (emails_sent >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (advisor_id, usage_month)
);

CREATE INDEX IF NOT EXISTS idx_advisor_email_usage_advisor
  ON advisor_email_usage(advisor_id);

CREATE INDEX IF NOT EXISTS idx_advisor_email_usage_month
  ON advisor_email_usage(usage_month);

DROP TRIGGER IF EXISTS update_advisor_email_usage_updated_at ON advisor_email_usage;
CREATE TRIGGER update_advisor_email_usage_updated_at
  BEFORE UPDATE ON advisor_email_usage
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE advisor_email_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS advisor_email_usage_select_own ON advisor_email_usage;
CREATE POLICY advisor_email_usage_select_own
  ON advisor_email_usage
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_email_usage.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

CREATE OR REPLACE FUNCTION public.increment_advisor_email_usage(
  p_advisor_id UUID,
  p_usage_month DATE,
  p_delta INTEGER DEFAULT 1
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_total INTEGER;
BEGIN
  IF p_advisor_id IS NULL OR p_usage_month IS NULL THEN
    RAISE EXCEPTION 'advisor_id and usage_month are required';
  END IF;

  IF p_delta IS NULL OR p_delta <= 0 THEN
    RAISE EXCEPTION 'delta must be a positive integer';
  END IF;

  INSERT INTO advisor_email_usage (advisor_id, usage_month, emails_sent)
  VALUES (p_advisor_id, p_usage_month, p_delta)
  ON CONFLICT (advisor_id, usage_month)
  DO UPDATE
    SET emails_sent = advisor_email_usage.emails_sent + EXCLUDED.emails_sent,
        updated_at = NOW()
  RETURNING emails_sent INTO v_new_total;

  RETURN v_new_total;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_advisor_email_usage(UUID, DATE, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_advisor_email_usage(UUID, DATE, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_advisor_email_usage(UUID, DATE, INTEGER) TO service_role;

