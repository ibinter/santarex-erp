'use client';
// ════════════════════════════════════════════════════════════════════════════
//  Façade rétro-compatible vers le moteur universel d'export (src/lib/pdf).
//  L'ancienne API (exportPDF / exportXLSX / exportFichePDF) est conservée à
//  l'identique ; toutes les pages en bénéficient automatiquement du nouveau
//  moteur adaptatif (mesure du contenu, orientation/format auto, colonnes qui
//  remplissent la page, headers non cassés, caractères sûrs, pagination
//  équilibrée, header de continuation compact).
// ════════════════════════════════════════════════════════════════════════════

export { exportPDF, exportXLSX, exportFichePDF, exportFichePDFVerifiable, exportDocument, exportCSVList } from './pdf';
export type { PdfColumn, StatBox, VerifiableDocInput, VerifiableDocType } from './pdf';
