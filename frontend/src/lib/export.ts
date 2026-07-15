'use client';
// ─────────────────────────────────────────────────────────────────────────────
//  Façade rétro-compatible vers le moteur universel d'export (src/lib/pdf).
//  Conserve l'API historique (exportPDF, exportXLSX, exportFichePDF, PdfColumn,
//  StatBox) pour les pages existantes ; toute la logique vit désormais dans
//  le moteur adaptatif `./pdf`.
// ─────────────────────────────────────────────────────────────────────────────
export {
  exportPDF,
  exportXLSX,
  exportFichePDF,
  exportDocument,
  exportCSVList,
} from './pdf';
export type { PdfColumn, StatBox } from './pdf';
