import { GroupeABO, Rhesus } from '../entities/poche-sang.entity';

/**
 * Règles transfusionnelles réelles (compatibilité érythrocytaire / CGR).
 *
 * ABO — le receveur ne doit pas recevoir d'antigène qu'il ne possède pas :
 *   O  → reçoit uniquement O            (O = donneur universel)
 *   A  → reçoit A, O
 *   B  → reçoit B, O
 *   AB → reçoit A, B, AB, O             (AB = receveur universel)
 *
 * Rhésus — un receveur Rh négatif ne doit recevoir que du sang Rh négatif ;
 *   un receveur Rh positif peut recevoir Rh+ ou Rh-.
 *
 * Donc O- est le donneur universel et AB+ le receveur universel.
 */
const ABO_RECEVEUR_ACCEPTE: Record<GroupeABO, GroupeABO[]> = {
  [GroupeABO.O]: [GroupeABO.O],
  [GroupeABO.A]: [GroupeABO.A, GroupeABO.O],
  [GroupeABO.B]: [GroupeABO.B, GroupeABO.O],
  [GroupeABO.AB]: [GroupeABO.A, GroupeABO.B, GroupeABO.AB, GroupeABO.O],
};

export function estCompatible(
  groupeReceveur: GroupeABO,
  rhReceveur: Rhesus,
  groupePoche: GroupeABO,
  rhPoche: Rhesus,
): boolean {
  const aboOk = ABO_RECEVEUR_ACCEPTE[groupeReceveur]?.includes(groupePoche) ?? false;
  // Rh- ne reçoit que du Rh- ; Rh+ reçoit tout.
  const rhOk = rhReceveur === Rhesus.POSITIF ? true : rhPoche === Rhesus.NEGATIF;
  return aboOk && rhOk;
}

/**
 * Liste des groupes/rhésus de poches compatibles avec un receveur donné.
 * Utile pour construire une requête de recherche de stock compatible.
 */
export function groupesCompatiblesPour(
  groupeReceveur: GroupeABO,
  rhReceveur: Rhesus,
): { groupe: GroupeABO; rhesus: Rhesus }[] {
  const groupes = ABO_RECEVEUR_ACCEPTE[groupeReceveur] ?? [];
  const rhesusList =
    rhReceveur === Rhesus.POSITIF
      ? [Rhesus.POSITIF, Rhesus.NEGATIF]
      : [Rhesus.NEGATIF];
  const result: { groupe: GroupeABO; rhesus: Rhesus }[] = [];
  for (const groupe of groupes) {
    for (const rhesus of rhesusList) {
      result.push({ groupe, rhesus });
    }
  }
  return result;
}
