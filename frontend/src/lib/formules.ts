/**
 * Contenu des formules commerciales, côté page de vente.
 *
 * COPIE de backend/src/licences/formules.ts (source de vérité). Un test du
 * backend (licences/tests/formules-front.spec.ts) échoue si les deux fichiers
 * divergent : on ne peut donc pas vendre autre chose que ce que le serveur livre.
 */
const PHARMACIE = [
  'patients',
  'pharmacie',
  'approvisionnement',
  'facturation',
  'caisse-sessions',
  'paiements',
];

const CABINET = [
  ...PHARMACIE,
  'consultations',
  'dme',
  'rendez-vous',
  'laboratoire',
  'vaccination',
  'devis',
  'messages-sortants',
];

const CENTRE = [...CABINET, 'soins-infirmiers'];

const CLINIQUE = [
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
  'messagerie',
  'portail-patient',
  'reporting',
];

const HOPITAL = [
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

export type FormuleCode = 'pharmacie' | 'cabinet' | 'centre' | 'clinique' | 'hopital';

export const FORMULE_ORDRE: FormuleCode[] = ['pharmacie', 'cabinet', 'centre', 'clinique', 'hopital'];

export const FORMULES_MODULES: Record<FormuleCode, string[]> = {
  pharmacie: PHARMACIE,
  cabinet: CABINET,
  centre: CENTRE,
  clinique: CLINIQUE,
  hopital: HOPITAL,
};

export const FORMULE_INFO: Record<
  FormuleCode,
  { label: { fr: string; en: string }; prix: string; cible: { fr: string; en: string }; tag: string }
> = {
  pharmacie: { label: { fr: 'Pharmacie', en: 'Pharmacy' }, prix: '12 000', tag: 'PHARMACIE', cible: { fr: 'Officine, dépôt pharmaceutique', en: 'Pharmacy, drug store' } },
  cabinet: { label: { fr: 'Cabinet', en: 'Practice' }, prix: '18 000', tag: 'CABINET+', cible: { fr: 'Cabinet médical, médecin libéral', en: 'Medical practice, private doctor' } },
  centre: { label: { fr: 'Centre de santé', en: 'Health center' }, prix: '35 000', tag: 'CENTRE+', cible: { fr: 'Centre de santé, dispensaire, CSI', en: 'Health center, dispensary' } },
  clinique: { label: { fr: 'Clinique', en: 'Clinic' }, prix: '75 000', tag: 'CLINIQUE+', cible: { fr: 'Clinique, polyclinique', en: 'Clinic, polyclinic' } },
  hopital: { label: { fr: 'Hôpital', en: 'Hospital' }, prix: '150 000', tag: 'HÔPITAL+', cible: { fr: 'Hôpital, groupe de cliniques', en: 'Hospital, clinic group' } },
};

/** Titre français du module (page de vente) → code de module du serveur. */
export const MODULE_CODE_PAR_TITRE: Record<string, string> = {
  'Patients & DME': 'dme',
  'Consultations': 'consultations',
  'Rendez-vous': 'rendez-vous',
  'Hospitalisation': 'hospitalisation',
  'Urgences & triage': 'urgences',
  'Bloc opératoire': 'bloc-operatoire',
  'Maternité & accouchements': 'maternite',
  'Pédiatrie': 'pediatrie',
  'Vaccination': 'vaccination',
  'Soins infirmiers': 'soins-infirmiers',
  'Consentements éclairés': 'consentements',
  'Interactions médicamenteuses': 'interactions-medicamenteuses',
  'Hospitalisation à domicile': 'had',
  'Pharmacie': 'pharmacie',
  'Laboratoire': 'laboratoire',
  'Imagerie médicale': 'imagerie',
  'Approvisionnement & achats': 'approvisionnement',
  'Banque de sang': 'banque-sang',
  'Stérilisation': 'sterilisation',
  'Équipements biomédicaux': 'equipements',
  'Déchets DASRI': 'dechets-medicaux',
  'Facturation': 'facturation',
  'Devis': 'devis',
  'Caisse & reçus': 'caisse-sessions',
  'Prise en charge assureurs': 'prise-en-charge',
  'Tiers-payant': 'tiers-payant',
  'Budget': 'budget',
  'Portail patient': 'portail-patient',
  'SMS & rappels': 'messages-sortants',
  'Messagerie interne': 'messagerie',
  'Satisfaction patient': 'satisfaction',
  'Gardes & astreintes': 'plannings-gardes',
  'Incidents qualité': 'incidents-qualite',
  'Indicateurs qualité': 'indicateurs-qualite',
  'Déclarations sanitaires': 'declarations-sanitaires',
  'Transport & ambulances': 'transport',
  'Morgue': 'morgue',
  'Ressources humaines': 'rh',
  'Reporting & BI': 'reporting',
  'Multi-sites': 'sites',
};

/** Première formule qui contient ce module (null si inconnu). */
export function formuleMinimale(codeModule: string): FormuleCode | null {
  return FORMULE_ORDRE.find((f) => FORMULES_MODULES[f].includes(codeModule)) ?? null;
}

/** Étiquette de niveau affichée sur la carte d'un module (ex. « CLINIQUE+ »). */
export function tagPourModule(titreFr: string): string | null {
  const code = MODULE_CODE_PAR_TITRE[titreFr];
  const f = code ? formuleMinimale(code) : null;
  return f ? FORMULE_INFO[f].tag : null;
}

/** Modules AJOUTÉS par une formule par rapport à la précédente. */
export function modulesAjoutes(f: FormuleCode): string[] {
  const i = FORMULE_ORDRE.indexOf(f);
  const avant = i > 0 ? FORMULES_MODULES[FORMULE_ORDRE[i - 1]] : [];
  return FORMULES_MODULES[f].filter((m) => !avant.includes(m));
}
