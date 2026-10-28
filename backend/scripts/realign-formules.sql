-- Recalage des formules sur la page de vente (généré depuis src/licences/formules.ts)
-- Idempotent. Ne touche pas aux licences personnalisées à la main (liste différente de l'offre).
BEGIN;

-- pharmacie : 6 modules
UPDATE licences l SET "modulesActivesJson" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements"]$j$
 WHERE l."offreCode" = 'pharmacie'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = 'pharmacie')
   AND l."modulesActivesJson" <> $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements"]$j$;
UPDATE offres_saas SET "modulesInclus" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements"]$j$, "updatedAt" = now() WHERE code = 'pharmacie';

-- cabinet : 13 modules
UPDATE licences l SET "modulesActivesJson" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants"]$j$
 WHERE l."offreCode" = 'cabinet'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = 'cabinet')
   AND l."modulesActivesJson" <> $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants"]$j$;
UPDATE offres_saas SET "modulesInclus" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants"]$j$, "updatedAt" = now() WHERE code = 'cabinet';

-- centre : 17 modules
UPDATE licences l SET "modulesActivesJson" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements"]$j$
 WHERE l."offreCode" = 'centre'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = 'centre')
   AND l."modulesActivesJson" <> $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements"]$j$;
UPDATE offres_saas SET "modulesInclus" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements"]$j$, "updatedAt" = now() WHERE code = 'centre';

-- clinique : 27 modules
UPDATE licences l SET "modulesActivesJson" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting"]$j$
 WHERE l."offreCode" = 'clinique'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = 'clinique')
   AND l."modulesActivesJson" <> $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting"]$j$;
UPDATE offres_saas SET "modulesInclus" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting"]$j$, "updatedAt" = now() WHERE code = 'clinique';

-- hopital : 44 modules
UPDATE licences l SET "modulesActivesJson" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting","bloc-operatoire","had","imagerie","banque-sang","sterilisation","equipements","dechets-medicaux","budget","incidents-qualite","indicateurs-qualite","declarations-sanitaires","transport","morgue","rh","sites","comptabilite","services-personnalises"]$j$
 WHERE l."offreCode" = 'hopital'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = 'hopital')
   AND l."modulesActivesJson" <> $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting","bloc-operatoire","had","imagerie","banque-sang","sterilisation","equipements","dechets-medicaux","budget","incidents-qualite","indicateurs-qualite","declarations-sanitaires","transport","morgue","rh","sites","comptabilite","services-personnalises"]$j$;
UPDATE offres_saas SET "modulesInclus" = $j$["patients","pharmacie","approvisionnement","facturation","caisse-sessions","paiements","consultations","dme","rendez-vous","laboratoire","vaccination","devis","messages-sortants","soins-infirmiers","maternite","pediatrie","consentements","hospitalisation","urgences","interactions-medicamenteuses","prise-en-charge","tiers-payant","satisfaction","plannings-gardes","messagerie","portail-patient","reporting","bloc-operatoire","had","imagerie","banque-sang","sterilisation","equipements","dechets-medicaux","budget","incidents-qualite","indicateurs-qualite","declarations-sanitaires","transport","morgue","rh","sites","comptabilite","services-personnalises"]$j$, "updatedAt" = now() WHERE code = 'hopital';

UPDATE offres_saas SET description = 'Centre de santé : consultations, laboratoire, pharmacie, soins infirmiers, maternité et pédiatrie.',
  fonctionnalites = '["Consultations, DME & laboratoire","Pharmacie de dispensation","Soins infirmiers, maternité & pédiatrie"]', "updatedAt" = now() WHERE code = 'centre';
UPDATE offres_saas SET description = 'Clinique : hospitalisation, urgences, maternité, pédiatrie et assureurs.',
  fonctionnalites = '["Hospitalisation, urgences & plan des lits","Maternité, pédiatrie & soins infirmiers","Tiers-payant, prise en charge & gardes"]', "updatedAt" = now() WHERE code = 'clinique';
UPDATE offres_saas SET description = 'Établissement hospitalier complet : tous les modules inclus.',
  fonctionnalites = '["Bloc opératoire, imagerie & banque de sang","RH, comptabilité & multi-sites","Qualité, morgue, transport & déchets DASRI"]', "updatedAt" = now() WHERE code = 'hopital';

COMMIT;

-- Contrôle : nombre de modules par formule
SELECT code, json_array_length("modulesInclus"::json) AS modules FROM offres_saas WHERE code IN ('pharmacie','cabinet','centre','clinique','hopital') ORDER BY ordre;
