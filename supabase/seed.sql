-- ============================================
-- Seed Data - CRM Pharmacie
-- ============================================
-- Note : Le superadmin (andersonassa09@gmail.com) sera créé automatiquement
-- via le trigger handle_new_user() lors de sa première connexion Google OAuth.
-- Ce fichier sert pour des données de test optionnelles.

-- Exemple de patients de test (optionnel, décommenter si besoin)
/*
INSERT INTO public.patients (phone, name, segment_ia, motif_last_visit, score_fidelite, pharmacy_id)
VALUES
  ('+33612345678', 'Ahmed Benali', 'Chronique', 'Renouvellement traitement diabète', 85, NULL),
  ('+33623456789', 'Marie Dupont', 'Suivi régulier', 'Contrôle tension', 70, NULL),
  ('+33634567890', 'Fatima Zahra', 'Risque', 'Poly-médication', 40, NULL),
  ('+33645678901', 'Jean Martin', 'Occasionnel', 'Rhume saisonnier', 20, NULL),
  ('+33656789012', 'Sophie Bernard', 'Chronique', 'Traitement asthme', 90, NULL)
ON CONFLICT (phone) DO NOTHING;
*/
