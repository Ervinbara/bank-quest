# RLS Audit (Point 1)

## Tables applicatives couvertes

- `advisors`
- `clients`
- `client_insights`
- `client_invitations`
- `advisor_email_templates`
- `advisor_questionnaires`
- `advisor_questionnaire_questions`
- `advisor_question_bank_themes`
- `advisor_question_bank_questions`
- `advisor_consent_events`
- `advisor_audit_logs`
- `advisor_email_usage`
- `client_quiz_sessions`
- `client_invitation_links`
- `client_followup_events`
- `advisor_questionnaire_templates`

## Ce qui a ete durci

- RLS force (`FORCE ROW LEVEL SECURITY`) applique sur toutes les tables applicatives.
- Privileges `anon` reduits au strict necessaire:
  - revoke global sur toutes les tables publiques.
  - grant `SELECT` uniquement sur `clients` et `client_invitations` (flow lien quiz tokenise).
- Policies `anon` re-appliquees pour le quiz token:
  - `clients_quiz_token_select`
  - `invitations_quiz_token_select`

## Requete d'audit table-par-table

Executer: `supabase/sql/rls_audit_report.sql`

Le script retourne:
- etat RLS par table (`enabled`, `forced`, nombre de policies, statut),
- inventaire detaille des policies (`cmd`, `roles`, `using`, `with_check`).

## Smoke tests flux critiques

Script:
- `frontend/scripts/test-critical-flows.mjs`

Commande:
- `npm run test:critical`

Variables d'environnement requises:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `TEST_ADVISOR_EMAIL`
- `TEST_ADVISOR_PASSWORD`

Optionnelles (test isolation RLS):
- `TEST_SECONDARY_ADVISOR_EMAIL`
- `TEST_SECONDARY_ADVISOR_PASSWORD`
