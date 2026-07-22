/**
 * Enums du module Interactions médicamenteuses & contre-indications.
 */

/** Gravité d'une interaction médicamenteuse. */
export enum SeveriteInteraction {
  CONTRE_INDICATION = 'contre_indication',
  MAJEURE = 'majeure',
  MODEREE = 'moderee',
  MINEURE = 'mineure',
}

/** Gravité d'une contre-indication (état/terrain du patient). */
export enum GraviteContreIndication {
  ABSOLUE = 'absolue',
  RELATIVE = 'relative',
  PRECAUTION = 'precaution',
}

/**
 * Ordre décroissant de gravité — sert au tri et à la priorisation des alertes
 * (le plus dangereux d'abord).
 */
export const SEVERITE_ORDRE: Record<SeveriteInteraction, number> = {
  [SeveriteInteraction.CONTRE_INDICATION]: 0,
  [SeveriteInteraction.MAJEURE]: 1,
  [SeveriteInteraction.MODEREE]: 2,
  [SeveriteInteraction.MINEURE]: 3,
};

export const GRAVITE_ORDRE: Record<GraviteContreIndication, number> = {
  [GraviteContreIndication.ABSOLUE]: 0,
  [GraviteContreIndication.RELATIVE]: 1,
  [GraviteContreIndication.PRECAUTION]: 2,
};
