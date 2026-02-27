ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS followup_status TEXT NOT NULL DEFAULT 'a_contacter'
  CHECK (followup_status IN ('a_contacter', 'rdv_planifie', 'en_cours', 'clos'));

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS advisor_notes TEXT;

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_clients_followup_status ON clients(followup_status);
