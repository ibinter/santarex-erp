-- Double authentification (TOTP) : colonnes de la table users.
-- À lancer UNE FOIS sur la base de production ET sur la base de démo, AVANT le
-- déploiement du code correspondant. Idempotent (rejouable sans effet).
--   docker exec -i santarex_postgres      psql -U santarex -d santarex_db   < backend/scripts/add-2fa-columns.sql
--   docker exec -i santarex_demo_postgres psql -U santarex -d santarex_demo < backend/scripts/add-2fa-columns.sql
BEGIN;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorEnabled" boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorSecret" text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorRecoveryCodes" text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS "twoFactorLastStep" integer;
COMMIT;

SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'users' AND column_name LIKE 'twoFactor%' ORDER BY column_name;
