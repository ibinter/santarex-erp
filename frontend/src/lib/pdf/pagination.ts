// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  pagination.ts — Pagination dynamique + équilibrage des dernières pages.
//
//  Fonctions PURES (aucun effet de bord, aucune dépendance au DOM/jsPDF).
//  Unité : millimètres (mm). Le texte est mesuré via un `Measurer` injecté.
//
//  Pipeline :
//    1. estimateRowHeights → hauteur (mm) de chaque ligne selon son contenu.
//    2. planPagination      → répartition gloutonne en pages.
//    3. balanceLastPages    → rééquilibrage si la dernière page est quasi vide.
// ════════════════════════════════════════════════════════════════════════════

import type { ColumnLayout, ExportRow, Measurer, PagePlan, PaginationPlan } from './types';

// Padding horizontal interne d'une cellule (gauche + droite), en mm.
// Retranché de la largeur de colonne avant d'estimer le wrap.
const CELL_H_PAD = 6;

// Nombre maximum de lignes de wrap tolérées pour une cellule (borne de sécurité).
const MAX_WRAP_LINES = 6;

/**
 * Hauteur (mm) de chaque ligne selon son contenu réel et les largeurs de colonnes.
 *
 * Pour chaque cellule :
 *   - si la colonne est `nowrap` → 1 ligne (dates, montants, références courtes…) ;
 *   - sinon on estime le nombre de lignes de wrap comme le ratio
 *       largeur_texte_mesurée / largeur_utile_colonne
 *     borné entre 1 et MAX_WRAP_LINES.
 * La hauteur d'une ligne = (max de lignes sur toutes les colonnes) × interligne
 *   + padding vertical haut/bas.
 *
 * @param fontPt taille de police du corps (pt)
 * @param vPad   padding vertical d'une cellule (mm), appliqué en haut ET en bas
 *
 * Exemple chiffré (fontPt = 9 → LINE_MM ≈ 9 × 0.3528 × 1.15 ≈ 3.65 mm, vPad = 1.5) :
 *   - ligne courte tenant sur 1 ligne : 1 × 3.65 + 2×1.5 = 6.65 mm
 *   - ligne dont une cellule wrap sur 3 lignes : 3 × 3.65 + 3 = 13.95 mm
 */
export function estimateRowHeights(
  cols: ColumnLayout[],
  rows: ExportRow[],
  measure: Measurer,
  fontPt: number,
  vPad: number,
): number[] {
  // Conversion pt → mm avec interligne 1.15.
  const LINE_MM = fontPt * 0.3528 * 1.15;

  return rows.map((row) => {
    let rowLines = 1;

    for (const col of cols) {
      const text = String(row[col.def.dataKey] ?? '');

      let cellLines: number;
      if (col.nowrap || text === '') {
        cellLines = 1;
      } else {
        // Largeur utile de la colonne (on retire le padding horizontal).
        const usable = Math.max(1, col.width - CELL_H_PAD);
        const textWidth = measure(text, fontPt);
        // Approximation : largeur totale du texte / largeur d'une ligne de colonne.
        cellLines = Math.max(1, Math.ceil(textWidth / usable));
        // Borne de sécurité pour éviter des hauteurs aberrantes.
        cellLines = Math.min(cellLines, MAX_WRAP_LINES);
      }

      if (cellLines > rowLines) rowLines = cellLines;
    }

    return rowLines * LINE_MM + vPad * 2;
  });
}

/**
 * Répartit les lignes en pages (remplissage glouton).
 *
 * L'en-tête de tableau est répété sur chaque page : la seule différence entre
 * la 1ʳᵉ page et les suivantes est la hauteur utile disponible.
 *   - 1ʳᵉ page : `usableHeightFirst` (réduite par le header complet + stats) ;
 *   - pages suivantes : `usableHeightOther` (header de continuation compact).
 *
 * Une ligne plus haute que la capacité d'une page est tout de même placée seule
 * sur sa page (on ne peut pas la découper ici) pour éviter une boucle infinie.
 *
 * @returns PaginationPlan { pages, rowHeights, balanced:false }
 *
 * Exemple : 12 lignes de ~6.65 mm, usableHeightFirst = 40, usableHeightOther = 60.
 *   Page 1 : 6 lignes (6×6.65 = 39.9 ≤ 40) → [0..5]
 *   Page 2 : 9 tiendraient (59.85 ≤ 60) mais il n'en reste que 6 → [6..11]
 */
export function planPagination(
  rowHeights: number[],
  usableHeightFirst: number,
  usableHeightOther: number,
): PaginationPlan {
  const pages: PagePlan[] = [];

  let current: number[] = [];
  let currentHeight = 0;
  let isFirstPage = true;

  const capacityOf = (first: boolean) => (first ? usableHeightFirst : usableHeightOther);

  for (let i = 0; i < rowHeights.length; i++) {
    const h = rowHeights[i];
    const capacity = capacityOf(isFirstPage);

    // La ligne ne tient plus sur la page courante (et la page n'est pas vide) →
    // on clôt la page et on démarre la suivante.
    if (current.length > 0 && currentHeight + h > capacity) {
      pages.push({ rows: current });
      current = [];
      currentHeight = 0;
      isFirstPage = false;
    }

    current.push(i);
    currentHeight += h;
  }

  if (current.length > 0) {
    pages.push({ rows: current });
  }

  return { pages, rowHeights: rowHeights.slice(), balanced: false };
}

// Hauteur totale (mm) des lignes d'une page.
function pageHeight(page: PagePlan, rowHeights: number[]): number {
  let sum = 0;
  for (const idx of page.rows) sum += rowHeights[idx];
  return sum;
}

/**
 * Rééquilibre pour éviter une dernière page quasi vide (< 20 % de remplissage).
 *
 * Principe : si le document tient sur ≥ 2 pages et que la dernière page est
 * très peu remplie par rapport à la capacité moyenne des pages, on transfère
 * des lignes de l'avant-dernière page vers la dernière afin de répartir les
 * deux pages à ~50/50 en hauteur — sans jamais dépasser la capacité utile
 * (estimée comme la hauteur courante de l'avant-dernière page, qui a été
 * remplie au plus près de la capacité réelle).
 *
 * Retourne TOUJOURS un NOUVEAU PaginationPlan (immutabilité, `balanced:true`).
 *
 * Exemple : 12 lignes de 6.65 mm réparties [0..10] (11 lignes) / [11] (1 ligne).
 *   Dernière page = 6.65 mm ; capacité moyenne ≈ (11+1)×6.65 / 2 ≈ 39.9 mm.
 *   Ratio de remplissage ≈ 6.65 / 39.9 ≈ 0.17 < 0.20 → on rééquilibre :
 *   cible ≈ (73.15 + 6.65)/2 ≈ 39.9 mm sur la dernière page → ~6 lignes,
 *   résultat [0..5] / [6..11].
 */
export function balanceLastPages(plan: PaginationPlan): PaginationPlan {
  const { pages, rowHeights } = plan;

  // Rien à équilibrer avec moins de 2 pages.
  if (pages.length < 2) {
    return { pages: pages.map((p) => ({ rows: p.rows.slice() })), rowHeights: rowHeights.slice(), balanced: true };
  }

  const last = pages[pages.length - 1];
  const prev = pages[pages.length - 2];

  const lastH = pageHeight(last, rowHeights);
  const prevH = pageHeight(prev, rowHeights);

  // Capacité moyenne des pages du plan (référence de « page bien remplie »).
  const avgCapacity =
    pages.reduce((sum, p) => sum + pageHeight(p, rowHeights), 0) / pages.length;

  const fillRatio = avgCapacity > 0 ? lastH / avgCapacity : 1;

  // Dernière page suffisamment remplie → aucune action.
  if (fillRatio >= 0.2) {
    return { pages: pages.map((p) => ({ rows: p.rows.slice() })), rowHeights: rowHeights.slice(), balanced: true };
  }

  // Capacité utile approximée : l'avant-dernière page a été remplie au plus
  // près de la limite, donc sa hauteur actuelle est un bon plafond à ne pas
  // dépasser lorsqu'on lui retire des lignes (on reste largement en dessous).
  const capacityCeiling = prevH;

  // Fusionne les lignes des deux dernières pages puis re-répartit ~50/50.
  const combined = [...prev.rows, ...last.rows];
  const target = (prevH + lastH) / 2; // hauteur cible pour l'avant-dernière page

  const newPrev: number[] = [];
  let acc = 0;

  for (let k = 0; k < combined.length; k++) {
    const idx = combined[k];
    const h = rowHeights[idx];
    const remaining = combined.length - k; // lignes restantes (courante incluse)

    // On garde la ligne sur l'avant-dernière page tant que :
    //   - la cible ~50/50 n'est pas atteinte,
    //   - on ne dépasse pas le plafond de capacité,
    //   - il restera au moins une ligne pour la dernière page.
    const wouldReachTarget = acc + h > target;
    const wouldOverflow = acc + h > capacityCeiling;
    const mustLeaveOneForLast = remaining <= 1;

    if (newPrev.length > 0 && (wouldReachTarget || wouldOverflow || mustLeaveOneForLast)) {
      break;
    }

    newPrev.push(idx);
    acc += h;
  }

  const newLast = combined.slice(newPrev.length);

  // Garde-fou : si la re-répartition n'a rien produit de valide, on renvoie le
  // plan d'origine (copié) marqué équilibré.
  if (newPrev.length === 0 || newLast.length === 0) {
    return { pages: pages.map((p) => ({ rows: p.rows.slice() })), rowHeights: rowHeights.slice(), balanced: true };
  }

  const newPages: PagePlan[] = pages.slice(0, pages.length - 2).map((p) => ({ rows: p.rows.slice() }));
  newPages.push({ rows: newPrev });
  newPages.push({ rows: newLast });

  return { pages: newPages, rowHeights: rowHeights.slice(), balanced: true };
}
