// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Module : xlsx.ts
//  Export tableur adaptatif (SheetJS) et export CSV UTF-8 (Excel FR), avec
//  largeurs de colonnes intelligentes, gel d'en-tête, autofilter, config
//  d'impression et protection anti-injection de formule pour le CSV.
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { DocumentDefinition } from './types';
import { sanitizeText } from './fonts';

// ─── Bornes de largeur de colonne (en caractères, unité SheetJS `wch`) ────────
const MIN_COL_WCH = 8;
const MAX_COL_WCH = 60;
const COL_PADDING = 2;      // marge de confort ajoutée à la largeur calculée
const LANDSCAPE_COL_THRESHOLD = 8; // au-delà → orientation paysage + fit-to-width

// ─── Export tableur adaptatif (.xlsx) ─────────────────────────────────────────
export async function exportXLSXAdaptive(def: DocumentDefinition): Promise<void> {
  const XLSX = await import('xlsx');

  const columns = def.columns;
  const rows = def.rows;

  // 1) Lignes d'objets {enTête: valeurSanitizée}. En-têtes uniques (déduplication
  //    défensive : json_to_sheet écraserait des clés identiques).
  const headers = uniqueHeaders(columns.map((c) => sanitizeText(c.header)));

  const data = rows.map((row) => {
    const obj: Record<string, string> = {};
    columns.forEach((col, i) => {
      obj[headers[i]] = sanitizeText(row?.[col.dataKey]);
    });
    return obj;
  });

  // 2) Feuille de calcul (ordre des colonnes forcé via `header`).
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });

  // 3) Largeurs de colonnes : max(longueur en-tête, P90 des longueurs de contenu)
  //    borné entre 8 et 60 caractères.
  ws['!cols'] = columns.map((col, i) => {
    const headerLen = headers[i].length;
    const contentLengths = rows.map(
      (row) => sanitizeText(row?.[col.dataKey]).length,
    );
    const p90 = percentile(contentLengths, 0.9);
    const wch = clamp(Math.max(headerLen, p90) + COL_PADDING, MIN_COL_WCH, MAX_COL_WCH);
    return { wch };
  });

  // 4) Plage totale (référence pour gel, autofilter, impression).
  const lastRow = data.length; // ligne 0 = en-tête ; données ensuite.
  const lastCol = Math.max(headers.length - 1, 0);
  const fullRange = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastRow, c: lastCol },
  });

  // 5) Gel de la ligne d'en-tête (ligne 1 figée au défilement).
  const freeze = {
    xSplit: 0,
    ySplit: 1,
    topLeftCell: 'A2',
    activePane: 'bottomLeft',
    state: 'frozen',
  };
  (ws as any)['!freeze'] = freeze;
  (ws as any)['!panes'] = [
    { ...freeze, pane: 'bottomLeft' },
  ];

  // 6) Autofilter sur toute la plage (tri/filtre depuis l'en-tête).
  (ws as any)['!autofilter'] = { ref: fullRange };

  // 7) Configuration d'impression : marges, orientation adaptative, fit-to-width.
  (ws as any)['!margins'] = {
    left: 0.5,
    right: 0.5,
    top: 0.75,
    bottom: 0.75,
    header: 0.3,
    footer: 0.3,
  };
  const landscape = headers.length > LANDSCAPE_COL_THRESHOLD;
  (ws as any)['!pageSetup'] = {
    orientation: landscape ? 'landscape' : 'portrait',
    scale: 0,          // désactive l'échelle fixe au profit du fit-to-width
    fitToWidth: 1,     // ajuste toutes les colonnes sur une largeur de page
    fitToHeight: 0,    // hauteur libre (autant de pages que nécessaire)
  };

  // 8) Classeur + écriture (déclenche le téléchargement navigateur).
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName(def.title));
  XLSX.writeFile(wb, def.filename + '.xlsx');
}

// ─── Export CSV UTF-8 (BOM) séparateur ';' — Excel FR ─────────────────────────
export async function exportCSV(def: DocumentDefinition): Promise<void> {
  const SEP = ';';
  const EOL = '\r\n';
  const BOM = '﻿';

  const headerLine = def.columns
    .map((c) => csvCell(sanitizeText(c.header), SEP))
    .join(SEP);

  const bodyLines = def.rows.map((row) =>
    def.columns
      .map((c) => csvCell(sanitizeText(row?.[c.dataKey]), SEP))
      .join(SEP),
  );

  const content = BOM + [headerLine, ...bodyLines].join(EOL) + EOL;

  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, def.filename + '.csv');
}

// ─── Cellule CSV : anti-injection de formule + échappement ────────────────────
function csvCell(value: string, sep: string): string {
  // Protection anti-injection : une valeur commençant par = + - @ peut être
  // interprétée comme une formule par Excel/Sheets. On la neutralise avec une
  // apostrophe de tête (le tableur l'affiche comme du texte littéral).
  let v = value;
  if (/^[=+\-@]/.test(v)) v = "'" + v;

  // Échappement RFC 4180 : si la valeur contient le séparateur, un guillemet,
  // ou un saut de ligne, on l'entoure de guillemets et on double les guillemets
  // internes.
  if (v.includes(sep) || v.includes('"') || /[\r\n]/.test(v)) {
    v = '"' + v.replace(/"/g, '""') + '"';
  }
  return v;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

// P90 (ou tout percentile) d'une liste d'entiers, en longueur de caractères.
function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil(p * sorted.length) - 1),
  );
  return sorted[idx];
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

// Garantit des en-têtes uniques (json_to_sheet indexe par clé).
function uniqueHeaders(labels: string[]): string[] {
  const seen = new Map<string, number>();
  return labels.map((raw) => {
    const base = raw.length > 0 ? raw : 'Colonne';
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

// Nom de feuille valide pour Excel (<=31 car., sans caractères interdits).
function sheetName(title: string): string {
  const cleaned = sanitizeText(title).replace(/[\\/?*[\]:]/g, ' ').trim();
  return (cleaned || 'Export').slice(0, 31);
}

// Déclenche le téléchargement d'un Blob via un lien temporaire.
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
