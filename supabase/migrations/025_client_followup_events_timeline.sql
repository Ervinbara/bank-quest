CREATE TABLE IF NOT EXISTS client_followup_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'followup_saved',
  followup_status TEXT,
  advisor_notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

CREATE INDEX IF NOT EXISTS idx_client_followup_events_client_created
  ON client_followup_events(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_followup_events_advisor
  ON client_followup_events(advisor_id, created_at DESC);

ALTER TABLE client_followup_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_followup_events_rw_own_advisor ON client_followup_events;
CREATE POLICY client_followup_events_rw_own_advisor
  ON client_followup_events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = client_followup_events.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = client_followup_events.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );
