-- Store per-question responses for each completed quiz session.

ALTER TABLE client_quiz_sessions
  ADD COLUMN IF NOT EXISTS question_answers JSONB NOT NULL DEFAULT '[]'::jsonb;
