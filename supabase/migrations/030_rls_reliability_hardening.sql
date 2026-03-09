-- Point 1 hardening: RLS reliability + least-privilege grants
-- Scope: keep anon access strictly limited to invitation quiz flow.

-- 1) Enforce RLS on every application table.
ALTER TABLE IF EXISTS public.advisors FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.clients FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_insights FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_invitations FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_email_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_questionnaires FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_questionnaire_questions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_question_bank_themes FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_question_bank_questions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_consent_events FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_audit_logs FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_email_usage FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_quiz_sessions FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_invitation_links FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.client_followup_events FORCE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.advisor_questionnaire_templates FORCE ROW LEVEL SECURITY;

-- 2) Least privilege for anon: revoke all table grants, then allow only required reads.
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON TABLE public.clients TO anon;
GRANT SELECT ON TABLE public.client_invitations TO anon;

-- 3) Re-assert anon invitation policies used by quiz token flow.
DROP POLICY IF EXISTS clients_quiz_token_select ON public.clients;
CREATE POLICY clients_quiz_token_select
  ON public.clients
  FOR SELECT
  TO anon
  USING (
    EXISTS (
      SELECT 1
      FROM public.client_invitations ci
      WHERE ci.client_id = clients.id
        AND ci.token = COALESCE((current_setting('request.headers', true)::jsonb ->> 'x-quiz-token'), '')
        AND ci.revoked_at IS NULL
        AND (ci.expires_at IS NULL OR ci.expires_at > NOW())
    )
  );

DROP POLICY IF EXISTS invitations_quiz_token_select ON public.client_invitations;
CREATE POLICY invitations_quiz_token_select
  ON public.client_invitations
  FOR SELECT
  TO anon
  USING (
    token = COALESCE((current_setting('request.headers', true)::jsonb ->> 'x-quiz-token'), '')
    AND revoked_at IS NULL
    AND (expires_at IS NULL OR expires_at > NOW())
  );
