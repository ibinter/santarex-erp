/**
 * Types de documents vérifiables et statuts d'authenticité.
 * Préfixe des types Postgres : `doc_`.
 */
export enum DocumentType {
  FACTURE = 'facture',
  RECU = 'recu',
  ORDONNANCE = 'ordonnance',
  ATTESTATION = 'attestation',
}

export enum VerificationStatus {
  AUTHENTIQUE = 'authentique',
  ANNULE = 'annule',
  REMPLACE = 'remplace',
  REVOQUE = 'revoque',
}
