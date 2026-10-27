-- GeniusPay : nouvelle valeur « geniuspay » pour la liste des passerelles de paiement.
-- À lancer UNE FOIS sur la base de production, AVANT le déploiement du code correspondant
-- (sinon l'enregistrement de la configuration GeniusPay est refusé par la base).
--   docker exec -i santarex_postgres psql -U santarex -d santarex_db < backend/scripts/add-geniuspay-gateway.sql
-- Idempotent : rejouable sans effet. Ne supprime ni ne modifie aucune donnée.
-- Les noms des types sont retrouvés à partir des colonnes, quelle que soit la façon dont la base a été créée.
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN
    SELECT DISTINCT udt_name
      FROM information_schema.columns
     WHERE column_name = 'gateway'
       AND table_name IN ('pay_method_configs', 'pay_webhook_events')
       AND data_type = 'USER-DEFINED'
  LOOP
    EXECUTE format('ALTER TYPE %I ADD VALUE IF NOT EXISTS %L', t, 'geniuspay');
    RAISE NOTICE 'type % : valeur geniuspay présente', t;
  END LOOP;
END $$;

SELECT t.typname AS type_enum, string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) AS valeurs
  FROM pg_type t JOIN pg_enum e ON e.enumtypid = t.oid
 WHERE t.typname LIKE '%gateway_enum'
 GROUP BY t.typname;
