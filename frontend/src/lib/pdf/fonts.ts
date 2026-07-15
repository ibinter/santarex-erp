// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Module : fonts.ts
//  Gestion de la police, mesure réelle du texte (mm) et sanitation des
//  caractères pour un rendu PDF sûr (jsPDF, unité mm, Helvetica/WinAnsi).
//
//  Contexte : jsPDF rend en WinAnsi (CP1252). Les emojis et symboles hors de
//  cette plage produisent du mojibake type « Ø=Ý4 ». `sanitizeText` remplace
//  ces caractères par des équivalents texte sûrs avant tout rendu.
//
//  ── Tests unitaires légers (entrée → sortie attendue de sanitizeText) ────────
//    sanitizeText(null)               === ''
//    sanitizeText(undefined)          === ''
//    sanitizeText(42)                 === '42'
//    sanitizeText('Résultat OK')      === 'Résultat OK'      (accents conservés)
//    sanitizeText('🔴 Critique')      === 'Critique'         (puce couleur retirée)
//    sanitizeText('Test ✓')           === 'Test OK'
//    sanitizeText('Statut ✗')         === 'Statut X'
//    sanitizeText('Statut ❌')         === 'Statut X'
//    sanitizeText('Alerte ⚠')         === 'Alerte !'
//    sanitizeText('A → B')            === 'A -> B'
//    sanitizeText('B ← A')            === 'B <- A'
//    sanitizeText('• point')          === '- point'
//    sanitizeText('🩸 Glycémie')       === 'Glycémie'
//    sanitizeText('📊 Rapport')        === 'Rapport'
//    sanitizeText('“Bonjour”')        === '"Bonjour"'        (guillemets normalisés)
//    sanitizeText('L’équipe')         === "L'équipe"         (apostrophe typographique)
//    sanitizeText('Total : 12 €')     === 'Total : 12 €'     (€, ° et % conservés)
//    sanitizeText('90°')              === '90°'
//    sanitizeText('50 %')             === '50 %'
//    sanitizeText('Coût — final')     === 'Coût — final'     (em-dash conservé)
//    sanitizeText('Ｆｕｌｌ')             === 'Full'             (translittération NFKD)
//    sanitizeText('a b')         === 'a b'              (NBSP → espace)
//    sanitizeText('a    b')           === 'a b'              (espaces multiples compactés)
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Measurer } from './types';

// ─── Préparation de la police du document ────────────────────────────────────
// Helvetica (WinAnsi) couvre le français et l'anglais. On la fixe comme police
// par défaut afin que toute mesure/rendu ultérieur parte d'un état connu.
export function registerFonts(doc: any): void {
  try {
    doc.setFont('helvetica', 'normal');
  } catch {
    /* jsPDF sans police disponible : on ignore, l'appelant gère le fallback. */
  }
}

// ─── Fabrique de mesureur lié au document ────────────────────────────────────
// Retourne une fonction qui mesure la largeur en mm d'un texte pour une taille
// (pt) et une graisse données. L'état de police (taille + style) est restauré
// après chaque mesure pour ne pas polluer le rendu en cours.
export function makeMeasurer(doc: any): Measurer {
  return (text: string, pt: number, bold = false): number => {
    const str = String(text ?? '');
    if (str.length === 0) return 0;

    const prevSize: number | undefined =
      typeof doc.getFontSize === 'function' ? doc.getFontSize() : undefined;
    // getFont() renvoie l'objet police courant ; on mémorise son style.
    let prevStyle: string | undefined;
    try {
      prevStyle = doc.getFont?.()?.fontStyle;
    } catch {
      prevStyle = undefined;
    }

    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(pt);

    // Le document étant en unité mm, getTextWidth renvoie déjà des mm.
    const w = doc.getTextWidth(str);

    // Restauration de l'état de police précédent.
    if (prevSize) doc.setFontSize(prevSize);
    if (prevStyle) {
      try {
        doc.setFont('helvetica', prevStyle);
      } catch {
        /* style inconnu : on laisse tel quel. */
      }
    }

    return w;
  };
}

// ─── Table de correspondances de sanitation (symboles → texte sûr) ───────────
// Chaque entrée est remplacée par un équivalent WinAnsi-safe. Remplacements
// caractère à caractère non chevauchants (l'ordre n'a pas d'importance ici).
const SYMBOL_MAP: Array<[RegExp, string]> = [
  // Puces / pastilles de couleur (🔴🟠🟡🟢🔵⚫⚪) → supprimées.
  [/[\u{1F534}\u{1F7E0}\u{1F7E1}\u{1F7E2}\u{1F535}\u{26AB}\u{26AA}]/gu, ''],
  // Coches (✓✔) → "OK".
  [/[✓✔]/gu, 'OK'],
  // Croix / échecs (✗✘❌) → "X".
  [/[✗✘\u{274C}]/gu, 'X'],
  // Avertissement (⚠, avec sélecteur de variante éventuel) → "!".
  [/[⚠]️?/gu, '!'],
  // Flèches → ASCII.
  [/[→]/gu, '->'], // →
  [/[←]/gu, '<-'], // ←
  // Puce ronde (•) → tiret.
  [/[•]/gu, '-'],
  // Pictos médicaux (🩸💊🧪) → supprimés.
  [/[\u{1FA78}\u{1F48A}\u{1F9EA}]/gu, ''],
  // Pictos documents (📄📊) → supprimés.
  [/[\u{1F4C4}\u{1F4CA}]/gu, ''],
];

// ─── Ponctuation typographique → équivalents ASCII/WinAnsi sûrs ──────────────
const PUNCT_MAP: Array<[RegExp, string]> = [
  // Guillemets courbes doubles (“ ”) → guillemet droit.
  [/[“”]/g, '"'],
  // Guillemets/apostrophes courbes simples + apostrophe typographique (‘ ’ ‚ ′) → '.
  [/[‘’‚′]/g, "'"],
  // Espaces insécables et fins (NBSP, NNBSP, thin/figure/hair spaces, BOM) → espace.
  [/[     ﻿]/g, ' '],
];

// ─── Sanitation d'une valeur pour rendu PDF ──────────────────────────────────
export function sanitizeText(s: unknown): string {
  let out = String(s ?? '');
  if (out.length === 0) return '';

  // 1) Symboles / emojis → équivalents texte.
  for (const [re, rep] of SYMBOL_MAP) out = out.replace(re, rep);

  // 2) Ponctuation typographique → ASCII sûr.
  for (const [re, rep] of PUNCT_MAP) out = out.replace(re, rep);

  // 3) Caractères restants hors WinAnsi → translittération ASCII ou suppression.
  //    On conserve tout ce qui est WinAnsi (accents latins, €, °, %, —, …) et
  //    on ne traite que ce qui dépasse la plage sûre.
  out = out.replace(/[\s\S]/gu, (ch) => {
    const cp = ch.codePointAt(0) ?? 0;
    if (isWinAnsiSafe(cp)) return ch;

    // Tentative de translittération (décompose accents/formes compatibles).
    const translit = ch
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '') // diacritiques combinants
      .replace(/[^\x20-\x7E]/g, '');   // ne garde que l'ASCII imprimable résultant

    return translit; // '' si rien d'exploitable → jamais de mojibake.
  });

  // 4) Compactage des espaces multiples résiduels (contenu préservé) puis
  //    suppression des espaces de bord laissés par un symbole retiré.
  out = out.replace(/ {2,}/g, ' ').trim();

  return out;
}

// ─── Détermine si un code point est rendu sans risque en WinAnsi/Helvetica ────
function isWinAnsiSafe(cp: number): boolean {
  // Blancs utiles conservés (tab, LF, CR).
  if (cp === 0x09 || cp === 0x0a || cp === 0x0d) return true;
  // ASCII imprimable.
  if (cp >= 0x20 && cp <= 0x7e) return true;

  // Latin-1 supplément (accents é è à ç ù …, °, €… hors zone de contrôle C1).
  // On saute 0x80–0x9F (contrôles C1 non imprimables).
  if (cp >= 0xa0 && cp <= 0xff) return true;

  // Caractères WinAnsi (CP1252) explicitement autorisés au-delà de Latin-1 :
  switch (cp) {
    case 0x20ac: // €
    case 0x2014: // — em-dash
    case 0x2013: // – en-dash
    case 0x2026: // … points de suspension
    case 0x2122: // ™
    case 0x2030: // ‰
      return true;
    default:
      return false;
  }
}
