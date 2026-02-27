-- Questionnaires personnalisables par conseiller
CREATE TABLE advisor_questionnaires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_advisor_questionnaires_advisor_id ON advisor_questionnaires(advisor_id);
CREATE UNIQUE INDEX uq_advisor_default_questionnaire
  ON advisor_questionnaires(advisor_id)
  WHERE is_default = TRUE;

CREATE TABLE advisor_questionnaire_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  questionnaire_id UUID NOT NULL REFERENCES advisor_questionnaires(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  concept TEXT NOT NULL,
  theme TEXT NOT NULL DEFAULT 'general',
  order_index INTEGER NOT NULL DEFAULT 0,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questionnaire_questions_questionnaire_id
  ON advisor_questionnaire_questions(questionnaire_id);

CREATE TRIGGER update_advisor_questionnaires_updated_at
  BEFORE UPDATE ON advisor_questionnaires
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Questionnaire associe a une invitation
ALTER TABLE client_invitations
  ADD COLUMN questionnaire_id UUID REFERENCES advisor_questionnaires(id) ON DELETE SET NULL;

CREATE INDEX idx_client_invitations_questionnaire_id
  ON client_invitations(questionnaire_id);
