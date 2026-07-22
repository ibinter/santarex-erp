/**
 * Normalisation d'une DCI / classe / nom de médicament pour la comparaison :
 * minuscules, sans accents, espaces comprimés, ponctuation légère retirée.
 * Rend la recherche insensible à la casse et à la graphie.
 */
export function normaliserDci(valeur: string): string {
  return (valeur ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // supprime les diacritiques
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')   // ponctuation -> espace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ordonne une paire (A, B) de facon deterministe (ordre alphabetique) afin
 * qu'une interaction A/B et B/A pointent vers la meme cle de stockage.
 */
export function ordonnerPaire(a: string, b: string): [string, string] {
  const na = normaliserDci(a);
  const nb = normaliserDci(b);
  return na <= nb ? [na, nb] : [nb, na];
}
