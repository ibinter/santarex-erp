// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Module : render.ts
//  Rendu visuel du PDF (jsPDF, unité mm) : header 1ʳᵉ page complet, header de
//  continuation compact, footer, cartes de stats, tableau (jspdf-autotable) et
//  fiche individuelle. Les LARGEURS / POLICE / MARGES sont IMPOSÉES par le
//  moteur de layout (LayoutDecision) — ce module ne décide de rien, il dessine.
//
//  Contrat : voir ./types.ts. Dépendances internes injectées via ./fonts.
//
//  ── Anti-doublon du header sur la 1ʳᵉ page ───────────────────────────────────
//  jspdf-autotable appelle `didDrawPage` AU DÉBUT de chaque page, AVANT de
//  poser le contenu du tableau. On ne dessine donc JAMAIS le header à la main
//  avant `autoTable`. Le `startY` de la 1ʳᵉ page est calculé à partir des
//  HAUTEURS FIXES connues (header = 55 mm, +24 mm si cartes de stats), sans rien
//  peindre. Le header 1ʳᵉ page (et les cartes) sont dessinés UNE SEULE FOIS,
//  depuis `didDrawPage` quand `pageNumber === 1`. Les pages suivantes reçoivent
//  le header COMPACT de continuation ; l'espace leur est réservé par
//  `margin.top = 20` (hauteur du bandeau de continuation).
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { LayoutDecision, DocumentDefinition, StatBox, FicheSection } from './types';
import { registerFonts, makeMeasurer, sanitizeText } from './fonts';
import { abbreviateHeader } from './columns';

// ─── Constantes de hauteur (mm) — cohérentes avec le moteur de pagination ────
const HEADER_FIRST_H = 55;   // Y de reprise après le grand header (~50 mm dessinés).
const HEADER_CONT_H = 20;    // Y de reprise après le header compact (~16 mm dessinés).
const STATS_H = 24;          // hauteur totale d'une rangée de cartes de stats.
const FOOTER_H = 10;         // hauteur de la bande de pied de page.

// Palette (identité visuelle SANTAREX / IBIG Soft).
const NAVY: [number, number, number] = [10, 23, 48];
const BLUE: [number, number, number] = [37, 99, 235];
const LIGHT: [number, number, number] = [241, 245, 249];
const CARD_BG: [number, number, number] = [248, 250, 252];
const SLATE_900: [number, number, number] = [15, 23, 42];
const SLATE_700: [number, number, number] = [30, 41, 59];
const SLATE_500: [number, number, number] = [100, 116, 139];
const SLATE_400: [number, number, number] = [148, 163, 184];
const BLUE_LIGHT: [number, number, number] = [148, 180, 230];
const BLUE_SOFT: [number, number, number] = [180, 205, 240];

function pageW(doc: any): number { return doc.internal.pageSize.getWidth?.() ?? doc.internal.pageSize.width; }
function pageH(doc: any): number { return doc.internal.pageSize.getHeight?.() ?? doc.internal.pageSize.height; }

function todayFR(withTime = false): string {
  const d = new Date();
  return withTime
    ? d.toLocaleDateString('fr-FR')
    : d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Header 1ʳᵉ page (complet) ───────────────────────────────────────────────
// Bandeau marine (identité SANTAREX / IBIG Soft) + bande claire avec le TITRE.
// ~50 mm dessinés, renvoie 55 (Y de reprise, avec une respiration de 5 mm).
export function drawFirstPageHeader(
  doc: any,
  decision: LayoutDecision,
  title: string,
  subtitle?: string,
): number {
  const pw = pageW(doc);
  const mL = decision.margins.left;
  const mR = decision.margins.right;

  // Bandeau marine (0 → 30 mm).
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 30, 'F');

  // Accent bleu à gauche.
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 5, 30, 'F');

  // Identité.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.setTextColor(255, 255, 255);
  doc.text('SANTAREX', mL, 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...BLUE_LIGHT);
  doc.text('ERP · Logiciel de Gestion Hospitalière · IBIG Soft', mL, 19);

  // Date + mention (à droite).
  doc.setFontSize(7.5);
  doc.setTextColor(...BLUE_SOFT);
  doc.text(todayFR(), pw - mR, 12, { align: 'right' });
  doc.text('Document généré automatiquement', pw - mR, 19, { align: 'right' });

  // Bande claire (30 → 50 mm) + accent.
  doc.setFillColor(...LIGHT);
  doc.rect(0, 30, pw, 20, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 30, 5, 20, 'F');

  // Titre (majuscules).
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(...SLATE_900);
  doc.text(sanitizeText(title).toUpperCase(), mL, subtitle ? 41 : 43);

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...SLATE_500);
    doc.text(sanitizeText(subtitle), mL, 47);
  }

  return HEADER_FIRST_H;
}

// ─── Header de continuation (compact, pages > 1) ─────────────────────────────
// Fine bande marine de 12 mm avec « SANTAREX — <titre abrégé> — Suite ».
// La pagination « Page X / Y » N'est PAS ici (elle vit dans le footer).
// Renvoie ~20 (aligné sur margin.top d'autoTable).
export function drawContinuationHeader(
  doc: any,
  decision: LayoutDecision,
  title: string,
  ref?: string,
): number {
  const pw = pageW(doc);
  const mL = decision.margins.left;
  const mR = decision.margins.right;

  // Fine bande marine (0 → 12 mm) + accent bleu.
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pw, 12, 'F');
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, 4, 12, 'F');

  // Titre abrégé pour ne jamais déborder sur la référence de droite.
  const clean = sanitizeText(title);
  const short = clean.length > 46 ? clean.slice(0, 45).trimEnd() + '…' : clean;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`SANTAREX — ${short} — Suite`, mL, 7.8);

  if (ref) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...BLUE_SOFT);
    doc.text(sanitizeText(ref), pw - mR, 7.8, { align: 'right' });
  }

  return HEADER_CONT_H;
}

// ─── Footer (compact, toutes pages) ──────────────────────────────────────────
// Bande claire + ligne fine : « Page X / Y » (g), mention centrée, date (d).
export function drawFooter(
  doc: any,
  decision: LayoutDecision,
  pageNum: number,
  pageCount: number,
  ref?: string,
): void {
  const pw = pageW(doc);
  const ph = pageH(doc);
  const mL = decision.margins.left;
  const mR = decision.margins.right;
  const top = ph - FOOTER_H;
  const baseline = ph - 3.8;

  // Bande claire + filet supérieur.
  doc.setFillColor(...CARD_BG);
  doc.rect(0, top, pw, FOOTER_H, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(0, top, pw, top);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(...SLATE_400);

  // Pagination (gauche).
  doc.text(`Page ${pageNum} / ${pageCount}`, mL, baseline);

  // Mention (centre).
  doc.text('SANTAREX ERP — Confidentiel — © IBIG Soft', pw / 2, baseline, { align: 'center' });

  // Date + référence éventuelle (droite).
  const right = ref ? `${sanitizeText(ref)}  ·  ${todayFR(true)}` : todayFR(true);
  doc.text(right, pw - mR, baseline, { align: 'right' });
}

// ─── Cartes de statistiques ──────────────────────────────────────────────────
// Boîtes arrondies claires, accent couleur à gauche, valeur en gras couleur,
// label en majuscules gris. Réparties sur decision.usableWidth. Renvoie +24.
export function drawStatBoxes(
  doc: any,
  decision: LayoutDecision,
  stats: StatBox[],
  startY: number,
): number {
  const n = stats.length;
  if (n === 0) return startY;

  const x0 = decision.margins.left;
  const totalW = decision.usableWidth;
  const gap = 6;
  const boxW = (totalW - gap * (n - 1)) / n;
  const boxH = 18;

  stats.forEach((s, i) => {
    const x = x0 + i * (boxW + gap);
    const color = s.color ?? BLUE;

    // Fond de carte.
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(x, startY, boxW, boxH, 2, 2, 'F');

    // Accent couleur à gauche (arrondi côté gauche, carré côté droit).
    doc.setFillColor(...color);
    doc.roundedRect(x, startY, 3, boxH, 1, 1, 'F');
    doc.rect(x + 1.5, startY, 1.5, boxH, 'F');

    // Valeur.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...color);
    doc.text(sanitizeText(s.value), x + 7, startY + 10);

    // Label.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...SLATE_500);
    doc.text(sanitizeText(s.label).toUpperCase(), x + 7, startY + 15.5);
  });

  return startY + STATS_H;
}

// ─── Rendu complet d'un tableau (cœur du module) ─────────────────────────────
export async function renderTableDocument(
  doc: any,
  def: DocumentDefinition,
  decision: LayoutDecision,
): Promise<void> {
  registerFonts(doc);
  const measure = makeMeasurer(doc);
  const autoTable = (await import('jspdf-autotable')).default;

  const stats = def.options?.stats ?? [];
  const hasStats = stats.length > 0;

  // En-têtes : abrégés (jamais coupés en plein mot) + sanitisés, sans emoji.
  const head = [decision.columns.map((c) =>
    sanitizeText(abbreviateHeader(c.headerLabel, c.width, measure, decision.headerFontSize)),
  )];

  // Corps : une cellule par colonne décidée ; « — » pour les valeurs absentes.
  const body =
    def.rows.length > 0
      ? def.rows.map((r) =>
          decision.columns.map((c) => sanitizeText((r as any)[c.def.dataKey] ?? '—')),
        )
      : [decision.columns.map(() => '—')];

  // startY 1ʳᵉ page : calculé sur des hauteurs FIXES, sans rien dessiner
  // (le header/les cartes sont peints dans didDrawPage → aucun doublon).
  const startY = HEADER_FIRST_H + (hasStats ? STATS_H : 0);

  // columnStyles : largeur / alignement / débordement décidés par le moteur.
  const columnStyles: Record<number, any> = {};
  decision.columns.forEach((c, i) => {
    columnStyles[i] = {
      cellWidth: c.width,
      halign: c.align,
      overflow: c.nowrap ? 'ellipsize' : 'linebreak',
    };
  });

  autoTable(doc, {
    startY,
    head,
    body,
    margin: {
      left: decision.margins.left,
      right: decision.margins.right,
      top: HEADER_CONT_H,                        // réserve la place du header compact (pages > 1).
      bottom: decision.margins.bottom + 10,      // réserve la place du footer.
    },
    tableWidth: decision.tableWidth,
    styles: {
      font: 'helvetica',
      fontSize: decision.fontSize,
      cellPadding: { top: 2.2, bottom: 2.2, left: 2.5, right: 2.5 },
      overflow: 'linebreak',
      textColor: [30, 41, 59],
      lineColor: [236, 240, 247],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [10, 23, 48],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: decision.headerFontSize,
      halign: 'left',
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles,
    showHead: 'everyPage',
    didDrawPage: (data: any) => {
      const pageCount = (doc.internal as any).getNumberOfPages();
      if (data.pageNumber === 1) {
        // Grand header 1ʳᵉ page + cartes — dessinés UNE SEULE FOIS ici.
        drawFirstPageHeader(doc, decision, def.title, def.options?.subtitle);
        if (hasStats) drawStatBoxes(doc, decision, stats, HEADER_FIRST_H);
      } else {
        // Header COMPACT de continuation sur les pages suivantes.
        drawContinuationHeader(doc, decision, def.title, def.options?.documentRef);
      }
      drawFooter(doc, decision, data.pageNumber, pageCount, def.options?.documentRef);
    },
  });

  // Pas de doc.save ici : l'orchestrateur (index.ts) déclenche le téléchargement.
}

// ─── Rendu d'une fiche individuelle ──────────────────────────────────────────
// Header 1ʳᵉ page, puis sections (bandeau + accent), champs sur 2 colonnes.
// keepTogether : jamais un titre de section seul en bas de page.
export function renderFiche(
  doc: any,
  title: string,
  sections: FicheSection[],
  ref?: string,
): void {
  registerFonts(doc);

  // Décision minimale (marges A4) — les fonctions de header/footer n'en
  // utilisent que margins/usableWidth ; on caste pour satisfaire le contrat.
  const pw = pageW(doc);
  const ph = pageH(doc);
  const mL = 13;
  const mR = 13;
  const decision = {
    margins: { top: HEADER_CONT_H, right: mR, bottom: FOOTER_H, left: mL },
    usableWidth: pw - mL - mR,
  } as unknown as LayoutDecision;

  const bottomLimit = ph - FOOTER_H - 6;
  const rowH = 9;         // pas vertical d'un champ.
  const secHeadH = 12;    // hauteur d'un bandeau de section (titre → 1er champ).

  drawFirstPageHeader(doc, decision, title);
  let y = HEADER_FIRST_H + 5;

  const newPage = () => {
    doc.addPage();
    drawContinuationHeader(doc, decision, title, ref);
    y = HEADER_CONT_H + 4;
  };

  for (const section of sections) {
    const nFields = section.fields.length;
    const colCount = Math.ceil(nFields / 2);           // hauteur = nb de lignes de la colonne gauche.

    // keepTogether : le titre + au moins 2 champs (ou tous si <2) doivent tenir.
    const needAfterTitle = Math.min(colCount, 2) * rowH;
    if (y + secHeadH + needAfterTitle > bottomLimit) {
      newPage();
    }

    // Bandeau de section.
    doc.setFillColor(237, 242, 251);
    doc.rect(mL, y - 1, pw - mL - mR, 8, 'F');
    doc.setFillColor(...BLUE);
    doc.rect(mL, y - 1, 3, 8, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...BLUE);
    doc.text(sanitizeText(section.label).toUpperCase(), mL + 6, y + 4.5);
    y += secHeadH;

    // Champs sur 2 colonnes (colonne gauche remplie d'abord).
    const half = pw / 2;
    for (let i = 0; i < nFields; i++) {
      const f = section.fields[i];
      const isLeft = i < colCount;
      const row = isLeft ? i : i - colCount;
      const x = isLeft ? mL : half + 5;
      const fy = y + row * rowH;

      // Saut de page si la ligne déborde (rare : sections très longues).
      if (fy + 2 > bottomLimit) {
        newPage();
        // On repositionne la suite à partir du haut de page.
        // (Cas limite : on continue simplement les champs restants.)
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...SLATE_500);
      doc.text(sanitizeText(f.key) + ' :', x, fy);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(...SLATE_900);
      doc.text(sanitizeText(f.value || '—'), x + 36, fy);

      // Filet clair sous le champ.
      doc.setDrawColor(...LIGHT);
      doc.setLineWidth(0.2);
      doc.line(x, fy + 2, isLeft ? half - 5 : pw - mR, fy + 2);
    }

    y += colCount * rowH + 8;
  }

  // Footer sur toutes les pages générées.
  const pageCount = (doc.internal as any).getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    drawFooter(doc, decision, p, pageCount, ref);
  }
}
