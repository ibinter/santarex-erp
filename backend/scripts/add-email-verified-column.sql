-- Confirmation d'adresse e-mail : colonne de la table users.
-- À lancer UNE FOIS sur la base de production ET sur la base de démo, AVANT le
-- déploiement du code correspondant. Idempotent (rejouable sans effet).
--   docker exec -i santarex_postgres      psql -U santarex -d santarex_db   < backend/scripts/add-email-verified-column.sql
--   docker exec -i santarex_demo_postgres psql -U santarex -d santarex_demo < backend/scripts/add-email-verified-column.sql
-- Les comptes existants sont considérés comme confirmés (aucun bandeau pour eux) :
-- seules les nouvelles inscriptions devront confirmer leur adresse.
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "emailVerifiedAt" timestamp;
UPDATE users SET "emailVerifiedAt" = now() WHERE "emailVerifiedAt" IS NULL;
COMMIT;

SELECT count(*) AS comptes, count("emailVerifiedAt") AS confirmes FROM users;
