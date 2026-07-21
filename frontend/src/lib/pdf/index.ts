'use client';
// ════════════════════════════════════════════════════════════════════════════
//  DocumentExportService — orchestrateur du moteur universel d'export.
//  - Mesure le contenu, sélectionne la meilleure mise en page (multi-candidats),
//    valide, recompose si nécessaire, puis génère le PDF.
//  - Conserve des façades RÉTRO-COMPATIBLES avec l'ancien src/lib/export.ts
//    pour ne pas casser les ~10 pages appelantes.
// ════════════════════════════════════════════════════════════════════════════

import type {
  DocumentDefinition, ColumnDef, ExportRow, StatBox, FicheSection, LayoutCandidate,
} from './types';
import { registerFonts, makeMeasurer } from './fonts';
import { listCandidates, selectBestLayout } from './layout';
import { renderTableDocument, renderFiche } from './render';
import { validateDocument } from './validate';
import { exportXLSXAdaptive, exportCSV } from './xlsx';
import { enregistrerDocumentVerifiable } from './verification';
import type { VerifiableDocInput } from './verification';

export type { VerifiableDocInput, VerifiableDocType } from './verification';

// Crée un document jsPDF de mesure (les largeurs de texte sont indépendantes du format).
async function newMeasureDoc() {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerFonts(doc);
  return { doc, measure: makeMeasurer(doc) };
}

// ─── Export principal (liste de données) ─────────────────────────────────────
export async function exportDocument(def: DocumentDefinition): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const { measure } = await newMeasureDoc();

  // 1) Évalue tous les candidats, trie par score décroissant.
  let candidates: LayoutCandidate[] = [];
  try {
    candidates = listCandidates(def.columns, def.rows, measure, def.options)
      .slice()
      .sort((a, b) => b.score - a.score);
  } catch {
    candidates = [];
  }

  // 2) Recomposition : retient le meilleur candidat qui passe la validation,
  //    sinon le meilleur score, sinon le fallback selectBestLayout.
  let decision =
    candidates.find((c) => validateDocument(c, def).ok) ??
    candidates[0] ??
    selectBestLayout(def.columns, def.rows, measure, def.options);

  // 3) Génère le vrai document au format décidé.
  const doc = new jsPDF({
    unit: 'mm',
    format: decision.format.name,
    orientation: decision.format.orientation,
  });
  registerFonts(doc);
  await renderTableDocument(doc, def, decision);
  doc.save(`${def.filename}.pdf`);
}

// ════════════════════════════════════════════════════════════════════════════
//  FAÇADES RÉTRO-COMPATIBLES (ancienne API de src/lib/export.ts)
// ════════════════════════════════════════════════════════════════════════════

export interface PdfColumn { header: string; dataKey: string; width?: number }
export type { StatBox };

// exportPDF(columns, rows, title, filename, subtitle?, stats?)
export async function exportPDF(
  columns: PdfColumn[],
  rows: ExportRow[],
  title: string,
  filename: string,
  subtitle?: string,
  stats?: StatBox[],
): Promise<void> {
  const cols: ColumnDef[] = columns.map((c) => ({
    header: c.header,
    dataKey: c.dataKey,
    // width ignoré comme largeur fixe ; le moteur infère type/priorité/largeur.
  }));
  await exportDocument({
    title,
    filename,
    family: 'data-list',
    columns: cols,
    rows,
    options: { subtitle, stats, preferredFormat: 'auto', preferredOrientation: 'auto', mode: 'auto' },
  });
}

// exportFichePDF(title, sections, filename)
export async function exportFichePDF(
  title: string,
  sections: FicheSection[],
  filename: string,
): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerFonts(doc);
  renderFiche(doc, title, sections);
  doc.save(`${filename}.pdf`);
}

// exportFichePDFVerifiable(title, sections, filename, meta)
// Comme exportFichePDF, mais câble la chaîne « QR vérifiable bout-en-bout » :
// enregistre le document officiel dans le registre de vérification (token +
// empreinte SHA-256), puis intègre le QR code + l'URL publique de vérification
// en pied de document. Si l'enregistrement échoue (hors-ligne…), le PDF est
// tout de même produit, sans QR — jamais bloquant.
export async function exportFichePDFVerifiable(
  title: string,
  sections: FicheSection[],
  filename: string,
  meta: VerifiableDocInput,
): Promise<void> {
  const reg = await enregistrerDocumentVerifiable(meta);
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  registerFonts(doc);
  renderFiche(
    doc,
    title,
    sections,
    meta.reference,
    reg ? { url: reg.url, qrDataUrl: reg.qrDataUrl } : undefined,
  );
  doc.save(`${filename}.pdf`);
}

// exportXLSX(rows, filename, sheetName?) — rows = objets déjà mappés {En-tête: valeur}
export async function exportXLSX(
  rows: ExportRow[],
  filename: string,
  sheetName = 'Données',
): Promise<void> {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const columns: ColumnDef[] = keys.map((k) => ({ header: k, dataKey: k }));
  await exportXLSXAdaptive({
    title: sheetName,
    filename,
    family: 'data-list',
    columns,
    rows,
  });
}

// exportCSVList(rows, filename) — utilitaire optionnel
export async function exportCSVList(rows: ExportRow[], filename: string): Promise<void> {
  const keys = rows.length > 0 ? Object.keys(rows[0]) : [];
  const columns: ColumnDef[] = keys.map((k) => ({ header: k, dataKey: k }));
  await exportCSV({ title: filename, filename, family: 'data-list', columns, rows });
}
