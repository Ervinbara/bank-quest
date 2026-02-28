-- Multi-lang support for advisor question bank and questionnaire questions
ALTER TABLE advisor_question_bank_questions
  ADD COLUMN IF NOT EXISTS concept_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE advisor_question_bank_questions
SET
  concept_translations = jsonb_set(
    COALESCE(concept_translations, '{}'::jsonb),
    '{fr}',
    to_jsonb(concept),
    true
  ),
  prompt_translations = jsonb_set(
    COALESCE(prompt_translations, '{}'::jsonb),
    '{fr}',
    to_jsonb(prompt),
    true
  )
WHERE
  COALESCE(concept, '') <> ''
  OR COALESCE(prompt, '') <> '';

ALTER TABLE advisor_questionnaire_questions
  ADD COLUMN IF NOT EXISTS concept_translations JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS prompt_translations JSONB NOT NULL DEFAULT '{}'::jsonb;

UPDATE advisor_questionnaire_questions
SET
  concept_translations = jsonb_set(
    COALESCE(concept_translations, '{}'::jsonb),
    '{fr}',
    to_jsonb(concept),
    true
  ),
  prompt_translations = jsonb_set(
    COALESCE(prompt_translations, '{}'::jsonb),
    '{fr}',
    to_jsonb(question_text),
    true
  )
WHERE
  COALESCE(concept, '') <> ''
  OR COALESCE(question_text, '') <> '';
