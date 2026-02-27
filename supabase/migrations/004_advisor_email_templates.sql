CREATE TABLE advisor_email_templates (
  advisor_id UUID PRIMARY KEY REFERENCES advisors(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_advisor_email_templates_updated_at
  BEFORE UPDATE ON advisor_email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
