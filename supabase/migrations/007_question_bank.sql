-- Banque de questions personnalisable par conseiller
CREATE TABLE advisor_question_bank_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(advisor_id, code),
  UNIQUE(advisor_id, name)
);

CREATE INDEX idx_question_bank_themes_advisor_id
  ON advisor_question_bank_themes(advisor_id);

CREATE TABLE advisor_question_bank_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theme_id UUID NOT NULL REFERENCES advisor_question_bank_themes(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  prompt TEXT NOT NULL,
  options JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_question_bank_questions_theme_id
  ON advisor_question_bank_questions(theme_id);

CREATE TRIGGER update_advisor_question_bank_themes_updated_at
  BEFORE UPDATE ON advisor_question_bank_themes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_advisor_question_bank_questions_updated_at
  BEFORE UPDATE ON advisor_question_bank_questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
