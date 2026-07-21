// ════════════════════════════════════════════════════════════════════════════
//  ACADÉMIE / FORMATION SANTAREX — énumérations.
//  Espace de formation structuré : parcours → ressources → progression.
//  Contenu global (tenantId null) partageable + progression par user/tenant.
//  Tables préfixées `academie_`.
// ════════════════════════════════════════════════════════════════════════════

/** Catégorie thématique d'un parcours de formation. */
export enum ParcoursCategorie {
  DEMARRAGE = 'demarrage',
  ADMINISTRATION = 'administration',
  MODULES = 'modules',
  FINANCE = 'finance',
  MOBILE = 'mobile',
  SECURITE = 'securite',
  NOUVEAUTES = 'nouveautes',
}

/** Ordre canonique d'affichage des catégories. */
export const PARCOURS_CATEGORIE_ORDRE: ParcoursCategorie[] = [
  ParcoursCategorie.DEMARRAGE,
  ParcoursCategorie.ADMINISTRATION,
  ParcoursCategorie.MODULES,
  ParcoursCategorie.FINANCE,
  ParcoursCategorie.MOBILE,
  ParcoursCategorie.SECURITE,
  ParcoursCategorie.NOUVEAUTES,
];

/** Libellés lisibles des catégories (français). */
export const PARCOURS_CATEGORIE_LABEL: Record<ParcoursCategorie, string> = {
  [ParcoursCategorie.DEMARRAGE]: 'Démarrage',
  [ParcoursCategorie.ADMINISTRATION]: 'Administration',
  [ParcoursCategorie.MODULES]: 'Modules métier',
  [ParcoursCategorie.FINANCE]: 'Finance & Comptabilité',
  [ParcoursCategorie.MOBILE]: 'Mobile & PWA',
  [ParcoursCategorie.SECURITE]: 'Sécurité & Conformité',
  [ParcoursCategorie.NOUVEAUTES]: 'Nouveautés',
};

/** Niveau de difficulté d'un parcours. */
export enum ParcoursNiveau {
  DEBUTANT = 'debutant',
  INTERMEDIAIRE = 'intermediaire',
  AVANCE = 'avance',
}

/** Type de ressource pédagogique. */
export enum RessourceType {
  VIDEO = 'video',
  DOCUMENT = 'document',
  QUIZ = 'quiz',
}

/** Statut de progression d'un utilisateur sur une ressource. */
export enum ProgressionStatut {
  NON_COMMENCE = 'non_commence',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
}
