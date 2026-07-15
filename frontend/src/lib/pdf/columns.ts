// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT — CALCULATEUR DE LARGEURS DE COLONNES
//  Mesure réelle du contenu (P90), règles par type, distribution flex,
//  abréviation d'en-tête sans casser les mots. Unité : millimètres (mm).
//
//  Fonctions PURES — aucun effet de bord, aucun accès DOM. La mesure du texte
//  est injectée via `Measurer` (module fonts).
// ════════════════════════════════════════════════════════════════════════════

import type {
  ColumnDef,
  ColumnType,
  ColumnPriority,
  ColumnRules,
  ColumnLayout,
  DocumentLayoutAnalysis,
  ExportRow,
  Measurer,
  CellAlign,
} from './types';

// ─── Règles de dimensionnement par type (mm, calibrées à ~8.5pt) ─────────────
//  min/max : bornes de largeur ; flex : poids de distribution de l'espace
//  restant ; align : alignement par défaut ; nowrap : interdiction de wrap.
//  Barème : colonnes textuelles larges & flex élevé (elles absorbent l'espace
//  libre), colonnes courtes/codées étroites & nowrap (elles restent compactes).
export const COLUMN_RULES: ColumnRules = {
  id:              { min: 18, max: 32, flex: 1,   align: 'left',   nowrap: true },
  reference:       { min: 24, max: 40, flex: 1,   align: 'left',   nowrap: true },
  name:            { min: 24, max: 52, flex: 2,   align: 'left',   nowrap: false },
  firstname:       { min: 22, max: 46, flex: 2,   align: 'left',   nowrap: false },
  email:           { min: 40, max: 80, flex: 3,   align: 'left',   nowrap: true },
  phone:           { min: 26, max: 38, flex: 1,   align: 'left',   nowrap: true },
  date:            { min: 22, max: 30, flex: 1,   align: 'center', nowrap: true },
  datetime:        { min: 32, max: 44, flex: 1,   align: 'center', nowrap: true },
  amount:          { min: 24, max: 40, flex: 1,   align: 'right',  nowrap: true },
  percent:         { min: 16, max: 24, flex: 0.5, align: 'right',  nowrap: true },
  status:          { min: 20, max: 34, flex: 1,   align: 'center', nowrap: true },
  code:            { min: 20, max: 34, flex: 1,   align: 'left',   nowrap: true },
  'short-code':    { min: 14, max: 22, flex: 0.5, align: 'center', nowrap: true },
  boolean:         { min: 16, max: 24, flex: 0.5, align: 'center', nowrap: true },
  'boolean-short': { min: 14, max: 20, flex: 0.5, align: 'center', nowrap: true },
  quantity:        { min: 16, max: 26, flex: 0.5, align: 'right',  nowrap: true },
  'short-text':    { min: 26, max: 60, flex: 2,   align: 'left',   nowrap: false },
  'long-text':     { min: 40, max: 90, flex: 4,   align: 'left',   nowrap: false },
  list:            { min: 30, max: 70, flex: 3,   align: 'left',   nowrap: false },
  text:            { min: 24, max: 60, flex: 2,   align: 'left',   nowrap: false },
};

// Priorité par défaut selon le type — utilisée quand def.priority est absent.
// Sert au layout engine à décider quelles colonnes sacrifier/tronquer.
const PRIORITY_BY_TYPE: Record<ColumnType, ColumnPriority> = {
  id:              'important',
  reference:       'essential',
  name:            'essential',
  firstname:       'essential',
  email:           'secondary',
  phone:           'secondary',
  date:            'important',
  datetime:        'important',
  amount:          'essential',
  percent:         'secondary',
  status:          'important',
  code:            'important',
  'short-code':    'secondary',
  boolean:         'optional',
  'boolean-short': 'optional',
  quantity:        'important',
  'short-text':    'secondary',
  'long-text':     'secondary',
  list:            'secondary',
  text:            'secondary',
};

// Types considérés « textuels » : ce sont eux qui absorbent l'espace libre
// résiduel (étape 4 du solveur) pour remplir la largeur de page.
const TEXT_FILL_TYPES: ReadonlySet<ColumnType> = new Set<ColumnType>([
  'name', 'firstname', 'long-text', 'email', 'text', 'short-text', 'list',
]);

const HEADER_PADDING_MM = 8; // marge horizontale interne (gauche+droite) d'une cellule
const WORD_PADDING_MM = 6;   // marge ajoutée à la largeur du mot le plus long
const EPS = 1e-6;

// ─── Utilitaires internes (purs) ─────────────────────────────────────────────

/** Normalise une chaîne : minuscules + suppression des accents (pour matching). */
function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/** Convertit une valeur de cellule en texte mesurable (sans effet de bord). */
function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  return String(value);
}

/** 90ᵉ percentile d'une liste de nombres (0 si vide). Ne dimensionne pas sur
 *  une valeur aberrante contrairement au max. */
function percentile90(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.max(0, Math.ceil(0.9 * sorted.length) - 1);
  return sorted[idx];
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Largeur mesurée du plus long MOT d'un libellé (graisse gras). Garantit
 *  qu'une colonne peut afficher au moins ce mot sans coupure intra-mot. */
function longestWordWidth(label: string, measure: Measurer, fontPt: number): number {
  const words = label.split(/\s+/).filter((w) => w.length > 0);
  let max = 0;
  for (const w of words) {
    const width = measure(w, fontPt, true);
    if (width > max) max = width;
  }
  return max;
}

// ─── Table d'abréviations d'en-têtes (centralisée) ───────────────────────────
const HEADER_ABBREVIATIONS: Record<string, string> = {
  'Téléphone': 'Tél.',
  'Groupe sanguin': 'Groupe',
  'Numéro de demande': 'N° demande',
  'Date de naissance': 'Naissance',
  'Date & Heure': 'Date/H',
  'Pourcentage': '%',
  'Référence': 'Réf.',
  'Diagnostic': 'Diagnostic',
  'Consultation': 'Consult.',
};

// ─── Règles d'inférence par mots-clés (ordre = priorité) ─────────────────────
//  NB : `firstname` (prenom) AVANT `name` car « prenom » contient « nom » ;
//       `datetime` (heure) AVANT `date` car « Date & Heure » contient « date ».
const KEYWORD_RULES: ReadonlyArray<{ re: RegExp; type: ColumnType }> = [
  { re: /(ipp|n°|numero|reference|ref)/, type: 'reference' },
  { re: /(prenom|firstname)/, type: 'firstname' },
  { re: /(nom|lastname)/, type: 'name' },
  { re: /(email|mail)/, type: 'email' },
  { re: /(tel|phone)/, type: 'phone' },
  { re: /(datetime|heure)/, type: 'datetime' },
  { re: /(naissance|date)/, type: 'date' },
  { re: /(montant|prix|total|amount|xof)/, type: 'amount' },
  { re: /(%|pourcent|taux|percent)/, type: 'percent' },
  { re: /(statut|status|etat)/, type: 'status' },
  { re: /(sexe|genre)/, type: 'boolean-short' },
  { re: /(groupe|code)/, type: 'short-code' },
  { re: /(urgence|oui|non)/, type: 'boolean' },
  { re: /(quantite|qte|stock)/, type: 'quantity' },
  { re: /(motif|diagnostic|description|analyses|libelle|objet|notes)/, type: 'long-text' },
];

// ════════════════════════════════════════════════════════════════════════════
//  API PUBLIQUE
// ════════════════════════════════════════════════════════════════════════════

/**
 * Détermine le type d'une colonne. Si `def.type` est fourni, il fait autorité.
 * Sinon inférence par mots-clés du header/dataKey (insensible casse/accents),
 * puis à défaut par échantillonnage de la longueur moyenne du contenu.
 */
export function inferColumnType(def: ColumnDef, rows: ExportRow[]): ColumnType {
  if (def.type) return def.type;

  const haystack = `${normalize(def.header)} ${normalize(def.dataKey)}`;
  for (const { re, type } of KEYWORD_RULES) {
    if (re.test(haystack)) return type;
  }

  // Échantillonnage du contenu : longueur moyenne des valeurs.
  let total = 0;
  let count = 0;
  for (const row of rows) {
    const s = cellToString(row[def.dataKey]);
    if (s.length === 0) continue;
    total += s.length;
    count += 1;
  }
  const avg = count > 0 ? total / count : 0;
  if (count === 0) return 'text';
  if (avg < 6) return 'short-text';
  if (avg > 30) return 'long-text';
  return 'text';
}

/**
 * Renvoie un libellé d'en-tête tenant dans `maxWidthMm`.
 *  1. Si le libellé complet tient → renvoyé tel quel.
 *  2. Sinon, si une abréviation connue tient → l'abréviation.
 *  3. Sinon → libellé complet SANS coupure intra-mot (le wrap sur espace est
 *     laissé au moteur de rendu ; garantir une largeur mini suffisante pour le
 *     plus long mot est du ressort du solveur).
 */
export function abbreviateHeader(
  label: string,
  maxWidthMm: number,
  measure: Measurer,
  fontPt: number,
): string {
  if (measure(label, fontPt, true) <= maxWidthMm) return label;

  const abbrev = HEADER_ABBREVIATIONS[label];
  if (abbrev !== undefined && measure(abbrev, fontPt, true) <= maxWidthMm) {
    return abbrev;
  }

  // Aucune coupure au milieu d'un mot : on rend le libellé complet.
  return label;
}

/**
 * Analyse un jeu (colonnes + lignes) : type, règle, alignement, nowrap, et
 * largeurs caractéristiques (naturelle basée sur le P90, minimale avant wrap).
 * Le libellé conservé ici est COMPLET ; l'abréviation finale est décidée au
 * fit/rendu selon la largeur réellement allouée.
 */
export function analyzeColumns(
  columns: ColumnDef[],
  rows: ExportRow[],
  measure: Measurer,
  fontPt: number,
): DocumentLayoutAnalysis {
  const layouts: ColumnLayout[] = columns.map((def) => {
    const type = inferColumnType(def, rows);
    const rule = COLUMN_RULES[type];

    const headerLabel = def.header;
    const align: CellAlign = def.align ?? rule.align;
    const nowrap: boolean = def.nowrap ?? rule.nowrap;
    const priority: ColumnPriority = def.priority ?? PRIORITY_BY_TYPE[type];

    // Largeur de l'en-tête (gras) et P90 des largeurs de contenu.
    const headerWidth = measure(headerLabel, fontPt, true);
    const contentWidths: number[] = [];
    for (const row of rows) {
      const s = cellToString(row[def.dataKey]);
      contentWidths.push(measure(s, fontPt, false));
    }
    const p90Content = percentile90(contentWidths);

    // Largeur idéale sans wrap : max(header, P90 contenu) + padding, bornée.
    const naturalWidth = clamp(
      Math.max(headerWidth, p90Content) + HEADER_PADDING_MM,
      rule.min,
      rule.max,
    );

    // Largeur mini : doit contenir le plus long mot du header ; et si nowrap,
    // au moins le P90 du contenu (borné au max de la règle).
    const wordFloor = longestWordWidth(headerLabel, measure, fontPt) + WORD_PADDING_MM;
    let minWidth = Math.max(rule.min, wordFloor);
    if (nowrap) {
      minWidth = Math.max(minWidth, Math.min(p90Content, rule.max) + WORD_PADDING_MM);
    }

    return {
      def,
      type,
      priority,
      headerLabel,
      align,
      nowrap,
      naturalWidth,
      minWidth,
      width: 0, // rempli par fitColumns
    };
  });

  const estimatedNaturalWidth = layouts.reduce((s, c) => s + c.naturalWidth, 0);
  const estimatedCompactWidth = layouts.reduce((s, c) => s + c.minWidth, 0);

  return {
    rowCount: rows.length,
    columnCount: columns.length,
    columns: layouts,
    estimatedNaturalWidth,
    estimatedCompactWidth,
  };
}

/**
 * Résout les largeurs finales pour une largeur utile donnée.
 *  1. Part des minWidth.
 *  2. Si Σmin > usableWidth : renvoie tel quel (le layout engine changera de
 *     format en détectant le dépassement).
 *  3. Sinon distribue `remaining = usableWidth - Σmin` proportionnellement au
 *     flex, en bornant chaque colonne à son max (règle). Itération : les
 *     colonnes saturées à max sont figées, le reste est redistribué aux autres.
 *  4. S'il reste de l'espace (tout saturé) : on l'attribue aux colonnes
 *     textuelles au plus fort flex, au-delà de leur max, pour REMPLIR la page.
 *  Ne modifie pas `headerLabel` (l'abréviation finale est faite au rendu, qui
 *  possède le `measure`).
 */
export function fitColumns(
  analysis: DocumentLayoutAnalysis,
  usableWidth: number,
): ColumnLayout[] {
  const cols = analysis.columns;
  const n = cols.length;

  const widths = cols.map((c) => c.minWidth);
  const sumMin = widths.reduce((a, b) => a + b, 0);

  // Étape 2 : dépassement — on ne peut pas remplir, on rend le compact.
  if (n === 0 || sumMin >= usableWidth) {
    return cols.map((c, i) => ({ ...c, width: widths[i] }));
  }

  const caps = cols.map((c) => Math.max(COLUMN_RULES[c.type].max, c.minWidth));
  const flex = cols.map((c) => COLUMN_RULES[c.type].flex);
  const saturated = cols.map((_, i) => widths[i] >= caps[i] - EPS);

  let remaining = usableWidth - sumMin;

  // Étape 3 : distribution flex itérative, bornée au max.
  let guard = 0;
  while (remaining > EPS && guard < 1000) {
    guard += 1;

    let totalFlex = 0;
    const active: number[] = [];
    for (let i = 0; i < n; i++) {
      if (!saturated[i] && flex[i] > 0) {
        active.push(i);
        totalFlex += flex[i];
      }
    }
    if (active.length === 0 || totalFlex <= 0) break;

    let distributed = 0;
    let anySaturated = false;
    for (const i of active) {
      const share = remaining * (flex[i] / totalFlex);
      const room = caps[i] - widths[i];
      if (share >= room - EPS) {
        widths[i] = caps[i];
        saturated[i] = true;
        distributed += room;
        anySaturated = true;
      } else {
        widths[i] += share;
        distributed += share;
      }
    }
    remaining -= distributed;

    // Aucune saturation ce tour : tout l'espace a été absorbé, terminé.
    if (!anySaturated) {
      remaining = 0;
      break;
    }
  }

  // Étape 4 : reste après saturation générale → remplir via colonnes textuelles.
  if (remaining > EPS) {
    const idxs: number[] = [];
    let totalFlex = 0;
    for (let i = 0; i < n; i++) {
      if (TEXT_FILL_TYPES.has(cols[i].type)) {
        idxs.push(i);
        totalFlex += flex[i];
      }
    }
    // Aucune colonne textuelle : on remplit toutes les colonnes.
    if (idxs.length === 0) {
      for (let i = 0; i < n; i++) {
        idxs.push(i);
        totalFlex += flex[i];
      }
    }
    if (totalFlex > 0) {
      for (const i of idxs) widths[i] += remaining * (flex[i] / totalFlex);
    } else if (idxs.length > 0) {
      const add = remaining / idxs.length;
      for (const i of idxs) widths[i] += add;
    }
    remaining = 0;
  }

  return cols.map((c, i) => ({ ...c, width: widths[i] }));
}
