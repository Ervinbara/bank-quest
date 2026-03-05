CREATE TABLE IF NOT EXISTS advisor_questionnaire_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advisor_id UUID NOT NULL REFERENCES advisors(id) ON DELETE CASCADE,
  template_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  questions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (advisor_id, template_key)
);

CREATE INDEX IF NOT EXISTS idx_advisor_questionnaire_templates_advisor
  ON advisor_questionnaire_templates (advisor_id);

ALTER TABLE advisor_questionnaire_templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS questionnaire_templates_rw_own_advisor ON advisor_questionnaire_templates;
CREATE POLICY questionnaire_templates_rw_own_advisor
  ON advisor_questionnaire_templates
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_questionnaire_templates.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM advisors a
      WHERE a.id = advisor_questionnaire_templates.advisor_id
        AND lower(a.email) = lower(COALESCE(auth.jwt() ->> 'email', ''))
    )
  );

DROP TRIGGER IF EXISTS update_advisor_questionnaire_templates_updated_at ON advisor_questionnaire_templates;
CREATE TRIGGER update_advisor_questionnaire_templates_updated_at
  BEFORE UPDATE ON advisor_questionnaire_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
