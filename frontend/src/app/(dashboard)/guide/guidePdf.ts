'use client';
// ════════════════════════════════════════════════════════════════════════════
//  GÉNÉRATEUR PDF DU GUIDE UTILISATEUR SANTAREX ERP
//  - Produit le guide COMPLET dans la langue courante (fr / en) à partir de
//    la source unique `SECTIONS` (guideData.tsx).
//  - Structure : couverture › sommaire › chapitres (fiches numérotées, étapes,
//    astuces) › pied de page paginé.
//  - Rendu jsPDF (Helvetica / WinAnsi) ; les accents FR sont pris en charge et
//    on passe le texte par `sanitizeText` (src/lib/pdf/fonts) pour éviter tout
//    mojibake sur les symboles hors WinAnsi.
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import { SECTIONS, type Lang, type Fiche } from './guideData';
import { sanitizeText } from '@/lib/pdf/fonts';

// ─── Charte / constantes de mise en page (unité mm, A4 portrait) ──────────────
const BRAND = '#1565C0';          // Bleu SANTAREX
const BRAND_DARK = '#0A2E6E';     // Bleu foncé (couverture)
const INK = '#1A2332';            // Texte principal
const MUTED = '#546E7A';          // Texte secondaire
const HAIR = '#E0E8F0';           // Filets

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN_X = 20;
const MARGIN_TOP = 22;
const MARGIN_BOTTOM = 20;
const CONTENT_W = PAGE_W - MARGIN_X * 2;

// Conversion hex → triplet RGB pour jsPDF.
function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

// Traductions des libellés fixes du document.
const L = {
  fr: {
    title: 'Guide utilisateur',
    product: 'SANTAREX ERP',
    subtitle: 'IBIG Softwares — ERP hospitalier',
    editedOn: 'Édité le',
    summary: 'Sommaire',
    chapter: 'Chapitre',
    steps: 'Étapes',
    tip: 'Astuce',
    page: 'Page',
    of: 'sur',
    footer: 'Guide utilisateur SANTAREX ERP — IBIG Softwares',
  },
  en: {
    title: 'User Guide',
    product: 'SANTAREX ERP',
    subtitle: 'IBIG Softwares — Hospital ERP',
    editedOn: 'Issued on',
    summary: 'Table of Contents',
    chapter: 'Chapter',
    steps: 'Steps',
    tip: 'Tip',
    page: 'Page',
    of: 'of',
    footer: 'SANTAREX ERP User Guide — IBIG Softwares',
  },
} as const;

// ─── Point d'entrée : génère et déclenche le téléchargement du PDF ────────────
export async function genererGuidePdf(lang: Lang): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const t = L[lang];

  // État de pagination porté par une closure.
  let y = MARGIN_TOP;

  const S = (v: unknown) => sanitizeText(v);

  // ── Utilitaires de rendu ────────────────────────────────────────────────
  function setColor(hex: string) {
    const [r, g, b] = rgb(hex);
    doc.setTextColor(r, g, b);
  }
  function setFill(hex: string) {
    const [r, g, b] = rgb(hex);
    doc.setFillColor(r, g, b);
  }
  function setDraw(hex: string) {
    const [r, g, b] = rgb(hex);
    doc.setDrawColor(r, g, b);
  }

  // Nouvelle page + réinitialisation du curseur vertical.
  function newPage() {
    doc.addPage();
    y = MARGIN_TOP;
  }

  // Garantit `need` mm d'espace ; sinon saute à une nouvelle page.
  function ensure(need: number) {
    if (y + need > PAGE_H - MARGIN_BOTTOM) newPage();
  }

  // Écrit un bloc de texte multi-lignes avec wrap et gestion des sauts de page.
  function writeParagraph(
    text: string,
    opts: { size?: number; color?: string; bold?: boolean; lineH?: number; indent?: number } = {},
  ) {
    const size = opts.size ?? 10.5;
    const lineH = opts.lineH ?? size * 0.52;
    const indent = opts.indent ?? 0;
    const width = CONTENT_W - indent;
    doc.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    setColor(opts.color ?? INK);
    const lines: string[] = doc.splitTextToSize(S(text), width);
    for (const line of lines) {
      ensure(lineH + 1);
      doc.text(line, MARGIN_X + indent, y);
      y += lineH;
    }
  }

  // ── 1) PAGE DE COUVERTURE ───────────────────────────────────────────────
  function coverPage() {
    // Bandeau supérieur dégradé (simulé par deux aplats).
    setFill(BRAND_DARK);
    doc.rect(0, 0, PAGE_W, 120, 'F');
    setFill(BRAND);
    doc.rect(0, 96, PAGE_W, 24, 'F');

    // Pastille logo (carré arrondi clair).
    setFill('#FFFFFF');
    doc.roundedRect(MARGIN_X, 34, 22, 22, 4, 4, 'F');
    setColor(BRAND);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('S', MARGIN_X + 7.5, 49);

    // Titre principal.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(30);
    setColor('#FFFFFF');
    doc.text(S(t.title), MARGIN_X, 78);

    doc.setFontSize(26);
    doc.text(S(t.product), MARGIN_X, 92);

    // Sous-titre sur le bandeau clair.
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    setColor('#FFFFFF');
    doc.text(S(t.subtitle), MARGIN_X, 111);

    // Bloc méta sous le bandeau.
    const dateStr = new Date().toLocaleDateString(lang === 'fr' ? 'fr-FR' : 'en-GB', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
    setColor(MUTED);
    doc.setFontSize(11);
    doc.text(`${S(t.editedOn)} ${S(dateStr)}`, MARGIN_X, 140);

    doc.setFont('helvetica', 'bold');
    setColor(INK);
    doc.setFontSize(12);
    const nbChap = SECTIONS.length;
    const nbFiches = SECTIONS.reduce(
      (n, s) => n + (lang === 'fr' ? s.fr_content.length : s.en_content.length), 0,
    );
    const recap = lang === 'fr'
      ? `${nbChap} chapitres - ${nbFiches} fiches pratiques`
      : `${nbChap} chapters - ${nbFiches} how-to cards`;
    doc.text(S(recap), MARGIN_X, 150);

    // Filet de marque en bas de page.
    setDraw(BRAND);
    doc.setLineWidth(0.8);
    doc.line(MARGIN_X, PAGE_H - 24, PAGE_W - MARGIN_X, PAGE_H - 24);
    setColor(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(S(t.footer), MARGIN_X, PAGE_H - 18);
  }

  // ── 2) SOMMAIRE ─────────────────────────────────────────────────────────
  function tableOfContents() {
    newPage();
    // Titre de section.
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    setColor(BRAND);
    doc.text(S(t.summary), MARGIN_X, y);
    y += 4;
    setDraw(BRAND);
    doc.setLineWidth(0.6);
    doc.line(MARGIN_X, y, MARGIN_X + 40, y);
    y += 12;

    SECTIONS.forEach((s, i) => {
      ensure(9);
      const label = lang === 'fr' ? s.fr.titre : s.en.titre;
      const count = (lang === 'fr' ? s.fr_content : s.en_content).length;

      // Numéro dans une pastille.
      setFill(BRAND);
      doc.circle(MARGIN_X + 3, y - 1.4, 3, 'F');
      setColor('#FFFFFF');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text(String(i + 1), MARGIN_X + 3, y - 0.2, { align: 'center' });

      // Libellé du chapitre.
      setColor(INK);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11.5);
      doc.text(S(label), MARGIN_X + 10, y);

      // Nombre de fiches, aligné à droite.
      setColor(MUTED);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const suffix = lang === 'fr' ? `${count} fiches` : `${count} cards`;
      doc.text(S(suffix), PAGE_W - MARGIN_X, y, { align: 'right' });

      y += 9;
    });
  }

  // ── 3) CHAPITRE ─────────────────────────────────────────────────────────
  function renderChapter(index: number) {
    const s = SECTIONS[index];
    const meta = lang === 'fr' ? s.fr : s.en;
    const fiches: Fiche[] = lang === 'fr' ? s.fr_content : s.en_content;

    newPage();

    // Bandeau de titre de chapitre (aplat de marque).
    setFill(BRAND);
    doc.roundedRect(MARGIN_X, y - 6, CONTENT_W, 16, 2.5, 2.5, 'F');
    setColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${S(t.chapter)} ${index + 1}`, MARGIN_X + 5, y - 0.5);
    doc.setFontSize(14);
    doc.text(S(meta.titre), MARGIN_X + 5, y + 6);
    y += 16;

    // Description du chapitre.
    writeParagraph(meta.desc, { size: 10, color: MUTED });
    y += 4;

    // Fiches.
    fiches.forEach((f, i) => {
      renderFiche(f, i + 1);
    });
  }

  // ── Rendu d'une fiche : numéro + titre, texte, étapes, astuce ────────────
  function renderFiche(f: Fiche, num: number) {
    // On garde ensemble au moins l'en-tête + une ligne.
    ensure(16);
    y += 3;

    // Pastille numéro.
    setFill(BRAND);
    doc.circle(MARGIN_X + 3, y - 1.4, 3.1, 'F');
    setColor('#FFFFFF');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text(String(num), MARGIN_X + 3, y - 0.1, { align: 'center' });

    // Titre de la fiche.
    setColor(INK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    const titleLines: string[] = doc.splitTextToSize(S(f.titre), CONTENT_W - 10);
    titleLines.forEach((line, idx) => {
      if (idx > 0) ensure(6);
      doc.text(line, MARGIN_X + 10, y);
      y += 6;
    });
    y += 1;

    // Texte de la fiche.
    writeParagraph(f.texte, { size: 10.5, color: '#37474F', lineH: 5.4, indent: 10 });

    // Étapes numérotées (facultatif).
    if (f.etapes && f.etapes.length > 0) {
      y += 2;
      ensure(7);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      setColor(BRAND);
      doc.text(S(L[lang].steps), MARGIN_X + 10, y);
      y += 5;
      f.etapes.forEach((step, si) => {
        const prefix = `${si + 1}. `;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        setColor(BRAND);
        const bullet = S(prefix);
        // Largeur du préfixe pour aligner le texte enroulé.
        const bw = doc.getTextWidth(bullet);
        const textLines: string[] = doc.splitTextToSize(S(step), CONTENT_W - 14 - bw);
        textLines.forEach((line, li) => {
          ensure(5.2);
          if (li === 0) {
            setColor(BRAND);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(bullet, MARGIN_X + 12, y);
          }
          setColor('#37474F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          doc.text(line, MARGIN_X + 12 + bw, y);
          y += 5.2;
        });
      });
    }

    // Encadré astuce (facultatif).
    if (f.astuce) {
      y += 2.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.8);
      const tipLines: string[] = doc.splitTextToSize(S(f.astuce), CONTENT_W - 24);
      const boxH = tipLines.length * 4.8 + 8;
      ensure(boxH + 2);
      // Fond doux + barre de marque.
      setFill('#EAF2FB');
      doc.roundedRect(MARGIN_X + 10, y - 2, CONTENT_W - 10, boxH, 2, 2, 'F');
      setFill(BRAND);
      doc.rect(MARGIN_X + 10, y - 2, 1.6, boxH, 'F');
      // Libellé "Astuce".
      setColor(BRAND);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(S(L[lang].tip), MARGIN_X + 15, y + 3);
      // Texte de l'astuce.
      setColor('#334155');
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.8);
      let ty = y + 7.5;
      tipLines.forEach((line) => {
        doc.text(line, MARGIN_X + 15, ty);
        ty += 4.8;
      });
      y += boxH + 1;
    }

    // Séparateur léger entre fiches.
    y += 3;
    ensure(4);
    setDraw(HAIR);
    doc.setLineWidth(0.2);
    doc.line(MARGIN_X + 10, y, PAGE_W - MARGIN_X, y);
    y += 2;
  }

  // ── 4) PIEDS DE PAGE (après génération : numérotation) ───────────────────
  function paintFooters() {
    const total = doc.getNumberOfPages();
    for (let p = 2; p <= total; p++) {
      doc.setPage(p);
      setDraw(HAIR);
      doc.setLineWidth(0.2);
      doc.line(MARGIN_X, PAGE_H - 12, PAGE_W - MARGIN_X, PAGE_H - 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      setColor(MUTED);
      doc.text(S(t.footer), MARGIN_X, PAGE_H - 7);
      const pg = `${t.page} ${p} ${t.of} ${total}`;
      doc.text(S(pg), PAGE_W - MARGIN_X, PAGE_H - 7, { align: 'right' });
    }
  }

  // ── Orchestration ────────────────────────────────────────────────────────
  coverPage();
  tableOfContents();
  SECTIONS.forEach((_, i) => renderChapter(i));
  paintFooters();

  doc.save(`Guide-SANTAREX-${lang.toUpperCase()}.pdf`);
}
