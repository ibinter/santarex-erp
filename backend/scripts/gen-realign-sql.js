// Génère scripts/realign-formules.sql à partir de src/licences/formules.ts
// Usage : node scripts/gen-realign-sql.js   (depuis backend/)
const fs = require('fs');
const ts = require('typescript');
const src = fs.readFileSync(require('path').join(__dirname, '../src/licences/formules.ts'), 'utf8');
const js = ts.transpileModule(src, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const mod = { exports: {} };
new Function('exports', 'module', js)(mod.exports, mod);
const { FORMULES } = mod.exports;
let sql = `-- Recalage des formules sur la page de vente (généré depuis src/licences/formules.ts)
-- Idempotent. Ne touche pas aux licences personnalisées à la main (liste différente de l'offre).
BEGIN;
`;
for (const [code, mods] of Object.entries(FORMULES)) {
  const json = JSON.stringify(mods);
  sql += `
-- ${code} : ${mods.length} modules
UPDATE licences l SET "modulesActivesJson" = $j$${json}$j$
 WHERE l."offreCode" = '${code}'
   AND l."modulesActivesJson" = (SELECT o."modulesInclus" FROM offres_saas o WHERE o.code = '${code}')
   AND l."modulesActivesJson" <> $j$${json}$j$;
UPDATE offres_saas SET "modulesInclus" = $j$${json}$j$, "updatedAt" = now() WHERE code = '${code}';
`;
}
sql += `
UPDATE offres_saas SET description = 'Centre de santé : consultations, laboratoire, pharmacie, soins infirmiers, maternité et pédiatrie.',
  fonctionnalites = '["Consultations, DME & laboratoire","Pharmacie de dispensation","Soins infirmiers, maternité & pédiatrie"]', "updatedAt" = now() WHERE code = 'centre';
UPDATE offres_saas SET description = 'Clinique : hospitalisation, urgences, maternité, pédiatrie et assureurs.',
  fonctionnalites = '["Hospitalisation, urgences & plan des lits","Maternité, pédiatrie & soins infirmiers","Tiers-payant, prise en charge & gardes"]', "updatedAt" = now() WHERE code = 'clinique';
UPDATE offres_saas SET description = 'Établissement hospitalier complet : tous les modules inclus.',
  fonctionnalites = '["Bloc opératoire, imagerie & banque de sang","RH, comptabilité & multi-sites","Qualité, morgue, transport & déchets DASRI"]', "updatedAt" = now() WHERE code = 'hopital';

COMMIT;

-- Contrôle : nombre de modules par formule
SELECT code, json_array_length("modulesInclus"::json) AS modules FROM offres_saas WHERE code IN ('pharmacie','cabinet','centre','clinique','hopital') ORDER BY ordre;
`;
fs.writeFileSync(require('path').join(__dirname, 'realign-formules.sql'), sql);
console.log(Object.entries(FORMULES).map(([c, m]) => c + '=' + m.length).join(' '));
