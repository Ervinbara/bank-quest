-- RGPD foundation:
-- 1) explicit consent tracking on advisors
-- 2) strict row-level security policies

ALTER TABLE advisors
  ADD COLUMN IF NOT EXISTS privacy_policy_version TEXT NOT NULL DEFAULT '2026-03-02',
  ADD COLUMN IF NOT EXISTS terms_version TEXT NOT NULL DEFAULT '2026-03-02',
  ADD COLUMN IF NOT EXISTS privacy_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE;

-- Backfill existing advisors with legacy acceptance date to avoid null data holes.
UPDATE advisors
SET
  privacy_accepted_at = COALESCE(privacy_accepted_at, created_at),
  terms_accepted_at = COALESCE(terms_accepted_at, created_at)
WHERE privacy_accepted_at IS NULL
   OR terms_accepted_at IS NULL;

ALTER TABLE advisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_questionnaires ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_questionnaire_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_question_bank_themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_question_bank_questions ENABLE ROW LEVEL SECURITY;

-- Advisors
DROP POLICY IF EXISTS advisors_select_own ON advisors;
CREATE POLICY advisors_select_own
  ON advisors
  FOR SELECT
  TO authenticated
  USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS advisors_insert_own ON advisors;
CREATE POLICY advisors_insert_own
  ON advisors
  FOR INSERT
  TO authenticated
  WITH CHECK (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS advisors_update_own ON advisors;
CREATE POLICY advisors_update_own
  ON advisors
  FOR UPDATE
  TO authenticated
  USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')))
  WITH CHECK (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

DROP POLICY IF EXISTS advisors_delete_own ON advisors;
CREATE POLICY advisors_delete_own
  ON advisors
  FOR DELETE
  TO authenticated
  USING (lower(email) = lower(COALESCE(auth.jwt() ->> 'email', '')));

-- Clients
DROP POLICY IF EXISTS clients_rw_own_advisor ON clients;
CREATE POLICY clients_rw_own_advisor
  ON clients
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = clients.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

-- Public quiz read access by token header (read-only, no direct update).
DROP POLICY IF EXISTS clients_quiz_token_select ON clients;
CREATE POLICY clients_quiz_token_select
  ON clients
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM client_invitations ci
      WHERE ci.client_id = clients.id
        AND ci.token = COALESCE((current_setting('request.headers', true)::jsonb ->> 'x-quiz-token'), '')
        AND ci.revoked_at IS NULL
        AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
    )
  );

-- Client insights
DROP POLICY IF EXISTS client_insights_rw_own_advisor ON client_insights;
CREATE POLICY client_insights_rw_own_advisor
  ON client_insights
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_insights.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_insights.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

-- Invitations
DROP POLICY IF EXISTS invitations_rw_own_advisor ON client_invitations;
CREATE POLICY invitations_rw_own_advisor
  ON client_invitations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_invitations.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM clients c
      JOIN advisors a ON a.id = c.advisor_id
      WHERE c.id = client_invitations.client_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS invitations_quiz_token_select ON client_invitations;
CREATE POLICY invitations_quiz_token_select
  ON client_invitations
  FOR SELECT
  TO anon
  USING (
    token = COALESCE((current_setting('request.headers', true)::jsonb ->> 'x-quiz-token'), '')
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  );

-- Advisor email templates
DROP POLICY IF EXISTS email_templates_rw_own_advisor ON advisor_email_templates;
CREATE POLICY email_templates_rw_own_advisor
  ON advisor_email_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_email_templates.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_email_templates.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

-- Questionnaires
DROP POLICY IF EXISTS questionnaires_rw_own_advisor ON advisor_questionnaires;
CREATE POLICY questionnaires_rw_own_advisor
  ON advisor_questionnaires
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_questionnaires.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_questionnaires.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS questionnaire_questions_rw_own_advisor ON advisor_questionnaire_questions;
CREATE POLICY questionnaire_questions_rw_own_advisor
  ON advisor_questionnaire_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisor_questionnaires q
      JOIN advisors a ON a.id = q.advisor_id
      WHERE q.id = advisor_questionnaire_questions.questionnaire_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisor_questionnaires q
      JOIN advisors a ON a.id = q.advisor_id
      WHERE q.id = advisor_questionnaire_questions.questionnaire_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

-- Question bank
DROP POLICY IF EXISTS question_bank_themes_rw_own_advisor ON advisor_question_bank_themes;
CREATE POLICY question_bank_themes_rw_own_advisor
  ON advisor_question_bank_themes
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_question_bank_themes.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_question_bank_themes.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

DROP POLICY IF EXISTS question_bank_questions_rw_own_advisor ON advisor_question_bank_questions;
CREATE POLICY question_bank_questions_rw_own_advisor
  ON advisor_question_bank_questions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisor_question_bank_themes t
      JOIN advisors a ON a.id = t.advisor_id
      WHERE t.id = advisor_question_bank_questions.theme_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisor_question_bank_themes t
      JOIN advisors a ON a.id = t.advisor_id
      WHERE t.id = advisor_question_bank_questions.theme_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );
