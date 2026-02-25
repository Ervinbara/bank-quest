-- Insérer des données de démo pour tester
INSERT INTO advisors (email, name, company, phone, plan) VALUES
  ('demo@bankquest.fr', 'Compte Démo', 'Bank Quest Demo', '06 00 00 00 00', 'pro'),
  ('jean.dupont@cgp.fr', 'Jean Dupont', 'CGP Patrimoine', '06 12 34 56 78', 'pro');

-- Insérer des clients de démo
INSERT INTO clients (advisor_id, name, email, avatar, quiz_status, score, completed_at) 
SELECT 
  id,
  'Marie Dubois',
  'marie.dubois@email.fr',
  '👩',
  'completed',
  75,
  NOW() - INTERVAL '5 days'
FROM advisors WHERE email = 'demo@bankquest.fr';

INSERT INTO clients (advisor_id, name, email, avatar, quiz_status, score, completed_at) 
SELECT 
  id,
  'Pierre Martin',
  'pierre.martin@email.fr',
  '👨',
  'completed',
  45,
  NOW() - INTERVAL '3 days'
FROM advisors WHERE email = 'demo@bankquest.fr';

INSERT INTO clients (advisor_id, name, email, avatar, quiz_status, score) 
SELECT 
  id,
  'Sophie Laurent',
  'sophie.laurent@email.fr',
  '👩',
  'pending',
  NULL
FROM advisors WHERE email = 'demo@bankquest.fr';

-- Insérer les insights
INSERT INTO client_insights (client_id, type, concept)
SELECT 
  c.id,
  'weakness',
  unnest(ARRAY['Crédit immobilier', 'Fiscalité'])
FROM clients c WHERE c.email = 'marie.dubois@email.fr';

INSERT INTO client_insights (client_id, type, concept)
SELECT 
  c.id,
  'strength',
  unnest(ARRAY['Budget', 'Épargne'])
FROM clients c WHERE c.email = 'marie.dubois@email.fr';

INSERT INTO client_insights (client_id, type, concept)
SELECT 
  c.id,
  'weakness',
  unnest(ARRAY['Investissement', 'Retraite', 'Patrimoine'])
FROM clients c WHERE c.email = 'pierre.martin@email.fr';