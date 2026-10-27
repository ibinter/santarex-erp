/**
 * Référence UNIQUE du contenu de chaque formule (cumulatives : Pharmacie ⊂ Cabinet
 * ⊂ Centre ⊂ Clinique ⊂ Hôpital). Alignée sur la page de vente (étiquettes
 * CORE / CABINET+ / CLINIQUE+ / HÔPITAL+) et la grille tarifaire.
 *
 * Les codes sont ceux de `PREFIX_TO_MODULE` (common/guards/module.guard.ts).
 */
export const PHARMACIE = [
  'patients',
  'pharmacie',
  'approvisionnement',
  'facturation',
  'caisse-sessions',
  'paiements',
];

// CABINET+ : consultations, DME, rendez-vous, laboratoire, vaccination, devis, SMS.
export const CABINET = [
  ...PHARMACIE,
  'consultations',
  'dme',
  'rendez-vous',
  'laboratoire',
  'vaccination',
  'devis',
  'messages-sortants',
];

// Centre de santé : Cabinet + soins infirmiers (15 utilisateurs).
export const CENTRE = [...CABINET, 'soins-infirmiers'];

// CLINIQUE+ : hospitalisation, urgences, maternité, pédiatrie, assureurs, qualité perçue…
export const CLINIQUE = [
  ...CENTRE,
  'hospitalisation',
  'urgences',
  'maternite',
  'pediatrie',
  'consentements',
  'interactions-medicamenteuses',
  'prise-en-charge',
  'tiers-payant',
  'satisfaction',
  'plannings-gardes',
  // Transverses CLINIQUE+ (page de vente) : messagerie interne, portail patient, reporting & BI.
  'messagerie',
  'portail-patient',
  'reporting',
];

// HÔPITAL+ : bloc, imagerie, banque de sang, stérilisation, RH, multi-sites, etc.
export const HOPITAL = [
  ...CLINIQUE,
  'bloc-operatoire',
  'had',
  'imagerie',
  'banque-sang',
  'sterilisation',
  'equipements',
  'dechets-medicaux',
  'budget',
  'incidents-qualite',
  'indicateurs-qualite',
  'declarations-sanitaires',
  'transport',
  'morgue',
  'rh',
  'sites',
  'comptabilite',
  'services-personnalises',
];

export const FORMULES: Record<string, string[]> = {
  pharmacie: PHARMACIE,
  cabinet: CABINET,
  centre: CENTRE,
  clinique: CLINIQUE,
  hopital: HOPITAL,
};
