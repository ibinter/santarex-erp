import {
  DomaineIndicateur,
  SensIndicateur,
  UniteIndicateur,
} from './entities/indicateur-qualite.entity';

/**
 * Indicateurs qualité « types » proposés par défaut à chaque établissement.
 * Seedés à la volée pour un tenant lorsqu'il ne possède encore aucun indicateur
 * (voir `ensureSeed` dans le service). Un tenant reste libre de les désactiver
 * ou d'en créer d'autres — le seed ne réécrase jamais un code existant.
 */
export interface SeedIndicateur {
  code: string;
  libelle: string;
  domaine: DomaineIndicateur;
  unite: UniteIndicateur;
  cible: number;
  seuil: number | null;
  sens: SensIndicateur;
  description: string;
}

export const SEED_INDICATEURS: SeedIndicateur[] = [
  {
    code: 'TAUX_OCCUPATION',
    libelle: "Taux d'occupation des lits",
    domaine: DomaineIndicateur.DELAIS,
    unite: UniteIndicateur.POURCENTAGE,
    cible: 85,
    seuil: 95,
    sens: SensIndicateur.BAISSE_BONNE,
    description:
      "Pourcentage de lits occupés. Une valeur trop élevée signale une saturation.",
  },
  {
    code: 'DELAI_ATTENTE_URGENCES',
    libelle: "Délai d'attente aux urgences",
    domaine: DomaineIndicateur.DELAIS,
    unite: UniteIndicateur.JOURS,
    cible: 30,
    seuil: 60,
    sens: SensIndicateur.BAISSE_BONNE,
    description:
      "Délai moyen (en minutes/jours selon le suivi) avant prise en charge aux urgences.",
  },
  {
    code: 'TAUX_INFECTIONS_NOSOCOMIALES',
    libelle: "Taux d'infections nosocomiales",
    domaine: DomaineIndicateur.INFECTIONS,
    unite: UniteIndicateur.POURCENTAGE,
    cible: 5,
    seuil: 8,
    sens: SensIndicateur.BAISSE_BONNE,
    description:
      "Pourcentage de patients ayant contracté une infection associée aux soins.",
  },
  {
    code: 'TAUX_SATISFACTION',
    libelle: 'Taux de satisfaction des patients',
    domaine: DomaineIndicateur.SATISFACTION,
    unite: UniteIndicateur.POURCENTAGE,
    cible: 90,
    seuil: 75,
    sens: SensIndicateur.HAUSSE_BONNE,
    description:
      "Pourcentage de patients satisfaits (enquêtes de sortie / questionnaires).",
  },
];
