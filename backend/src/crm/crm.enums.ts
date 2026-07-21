// ════════════════════════════════════════════════════════════════════════════
//  CRM ÉDITEUR IBIG SOFT — énumérations (prospects & démonstrations).
//  Ce CRM est scopé par le superadmin (éditeur), PAS multi-tenant client.
//  Tables préfixées `crm_`.
// ════════════════════════════════════════════════════════════════════════════

/** Étapes du pipeline commercial d'un prospect. */
export enum ProspectStatut {
  NOUVEAU = 'nouveau',
  A_CONTACTER = 'a_contacter',
  CONTACTE = 'contacte',
  QUALIFIE = 'qualifie',
  DEMO_PREVUE = 'demo_prevue',
  DEMO_REALISEE = 'demo_realisee',
  OFFRE_ENVOYEE = 'offre_envoyee',
  NEGOCIATION = 'negociation',
  GAGNE = 'gagne',
  PERDU = 'perdu',
}

/** Ordre canonique du funnel (pour l'affichage & les stats). */
export const PROSPECT_STATUT_ORDRE: ProspectStatut[] = [
  ProspectStatut.NOUVEAU,
  ProspectStatut.A_CONTACTER,
  ProspectStatut.CONTACTE,
  ProspectStatut.QUALIFIE,
  ProspectStatut.DEMO_PREVUE,
  ProspectStatut.DEMO_REALISEE,
  ProspectStatut.OFFRE_ENVOYEE,
  ProspectStatut.NEGOCIATION,
  ProspectStatut.GAGNE,
  ProspectStatut.PERDU,
];

/** Provenance du prospect. */
export enum ProspectOrigine {
  LANDING = 'landing',
  MANUEL = 'manuel',
  REFERENCEMENT = 'referencement',
  SALON = 'salon',
  RECOMMANDATION = 'recommandation',
  AUTRE = 'autre',
}

/** Statut d'une demande de démonstration. */
export enum DemandeDemoStatut {
  DEMANDEE = 'demandee',
  PLANIFIEE = 'planifiee',
  REALISEE = 'realisee',
  ANNULEE = 'annulee',
}

/** Modalité de la démonstration. */
export enum ModeDemo {
  VISIO = 'visio',
  PRESENTIEL = 'presentiel',
  TELEPHONE = 'telephone',
}
