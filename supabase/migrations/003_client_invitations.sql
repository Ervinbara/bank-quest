-- Table des invitations client (liens partageables)
CREATE TABLE client_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_client_invitations_client_id ON client_invitations(client_id);
CREATE INDEX idx_client_invitations_token ON client_invitations(token);

CREATE TRIGGER update_client_invitations_updated_at
  BEFORE UPDATE ON client_invitations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
