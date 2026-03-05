-- Allow tracking multiple questionnaire submissions per client over time.

CREATE TABLE IF NOT EXISTS client_quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES client_invitations(id) ON DELETE SET NULL,
  questionnaire_id UUID REFERENCES advisor_questionnaires(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  strengths JSONB NOT NULL DEFAULT '[]'::jsonb,
  weaknesses JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_quiz_sessions_client_completed
  ON client_quiz_sessions(client_id, completed_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_quiz_sessions_questionnaire
  ON client_quiz_sessions(questionnaire_id);

ALTER TABLE client_quiz_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_quiz_sessions_rw_own_advisor ON client_quiz_sessions;
CREATE POLICY client_quiz_sessions_rw_own_advisor
  ON client_quiz_sessions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_quiz_sessions.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_quiz_sessions.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );
