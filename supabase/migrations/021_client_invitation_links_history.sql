-- Keep invitation-link history per client to support multiple questionnaire rounds.

CREATE TABLE IF NOT EXISTS client_invitation_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  invitation_id UUID REFERENCES client_invitations(id) ON DELETE SET NULL,
  questionnaire_id UUID REFERENCES advisor_questionnaires(id) ON DELETE SET NULL,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_invitation_links_client
  ON client_invitation_links(client_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_client_invitation_links_questionnaire
  ON client_invitation_links(questionnaire_id);

ALTER TABLE client_invitation_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS invitation_links_rw_own_advisor ON client_invitation_links;
CREATE POLICY invitation_links_rw_own_advisor
  ON client_invitation_links
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_invitation_links.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_invitation_links.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

-- Backfill current active invitation rows so existing clients have at least one link in history.
INSERT INTO client_invitation_links (client_id, invitation_id, questionnaire_id, token, expires_at, created_at)
SELECT
  ci.client_id,
  ci.id AS invitation_id,
  ci.questionnaire_id,
  ci.token,
  ci.expires_at,
  ci.created_at
FROM client_invitations ci
ON CONFLICT (token) DO NOTHING;
