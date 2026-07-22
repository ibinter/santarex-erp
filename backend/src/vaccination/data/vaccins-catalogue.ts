import { CibleVaccin } from '../entities/vaccin.entity';

export interface VaccinSeed {
  code: string;
  nom: string;
  maladieCible: string;
  nbDoses: number;
  intervalleJours: number;
  cible: CibleVaccin;
  ageRecommande: string;
}

/**
 * Catalogue de référence sémé par tenant si le référentiel est vide.
 * Reprend le PEV (Programme Élargi de Vaccination) Côte d'Ivoire pour l'enfant
 * + les vaccins adultes courants. Les intervalles sont exprimés en jours.
 */
export const CATALOGUE_VACCINS: VaccinSeed[] = [
  // ── PEV enfant (Côte d'Ivoire) ────────────────────────────────────────────
  { code: 'BCG', nom: 'BCG (tuberculose)', maladieCible: 'Tuberculose', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ENFANT, ageRecommande: 'Naissance' },
  { code: 'VPO-0', nom: 'Polio oral (naissance)', maladieCible: 'Poliomyélite', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ENFANT, ageRecommande: 'Naissance' },
  { code: 'HEPB-NAIS', nom: 'Hépatite B (dose naissance)', maladieCible: 'Hépatite B', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ENFANT, ageRecommande: 'Naissance' },
  { code: 'PENTA', nom: 'Pentavalent (DTC-HepB-Hib)', maladieCible: 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Hib', nbDoses: 3, intervalleJours: 28, cible: CibleVaccin.ENFANT, ageRecommande: '6, 10, 14 semaines' },
  { code: 'VPO', nom: 'Polio oral', maladieCible: 'Poliomyélite', nbDoses: 3, intervalleJours: 28, cible: CibleVaccin.ENFANT, ageRecommande: '6, 10, 14 semaines' },
  { code: 'VPI', nom: 'Polio inactivé', maladieCible: 'Poliomyélite', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ENFANT, ageRecommande: '14 semaines' },
  { code: 'PCV13', nom: 'Pneumocoque conjugué', maladieCible: 'Infections à pneumocoque', nbDoses: 3, intervalleJours: 28, cible: CibleVaccin.ENFANT, ageRecommande: '6, 10, 14 semaines' },
  { code: 'ROTA', nom: 'Rotavirus', maladieCible: 'Gastro-entérite à rotavirus', nbDoses: 2, intervalleJours: 28, cible: CibleVaccin.ENFANT, ageRecommande: '6, 10 semaines' },
  { code: 'RR', nom: 'Rougeole-Rubéole', maladieCible: 'Rougeole, Rubéole', nbDoses: 2, intervalleJours: 273, cible: CibleVaccin.ENFANT, ageRecommande: '9 et 15 mois' },
  { code: 'FJ', nom: 'Fièvre jaune', maladieCible: 'Fièvre jaune', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.TOUS, ageRecommande: '9 mois' },
  { code: 'MENA', nom: 'Méningite A', maladieCible: 'Méningite à méningocoque A', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ENFANT, ageRecommande: '9-18 mois' },

  // ── Vaccins adultes courants ──────────────────────────────────────────────
  { code: 'VAT', nom: 'Tétanos (VAT)', maladieCible: 'Tétanos', nbDoses: 5, intervalleJours: 180, cible: CibleVaccin.ADULTE, ageRecommande: 'Femme enceinte / rappel' },
  { code: 'HEPB-AD', nom: 'Hépatite B (adulte)', maladieCible: 'Hépatite B', nbDoses: 3, intervalleJours: 30, cible: CibleVaccin.ADULTE, ageRecommande: 'Schéma 0-1-6 mois' },
  { code: 'FJ-AD', nom: 'Fièvre jaune (adulte)', maladieCible: 'Fièvre jaune', nbDoses: 1, intervalleJours: 0, cible: CibleVaccin.ADULTE, ageRecommande: 'Dose unique' },
  { code: 'COVID', nom: 'COVID-19', maladieCible: 'SARS-CoV-2', nbDoses: 2, intervalleJours: 28, cible: CibleVaccin.ADULTE, ageRecommande: 'Schéma primaire + rappels' },
  { code: 'GRIPPE', nom: 'Grippe saisonnière', maladieCible: 'Grippe', nbDoses: 1, intervalleJours: 365, cible: CibleVaccin.ADULTE, ageRecommande: 'Annuel' },
];
