'use client';
// ════════════════════════════════════════════════════════════════════════════
//  FILIGRANE DU PALIER GRATUIT « DÉCOUVERTE » — IBIG SOFT (cahier IBIG v1.1)
//  §3.5 + §6 : sur les documents FINANCIERS (factures, reçus / tickets de
//  caisse) générés côté client au palier gratuit, on estampille un filigrane
//  discret en pied de page. JAMAIS sur les ordonnances ni aucune pièce à valeur
//  médicale remise au patient (§6, note santarex).
//
//  Résilience : si /licence/etat échoue, on NE bloque PAS la génération — pas de
//  filigrane par défaut (comportement historique).
// ════════════════════════════════════════════════════════════════════════════

import { apiClient } from '@/lib/api';

/** Texte EXACT du filigrane (cahier §3.5). Ne pas modifier. */
export const TEXTE_FILIGRANE = 'Généré avec SANTAREX — ibigsoft.com';

interface EtatLicence {
  palierGratuit?: boolean;
  filigrane?: boolean;
  [k: string]: unknown;
}

// Cache module-level : l'état de licence est récupéré une seule fois par session
// de page. On mémorise la promesse pour dédupliquer les appels concurrents.
let etatPromise: Promise<EtatLicence | null> | null = null;

/**
 * Récupère (et met en cache) l'état de licence du tenant courant.
 * Retourne `null` en cas d'échec réseau — jamais bloquant.
 */
export function chargerEtatLicence(): Promise<EtatLicence | null> {
  if (etatPromise) return etatPromise;
  etatPromise = (async () => {
    try {
      // apiClient déballe déjà l'enveloppe { data: … }.
      const etat = await apiClient<EtatLicence>('/licence/etat');
      return etat ?? null;
    } catch {
      return null; // Résilience : pas de filigrane si l'état est indisponible.
    }
  })();
  return etatPromise;
}

/** Réinitialise le cache (utile pour les tests / changement de tenant). */
export function reinitialiserEtatLicence(): void {
  etatPromise = null;
}

function pageW(doc: any): number {
  return doc.internal.pageSize.getWidth?.() ?? doc.internal.pageSize.width;
}
function pageH(doc: any): number {
  return doc.internal.pageSize.getHeight?.() ?? doc.internal.pageSize.height;
}

/**
 * Applique le filigrane « Généré avec SANTAREX — ibigsoft.com » centré en pied
 * de CHAQUE page du document jsPDF, UNIQUEMENT si le tenant est au palier
 * Découverte (filigrane === true depuis /licence/etat).
 *
 * À n'appeler QUE sur des documents FINANCIERS (factures, reçus). Ne jamais
 * l'appeler sur une ordonnance ou une pièce médicale.
 *
 * @param doc  document jsPDF prêt à être sauvegardé.
 */
export async function appliquerFiligraneSiGratuit(doc: any): Promise<void> {
  let etat: EtatLicence | null = null;
  try {
    etat = await chargerEtatLicence();
  } catch {
    etat = null;
  }
  if (!etat || etat.filigrane !== true) return; // Palier payant ou état indispo.

  try {
    const nbPages: number =
      doc.internal.getNumberOfPages?.() ?? doc.getNumberOfPages?.() ?? 1;
    const w = pageW(doc);
    const h = pageH(doc);
    const activePage = doc.internal.getCurrentPageInfo?.()?.pageNumber ?? 1;

    for (let p = 1; p <= nbPages; p++) {
      doc.setPage(p);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150); // gris discret.
      // 4 mm au-dessus du bord bas, centré.
      doc.text(TEXTE_FILIGRANE, w / 2, h - 4, { align: 'center' });
    }

    // Restaure la page active pour ne pas perturber un rendu ultérieur.
    doc.setPage(activePage);
  } catch {
    // Ne jamais bloquer la sauvegarde du PDF pour un souci de filigrane.
  }
}
