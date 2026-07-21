'use client';
// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Module : verification.ts
//  Câble la chaîne « QR vérifiable bout-en-bout » côté frontend :
//   1) enregistre le document officiel dans le registre de vérification backend
//      (POST /verification — token + empreinte SHA-256 calculée côté serveur) ;
//   2) récupère le QR code (data-URL PNG) + l'URL publique de vérification prêts
//      à être intégrés dans le PDF.
//
//  Confidentialité : on n'envoie au registre QUE des méta-données (type,
//  référence, société) et un « contenu » canonique servant d'empreinte. Aucune
//  donnée patient/montant n'est exposée publiquement (voir page /verify).
//  Résilience : toute erreur réseau renvoie `null` → le PDF est tout de même
//  généré, simplement sans QR (jamais bloquant pour l'utilisateur).
// ════════════════════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';

/** Types de documents vérifiables (miroir de l'enum backend DocumentType). */
export type VerifiableDocType = 'facture' | 'recu' | 'ordonnance' | 'attestation';

/** Entrée d'enregistrement fournie par un module métier. */
export interface VerifiableDocInput {
  typeDocument: VerifiableDocType;
  /** Référence métier (n° facture, n° ordonnance…). */
  reference: string;
  /**
   * Donnée canonique STABLE du document servant de source à l'empreinte
   * SHA-256 (hachée côté serveur). Ex. `facture|FAC-2026-001|150000|2026-01-01`.
   */
  contenu: string;
  /** Date d'émission ISO (défaut : maintenant, côté serveur). */
  emisLe?: string;
  /** Nom lisible de la société émettrice (défaut : tenant de l'utilisateur). */
  tenantNom?: string;
}

/** Résultat renvoyé par le registre backend. */
export interface VerificationRegistration {
  token: string;
  url: string;
  hash: string;
  qrDataUrl: string;
}

/** Ce dont le rendu PDF a besoin pour intégrer le QR. */
export interface PdfVerification {
  url: string;
  qrDataUrl: string;
}

/**
 * Enregistre un document officiel dans le registre de vérification et renvoie
 * son token, son URL publique et son QR code. Retourne `null` en cas d'échec
 * (hors-ligne, backend indisponible…) pour ne jamais bloquer la génération PDF.
 */
export async function enregistrerDocumentVerifiable(
  input: VerifiableDocInput,
): Promise<VerificationRegistration | null> {
  try {
    const user = getCurrentUser();
    const tenantNom =
      input.tenantNom ||
      (user as unknown as { tenantSlug?: string })?.tenantSlug ||
      user?.tenantId ||
      'SANTAREX ERP';

    const res = await apiClient<VerificationRegistration>('/verification', {
      method: 'POST',
      body: {
        typeDocument: input.typeDocument,
        reference: input.reference,
        tenantNom,
        contenu: input.contenu,
        ...(input.emisLe ? { emisLe: input.emisLe } : {}),
      },
    });

    if (!res?.qrDataUrl || !res?.url) return null;
    return res;
  } catch {
    // Résilience : PDF généré sans QR plutôt que de bloquer l'utilisateur.
    return null;
  }
}
