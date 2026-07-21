import { TypeCompte } from './entities/compte-comptable.entity';

export interface CompteSeed {
  numero: string;
  libelle: string;
  classe: number;
  type: TypeCompte;
}

/**
 * Plan comptable SYSCOHADA de base (comptes principaux des classes 1 à 7).
 * Semé automatiquement par tenant au premier accès au module.
 */
export const PLAN_COMPTABLE_BASE: readonly CompteSeed[] = [
  // ── Classe 1 — Comptes de ressources durables (passif) ──
  { numero: '101', libelle: 'Capital social', classe: 1, type: TypeCompte.PASSIF },
  { numero: '106', libelle: 'Réserves', classe: 1, type: TypeCompte.PASSIF },
  { numero: '120', libelle: "Résultat de l'exercice", classe: 1, type: TypeCompte.PASSIF },
  { numero: '161', libelle: 'Emprunts et dettes auprès des établissements de crédit', classe: 1, type: TypeCompte.PASSIF },

  // ── Classe 2 — Comptes d'actif immobilisé ──
  { numero: '211', libelle: 'Terrains', classe: 2, type: TypeCompte.ACTIF },
  { numero: '213', libelle: 'Bâtiments', classe: 2, type: TypeCompte.ACTIF },
  { numero: '215', libelle: 'Installations et agencements', classe: 2, type: TypeCompte.ACTIF },
  { numero: '218', libelle: 'Matériel et mobilier', classe: 2, type: TypeCompte.ACTIF },
  { numero: '244', libelle: 'Matériel et mobilier médical', classe: 2, type: TypeCompte.ACTIF },

  // ── Classe 3 — Comptes de stocks ──
  { numero: '311', libelle: 'Marchandises', classe: 3, type: TypeCompte.ACTIF },
  { numero: '321', libelle: 'Matières premières', classe: 3, type: TypeCompte.ACTIF },
  { numero: '335', libelle: 'Stocks de médicaments et consommables', classe: 3, type: TypeCompte.ACTIF },

  // ── Classe 4 — Comptes de tiers ──
  { numero: '401', libelle: 'Fournisseurs', classe: 4, type: TypeCompte.PASSIF },
  { numero: '411', libelle: 'Clients', classe: 4, type: TypeCompte.ACTIF },
  { numero: '421', libelle: 'Personnel — rémunérations dues', classe: 4, type: TypeCompte.PASSIF },
  { numero: '431', libelle: 'Sécurité sociale', classe: 4, type: TypeCompte.PASSIF },
  { numero: '441', libelle: 'État — impôts sur les bénéfices', classe: 4, type: TypeCompte.PASSIF },
  { numero: '445', libelle: 'État — TVA', classe: 4, type: TypeCompte.PASSIF },

  // ── Classe 5 — Comptes de trésorerie ──
  { numero: '512', libelle: 'Banque', classe: 5, type: TypeCompte.TRESORERIE },
  { numero: '521', libelle: 'Banque — compte secondaire', classe: 5, type: TypeCompte.TRESORERIE },
  { numero: '531', libelle: 'Caisse', classe: 5, type: TypeCompte.TRESORERIE },
  { numero: '585', libelle: 'Virements internes / Mobile Money', classe: 5, type: TypeCompte.TRESORERIE },

  // ── Classe 6 — Comptes de charges ──
  { numero: '601', libelle: 'Achats de marchandises', classe: 6, type: TypeCompte.CHARGE },
  { numero: '602', libelle: 'Achats de médicaments et consommables', classe: 6, type: TypeCompte.CHARGE },
  { numero: '605', libelle: 'Autres achats (eau, électricité, fournitures)', classe: 6, type: TypeCompte.CHARGE },
  { numero: '613', libelle: 'Locations et charges locatives', classe: 6, type: TypeCompte.CHARGE },
  { numero: '618', libelle: 'Autres services extérieurs', classe: 6, type: TypeCompte.CHARGE },
  { numero: '641', libelle: 'Rémunérations du personnel', classe: 6, type: TypeCompte.CHARGE },
  { numero: '645', libelle: 'Charges sociales', classe: 6, type: TypeCompte.CHARGE },
  { numero: '681', libelle: 'Dotations aux amortissements', classe: 6, type: TypeCompte.CHARGE },

  // ── Classe 7 — Comptes de produits ──
  { numero: '701', libelle: 'Ventes de marchandises', classe: 7, type: TypeCompte.PRODUIT },
  { numero: '706', libelle: 'Prestations de services (consultations, actes)', classe: 7, type: TypeCompte.PRODUIT },
  { numero: '707', libelle: 'Ventes de médicaments', classe: 7, type: TypeCompte.PRODUIT },
  { numero: '708', libelle: 'Produits des activités annexes', classe: 7, type: TypeCompte.PRODUIT },
  { numero: '758', libelle: 'Produits divers de gestion courante', classe: 7, type: TypeCompte.PRODUIT },
];
