// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT — SÉLECTEUR DE MISE EN PAGE (layout engine)
//  Choisit le meilleur couple {format, orientation, marges, police} par SCORE
//  sur plusieurs candidats, plutôt qu'une simple règle "N colonnes → paysage".
//  Unité : millimètres (mm). Police : jsPDF (pt). Fonctions pures, sans DOM.
// ════════════════════════════════════════════════════════════════════════════

import type {
  ColumnDef,
  ExportRow,
  Measurer,
  ExportOptions,
  LayoutDecision,
  LayoutCandidate,
  Margins,
  Orientation,
  PageFormatName,
  PageFormatSpec,
  ColumnLayout,
  PaginationPlan,
} from './types';

import { analyzeColumns, fitColumns } from './columns';
import { estimateRowHeights, planPagination, balanceLastPages } from './pagination';

// ─── Constantes de mise en page ──────────────────────────────────────────────

/** Formats de page en mm, exprimés en PORTRAIT (le paysage échange w/h). */
export const PAGE_FORMATS: Record<'a4' | 'a3' | 'letter' | 'legal', { w: number; h: number }> = {
  a4: { w: 210, h: 297 },
  a3: { w: 297, h: 420 },
  letter: { w: 215.9, h: 279.4 },
  legal: { w: 215.9, h: 355.6 },
};

/** Marges (mm) — s'AJOUTENT autour des zones header/footer. */
const MARGINS_NORMAL: Margins = { top: 12, right: 13, bottom: 14, left: 13 };
const MARGINS_COMPACT: Margins = { top: 8, right: 9, bottom: 10, left: 9 };

/** Hauteurs réservées (mm). */
const HEADER_FIRST = 50; // en-tête complet (1ʳᵉ page)
const HEADER_CONT = 16; // en-tête de continuation (compact)
const FOOTER = 10;

/** Polices (pt). Plancher de lisibilité : 7.5pt. */
const FONT_NORMAL = 8.5;
const FONT_COMPACT = 7.5;

/** Rembourrage vertical de cellule (mm) transmis à estimateRowHeights. */
const V_PAD = 2;

/** Conversion pt → mm et facteur d'interligne, pour estimer une ligne unique. */
const MM_PER_PT = 0.352778;
const LINE_FACTOR = 1.15;

// ─── Description des candidats (ordre = préférence en cas d'égalité) ─────────

interface CandidateSpec {
  name: string;
  format: PageFormatName;
  orientation: Orientation;
  margins: Margins;
  fontSize: number;
}

const CANDIDATE_SPECS: CandidateSpec[] = [
  { name: 'A4 portrait normal', format: 'a4', orientation: 'portrait', margins: MARGINS_NORMAL, fontSize: FONT_NORMAL },
  { name: 'A4 portrait compact', format: 'a4', orientation: 'portrait', margins: MARGINS_COMPACT, fontSize: FONT_COMPACT },
  { name: 'A4 paysage normal', format: 'a4', orientation: 'landscape', margins: MARGINS_NORMAL, fontSize: FONT_NORMAL },
  { name: 'A4 paysage compact', format: 'a4', orientation: 'landscape', margins: MARGINS_COMPACT, fontSize: FONT_COMPACT },
  { name: 'A3 paysage normal', format: 'a3', orientation: 'landscape', margins: MARGINS_NORMAL, fontSize: FONT_NORMAL },
];

// ─── Utilitaires ─────────────────────────────────────────────────────────────

/** Dimensions effectives (mm) d'un format pour une orientation donnée. */
function formatSpec(name: PageFormatName, orientation: Orientation): PageFormatSpec {
  const base = PAGE_FORMATS[name as 'a4' | 'a3' | 'letter' | 'legal'];
  const width = orientation === 'landscape' ? base.h : base.w;
  const height = orientation === 'landscape' ? base.w : base.h;
  return { name, orientation, width, height };
}

/** Normalise la police en note de lisibilité : 8.5→1.0, 7.5→0.75 (linéaire, borné). */
function readabilityScore(fontSize: number): number {
  if (fontSize >= FONT_NORMAL) return 1;
  if (fontSize <= FONT_COMPACT) return 0.75;
  return 0.75 + ((fontSize - FONT_COMPACT) / (FONT_NORMAL - FONT_COMPACT)) * 0.25;
}

/** Hauteur estimée d'une cellule mono-ligne (mm) pour un seuil de détection du wrap. */
function singleLineHeight(fontSize: number): number {
  return fontSize * MM_PER_PT * LINE_FACTOR + V_PAD * 2;
}

/** Le plus long mot d'un libellé, mesuré en mm à la police d'en-tête (gras). */
function longestWordWidth(label: string, measure: Measurer, fontPt: number): number {
  const words = label.split(/\s+/).filter(Boolean);
  let max = 0;
  for (const w of words) {
    const width = measure(w, fontPt, true);
    if (width > max) max = width;
  }
  return max;
}

/** Somme des hauteurs des lignes d'une page. */
function pageHeight(rowIndices: number[], rowHeights: number[]): number {
  let sum = 0;
  for (const i of rowIndices) sum += rowHeights[i] ?? 0;
  return sum;
}

// ─── Évaluation d'un candidat ────────────────────────────────────────────────

function evaluate(
  spec: CandidateSpec,
  columns: ColumnDef[],
  rows: ExportRow[],
  measure: Measurer,
): LayoutCandidate {
  const format = formatSpec(spec.format, spec.orientation);
  const { margins, fontSize } = spec;
  const headerFontSize = fontSize;

  // 1. Largeur utile.
  const usableWidth = format.width - margins.left - margins.right;

  // 2. Analyse + solveur de colonnes.
  const analysis = analyzeColumns(columns, rows, measure, fontSize);
  const cols: ColumnLayout[] = fitColumns(analysis, usableWidth);
  const tableWidth = cols.reduce((s, c) => s + c.width, 0);

  // 3. Utilisation de la largeur + détection de débordement.
  const widthUtilization = usableWidth > 0 ? Math.min(tableWidth, usableWidth) / usableWidth : 0;
  const overflowing = analysis.estimatedCompactWidth > usableWidth;

  // Mot d'en-tête coupé : une colonne plus étroite que son plus long mot.
  let broken = false;
  for (const c of cols) {
    if (c.width + 0.01 < longestWordWidth(c.headerLabel, measure, headerFontSize)) {
      broken = true;
      break;
    }
  }

  // 4. Hauteurs utiles (1ʳᵉ page vs pages suivantes).
  const usableHeightFirst = format.height - margins.top - margins.bottom - HEADER_FIRST - FOOTER;
  const usableHeightOther = format.height - margins.top - margins.bottom - HEADER_CONT - FOOTER;

  // 5. Pagination équilibrée.
  const rowHeights = estimateRowHeights(cols, rows, measure, fontSize, V_PAD);
  const plan: PaginationPlan = balanceLastPages(
    planPagination(rowHeights, usableHeightFirst, usableHeightOther),
  );
  const pages = plan.pages;
  const estimatedPages = Math.max(1, pages.length);

  // Remplissage par page (moyenne globale) + dernière page.
  let fillSum = 0;
  for (let p = 0; p < pages.length; p++) {
    const cap = p === 0 ? usableHeightFirst : usableHeightOther;
    const filled = cap > 0 ? pageHeight(pages[p].rows, rowHeights) / cap : 0;
    fillSum += Math.min(1, filled);
  }
  const pageFillRatioGlobal = pages.length > 0 ? fillSum / pages.length : 0;

  const lastCap = estimatedPages > 1 ? usableHeightOther : usableHeightFirst;
  const lastRows = pages.length > 0 ? pages[pages.length - 1].rows : [];
  const lastPageFillRatio = lastCap > 0 ? pageHeight(lastRows, rowHeights) / lastCap : 0;

  // 6. Lisibilité + pénalité de wrapping.
  const readability = readabilityScore(fontSize);
  const lineThreshold = singleLineHeight(fontSize) * 1.4;
  let multiLine = 0;
  for (const h of rowHeights) if (h > lineThreshold) multiLine++;
  const wrappingPenalty = rowHeights.length > 0 ? multiLine / rowHeights.length : 0;

  // 7. Score (section 33).
  const excessiveWrapping = wrappingPenalty;
  const nearlyEmptyLastPage = estimatedPages > 1 && lastPageFillRatio < 0.2 ? 1 : 0;
  // Contenu tronqué : le tableau déborde à sa largeur mini, OU un mot d'en-tête est coupé.
  const clippedContent = overflowing || broken ? 1 : 0;

  const score =
    30 * readability +
    25 * widthUtilization +
    20 * pageFillRatioGlobal -
    15 * excessiveWrapping -
    20 * nearlyEmptyLastPage -
    30 * clippedContent;

  // Capacités dérivées du plan.
  const rowsFirstPage = pages.length > 0 ? pages[0].rows.length : 0;
  let rowsOtherPages: number;
  if (pages.length > 1) {
    rowsOtherPages = 0;
    for (let p = 1; p < pages.length; p++) {
      if (pages[p].rows.length > rowsOtherPages) rowsOtherPages = pages[p].rows.length;
    }
  } else {
    const avg = rowHeights.length > 0 ? rowHeights.reduce((s, h) => s + h, 0) / rowHeights.length : singleLineHeight(fontSize);
    rowsOtherPages = avg > 0 ? Math.max(1, Math.floor(usableHeightOther / avg)) : rowsFirstPage;
  }

  return {
    format,
    margins,
    fontSize,
    headerFontSize,
    columns: cols,
    tableWidth,
    usableWidth,
    rowsFirstPage,
    rowsOtherPages,
    score,
    candidateName: spec.name,
    widthUtilization,
    estimatedPages,
    lastPageFillRatio,
    wrappingPenalty,
    readability,
  };
}

// ─── API publique ────────────────────────────────────────────────────────────

/** Évalue tous les candidats et retourne leurs métriques complètes. */
export function listCandidates(
  columns: ColumnDef[],
  rows: ExportRow[],
  measure: Measurer,
  _opts?: ExportOptions,
): LayoutCandidate[] {
  return CANDIDATE_SPECS.map((spec) => evaluate(spec, columns, rows, measure));
}

/**
 * Sélectionne la meilleure mise en page.
 * - Si opts.preferredFormat / preferredOrientation ≠ 'auto' → filtre/force ce sous-ensemble.
 * - Sinon score max ; égalité tranchée par l'ordre de préférence de la liste.
 */
export function selectBestLayout(
  columns: ColumnDef[],
  rows: ExportRow[],
  measure: Measurer,
  opts?: ExportOptions,
): LayoutDecision {
  const all = listCandidates(columns, rows, measure, opts);

  // Filtrage selon les préférences explicites.
  const wantFormat = opts?.preferredFormat && opts.preferredFormat !== 'auto' ? opts.preferredFormat : undefined;
  const wantOrient =
    opts?.preferredOrientation && opts.preferredOrientation !== 'auto' ? opts.preferredOrientation : undefined;

  let pool = all;
  if (wantFormat || wantOrient) {
    const filtered = all.filter(
      (c) =>
        (!wantFormat || c.format.name === wantFormat) &&
        (!wantOrient || c.format.orientation === wantOrient),
    );
    // Repli sur l'ensemble complet si aucune combinaison prédéfinie ne correspond.
    if (filtered.length > 0) pool = filtered;
  }

  // Score max ; l'ordre de la liste tranche les égalités (strict > ⇒ premier gagnant conservé).
  let best = pool[0];
  for (let i = 1; i < pool.length; i++) {
    if (pool[i].score > best.score) best = pool[i];
  }

  // LayoutDecision = sous-ensemble de LayoutCandidate.
  const {
    format,
    margins,
    fontSize,
    headerFontSize,
    columns: cols,
    tableWidth,
    usableWidth,
    rowsFirstPage,
    rowsOtherPages,
    score,
    candidateName,
  } = best;

  return {
    format,
    margins,
    fontSize,
    headerFontSize,
    columns: cols,
    tableWidth,
    usableWidth,
    rowsFirstPage,
    rowsOtherPages,
    score,
    candidateName,
  };
}
