/**
 * Coordonnées officielles de paiement Mobile Money direct (section 19.5).
 *
 * Source de vérité unique, seedée/exposée via `GET /paiement/coordonnees-momo`.
 * NE JAMAIS coder ces valeurs en dur dans la vue front : le front les charge
 * depuis l'endpoint. Modifiable ici (ou surchargée par variables d'environnement
 * `MOMO_ORANGE`, `MOMO_MOOV`, `MOMO_MTN`, `MOMO_WAVE` si besoin d'override).
 *
 * SÉCURITÉ : le paiement Mobile Money direct n'active JAMAIS automatiquement une
 * licence. Après envoi, le client téléverse une preuve → une demande « en attente »
 * est créée et validée MANUELLEMENT par un administrateur.
 */
export interface CoordonneeMomo {
  operateur: string;
  code: 'orange_money' | 'moov_money' | 'mtn_momo' | 'wave';
  numero: string;
  titulaire: string;
}

export const COORDONNEES_MOMO: CoordonneeMomo[] = [
  {
    operateur: 'Orange Money',
    code: 'orange_money',
    numero: '+225 07 78 88 25 92',
    titulaire: 'IBIG SARL',
  },
  {
    operateur: 'Moov Money',
    code: 'moov_money',
    numero: '+225 01 53 59 55 44',
    titulaire: 'IBIG SARL',
  },
  {
    operateur: 'MTN MoMo',
    code: 'mtn_momo',
    numero: '+225 05 55 05 99 01',
    titulaire: 'IBIG SARL',
  },
  {
    operateur: 'Wave',
    code: 'wave',
    numero: '+225 07 78 88 25 92',
    titulaire: 'IBIG SARL',
  },
];
