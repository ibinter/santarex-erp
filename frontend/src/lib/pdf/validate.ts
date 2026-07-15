// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Module : validate.ts
//  Contrôle post-décision (avant/après génération) : compare la décision de
//  mise en page au document réel et remplit un rapport d'anomalies exploitable.
//  Unité : millimètres (mm). Police cible : jsPDF (WinAnsi/Helvetica).
// ════════════════════════════════════════════════════════════════════════════

import type {
  LayoutDecision,
  DocumentDefinition,
  ValidationReport,
  Anomaly,
} from './types';
import { sanitizeText } from './fonts';

// ─── Seuils de contrôle ───────────────────────────────────────────────────────
const MIN_WIDTH_UTILIZATION = 0.8;      // en deçà → sous-remplissage (warn)
const OUT_OF_PAGE_TOLERANCE = 0.5;      // dépassement toléré (mm) avant erreur
const MIN_FONT_SIZE = 7.5;              // taille de corps minimale lisible (pt)
const FIRST_PAGE_HEADER_MM = 50;        // hauteur approximative du header 1ʳᵉ page
const HEADER_MAX_RATIO = 0.25;          // header > 25% de la hauteur utile → warn
const CHAR_MM = 1.7;                    // largeur approx d'un caractère d'en-tête
const WORD_PADDING_MM = 4;              // marge autour du mot le plus long
const NEARLY_EMPTY_RATIO = 0.15;        // dernière page < 15% remplie → warn
const MAX_WINANSI_CP = 0x2122;          // ™ : dernier code point WinAnsi toléré

// ─── Contrôle principal ───────────────────────────────────────────────────────
export function validateDocument(
  decision: LayoutDecision,
  def: DocumentDefinition,
): ValidationReport {
  const anomalies: Anomaly[] = [];

  const usableWidth = decision.usableWidth;
  const tableWidth = decision.tableWidth;

  // ── 1) Utilisation de la largeur ──────────────────────────────────────────
  // Sous-remplissage : le tableau n'occupe pas assez la zone imprimable.
  if (usableWidth > 0 && tableWidth / usableWidth < MIN_WIDTH_UTILIZATION) {
    anomalies.push({
      kind: 'low-width-utilization',
      severity: 'warn',
      detail:
        `Le tableau n'occupe que ${((tableWidth / usableWidth) * 100).toFixed(0)}% ` +
        `de la largeur utile (${tableWidth.toFixed(1)}mm / ${usableWidth.toFixed(1)}mm ; ` +
        `cible >= ${(MIN_WIDTH_UTILIZATION * 100).toFixed(0)}%).`,
    });
  }

  // ── 2) Débordement hors page ──────────────────────────────────────────────
  if (tableWidth > usableWidth + OUT_OF_PAGE_TOLERANCE) {
    anomalies.push({
      kind: 'out-of-page',
      severity: 'error',
      detail:
        `Largeur du tableau (${tableWidth.toFixed(1)}mm) supérieure à la zone ` +
        `imprimable (${usableWidth.toFixed(1)}mm) : contenu tronqué en bord de page.`,
    });
  }

  // ── 3) Police trop petite ─────────────────────────────────────────────────
  if (decision.fontSize < MIN_FONT_SIZE) {
    anomalies.push({
      kind: 'font-too-small',
      severity: 'error',
      detail:
        `Taille de police du corps ${decision.fontSize}pt < ${MIN_FONT_SIZE}pt : ` +
        `lisibilité insuffisante à l'impression.`,
    });
  }

  // ── 4) En-tête de 1ʳᵉ page surdimensionné ─────────────────────────────────
  // Hauteur utile de la page = hauteur format - marges verticales.
  const usableHeight =
    decision.format.height - decision.margins.top - decision.margins.bottom;
  if (usableHeight > 0 && FIRST_PAGE_HEADER_MM > usableHeight * HEADER_MAX_RATIO) {
    anomalies.push({
      kind: 'oversized-header',
      severity: 'warn',
      page: 1,
      detail:
        `L'en-tête de 1ʳᵉ page (~${FIRST_PAGE_HEADER_MM}mm) dépasse ` +
        `${(HEADER_MAX_RATIO * 100).toFixed(0)}% de la hauteur utile ` +
        `(${usableHeight.toFixed(1)}mm) : peu de place pour les données.`,
    });
  }

  // ── 5) Mots d'en-tête cassés ──────────────────────────────────────────────
  // Pour chaque colonne, on estime la largeur du plus long mot de son libellé.
  // Si la colonne est plus étroite, le mot sera coupé au milieu (illisible).
  for (const col of decision.columns) {
    const label = col.headerLabel || col.def.header || '';
    const longestWord = label
      .split(/\s+/)
      .reduce((a, w) => (w.length > a.length ? w : a), '');
    const estWordWidth = longestWord.length * CHAR_MM + WORD_PADDING_MM;
    if (longestWord.length > 0 && col.width < estWordWidth) {
      anomalies.push({
        kind: 'broken-word',
        severity: 'warn',
        detail:
          `Colonne « ${label} » : largeur ${col.width.toFixed(1)}mm < largeur estimée ` +
          `du mot « ${longestWord} » (~${estWordWidth.toFixed(1)}mm) : en-tête coupé.`,
      });
    }
  }

  // ── 6) Caractères corrompus (hors WinAnsi après sanitation) ───────────────
  // Défense en profondeur : même après sanitizeText, on vérifie qu'aucun code
  // point > ™ (0x2122) ne subsiste, ce qui produirait du mojibake en PDF.
  const dataKeys = def.columns.map((c) => c.dataKey);
  outer: for (let r = 0; r < def.rows.length; r++) {
    const row = def.rows[r];
    for (const key of dataKeys) {
      const cleaned = sanitizeText(row?.[key]);
      for (const ch of cleaned) {
        const cp = ch.codePointAt(0) ?? 0;
        if (cp > MAX_WINANSI_CP) {
          anomalies.push({
            kind: 'corrupted-characters',
            severity: 'error',
            detail:
              `Caractère hors WinAnsi (U+${cp.toString(16).toUpperCase().padStart(4, '0')}) ` +
              `résiduel dans la colonne « ${key} » (ligne ${r + 1}) : risque de rendu corrompu.`,
          });
          break outer; // une occurrence suffit à signaler l'anomalie.
        }
      }
    }
  }

  // ── 7) Dernière page quasi vide ───────────────────────────────────────────
  // On estime le nombre de pages puis le remplissage de la dernière.
  const totalRows = def.rows.length;
  const { pages, lastPageRows } = estimatePages(
    totalRows,
    decision.rowsFirstPage,
    decision.rowsOtherPages,
  );
  if (
    pages > 1 &&
    decision.rowsOtherPages > 0 &&
    lastPageRows > 0 &&
    lastPageRows / decision.rowsOtherPages < NEARLY_EMPTY_RATIO
  ) {
    anomalies.push({
      kind: 'nearly-empty-last-page',
      severity: 'warn',
      page: pages,
      detail:
        `Dernière page très peu remplie (${lastPageRows} ligne(s) sur ` +
        `${decision.rowsOtherPages} de capacité) : envisager un rééquilibrage.`,
    });
  }

  return {
    anomalies,
    ok: anomalies.every((a) => a.severity !== 'error'),
  };
}

// ─── Estimation de pagination (approximation acceptable) ──────────────────────
function estimatePages(
  totalRows: number,
  rowsFirstPage: number,
  rowsOtherPages: number,
): { pages: number; lastPageRows: number } {
  if (totalRows <= 0) return { pages: 1, lastPageRows: 0 };
  if (totalRows <= rowsFirstPage) return { pages: 1, lastPageRows: totalRows };

  const remaining = totalRows - rowsFirstPage;
  if (rowsOtherPages <= 0) return { pages: 2, lastPageRows: remaining };

  const extraPages = Math.ceil(remaining / rowsOtherPages);
  const rem = remaining % rowsOtherPages;
  const lastPageRows = rem === 0 ? rowsOtherPages : rem;
  return { pages: 1 + extraPages, lastPageRows };
}
