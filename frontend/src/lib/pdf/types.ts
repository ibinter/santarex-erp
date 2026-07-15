// ════════════════════════════════════════════════════════════════════════════
//  MOTEUR UNIVERSEL D'EXPORT DOCUMENTAIRE — IBIG SOFT
//  Contrat partagé (types + signatures des fonctions pures).
//  Chaque module implémente sa partie contre ce contrat, sans dépendre de
//  l'implémentation des autres (dépendances injectées : voir `Measurer`).
//  Unité de mesure : millimètres (mm). Police : jsPDF (WinAnsi/Helvetica).
// ════════════════════════════════════════════════════════════════════════════

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Types de données de colonne ─────────────────────────────────────────────
export type ColumnType =
  | 'id'
  | 'reference'
  | 'name'
  | 'firstname'
  | 'email'
  | 'phone'
  | 'date'
  | 'datetime'
  | 'amount'
  | 'percent'
  | 'status'
  | 'code'
  | 'short-code'
  | 'boolean'
  | 'boolean-short'
  | 'quantity'
  | 'short-text'
  | 'long-text'
  | 'list'
  | 'text';

export type ColumnPriority = 'essential' | 'important' | 'secondary' | 'optional';

export type CellAlign = 'left' | 'center' | 'right';

// Définition d'une colonne fournie par un module métier.
// `dataKey`/`header`/`width` restent compatibles avec l'ancien PdfColumn.
export interface ColumnDef {
  header: string;
  dataKey: string;
  /** Ancien champ largeur fixe (mm). Ignoré par le nouveau moteur sauf comme indice. */
  width?: number;
  /** Type de donnée — si absent, inféré depuis header/dataKey/contenu. */
  type?: ColumnType;
  /** Priorité — si absente, inférée depuis le type. */
  priority?: ColumnPriority;
  /** Empêche le retour à la ligne (dates, montants, références courtes…). */
  nowrap?: boolean;
  /** Alignement — si absent, déduit du type (montants → right, statut → center). */
  align?: CellAlign;
  /** En-tête abrégé validé (ex. "Téléphone" → "Tél."). */
  abbrev?: string;
}

export type ExportRow = Record<string, unknown>;

// ─── Mesure réelle du texte (injectée par le module fonts) ───────────────────
// Retourne la largeur en mm d'une chaîne pour une taille (pt) et une graisse.
export type Measurer = (text: string, fontSizePt: number, bold?: boolean) => number;

// ─── Règles de dimensionnement par type ──────────────────────────────────────
export interface ColumnRule {
  min: number;   // largeur mini (mm)
  max: number;   // largeur maxi (mm)
  flex: number;  // poids de distribution de l'espace restant
  align: CellAlign;
  nowrap: boolean;
}
export type ColumnRules = Record<ColumnType, ColumnRule>;

// ─── Résultat d'analyse d'une colonne ────────────────────────────────────────
export interface ColumnLayout {
  def: ColumnDef;
  type: ColumnType;
  priority: ColumnPriority;
  headerLabel: string;   // libellé effectif (abrégé si besoin, jamais cassé en plein mot)
  align: CellAlign;
  nowrap: boolean;
  naturalWidth: number;  // largeur idéale sans wrap (mm) — basée sur P90 du contenu
  minWidth: number;      // largeur mini avant wrap/troncature (mm)
  width: number;         // largeur finale attribuée (mm) — remplie par le solveur
}

// Analyse complète d'un jeu (colonnes + lignes) pour une largeur cible donnée.
export interface DocumentLayoutAnalysis {
  rowCount: number;
  columnCount: number;
  columns: ColumnLayout[];
  estimatedNaturalWidth: number;   // Σ naturalWidth
  estimatedCompactWidth: number;   // Σ minWidth
}

// ─── Formats de page ─────────────────────────────────────────────────────────
export type PageFormatName = 'a4' | 'a3' | 'letter' | 'legal';
export type Orientation = 'portrait' | 'landscape';

export interface PageFormatSpec {
  name: PageFormatName;
  orientation: Orientation;
  width: number;   // mm
  height: number;  // mm
}

export interface Margins { top: number; right: number; bottom: number; left: number; }

// ─── Décision finale de mise en page (sortie du layout engine) ───────────────
export interface LayoutDecision {
  format: PageFormatSpec;
  margins: Margins;
  fontSize: number;         // corps du tableau (pt)
  headerFontSize: number;   // en-tête de colonnes (pt)
  columns: ColumnLayout[];  // largeurs finales remplies pour ce format
  tableWidth: number;       // Σ largeurs finales (mm) — doit remplir la zone utile
  usableWidth: number;      // largeur imprimable (mm)
  rowsFirstPage: number;    // capacité 1ʳᵉ page (header complet)
  rowsOtherPages: number;   // capacité pages suivantes (header compact)
  score: number;            // score du candidat retenu
  candidateName: string;    // ex. "A4 portrait normal"
}

// ─── Candidat évalué par le sélecteur ────────────────────────────────────────
export interface LayoutCandidate extends LayoutDecision {
  widthUtilization: number;   // tableWidth / usableWidth  (viser 0.88–1.0)
  estimatedPages: number;
  lastPageFillRatio: number;
  wrappingPenalty: number;
  readability: number;
}

// ─── Pagination ──────────────────────────────────────────────────────────────
export interface RowMeasure { index: number; height: number; lines: number; }
export interface PagePlan { rows: number[]; }          // indices de lignes de la page
export interface PaginationPlan {
  pages: PagePlan[];
  rowHeights: number[];
  balanced: boolean;
}

// ─── Validation post-génération ──────────────────────────────────────────────
export type AnomalyKind =
  | 'low-width-utilization'
  | 'nearly-empty-last-page'
  | 'clipped-content'
  | 'font-too-small'
  | 'oversized-header'
  | 'broken-word'
  | 'corrupted-characters'
  | 'blank-page'
  | 'out-of-page';

export interface Anomaly { kind: AnomalyKind; detail: string; page?: number; severity: 'warn' | 'error'; }
export interface ValidationReport { ok: boolean; anomalies: Anomaly[]; }

// ─── Entrée d'un export (fournie par les modules métier) ─────────────────────
export type DocumentFamily = 'data-list' | 'fiche' | 'facture' | 'recu' | 'rapport';

export interface StatBox {
  label: string;
  value: string | number;
  color?: [number, number, number];
}

export interface ExportOptions {
  preferredFormat?: PageFormatName | 'auto';
  preferredOrientation?: Orientation | 'auto';
  mode?: 'auto' | 'compact' | 'detailed';
  subtitle?: string;
  stats?: StatBox[];
  documentRef?: string;   // référence affichée dans le header/footer de continuation
  lang?: 'fr' | 'en';
}

export interface DocumentDefinition {
  title: string;
  filename: string;
  family?: DocumentFamily;
  columns: ColumnDef[];
  rows: ExportRow[];
  options?: ExportOptions;
}

// ─── Fiche individuelle ──────────────────────────────────────────────────────
export interface FicheField { key: string; value: string }
export interface FicheSection { label: string; fields: FicheField[] }

// ════════════════════════════════════════════════════════════════════════════
//  SIGNATURES DES FONCTIONS PURES (implémentées par les modules)
//  (déclarées ici en commentaire de contrat — chaque module les exporte)
//
//  fonts.ts
//    export function registerFonts(doc: any): void
//    export function makeMeasurer(doc: any): Measurer
//    export function sanitizeText(s: unknown): string
//
//  columns.ts
//    export const COLUMN_RULES: ColumnRules
//    export function inferColumnType(def: ColumnDef, rows: ExportRow[]): ColumnType
//    export function abbreviateHeader(label: string, maxWidthMm: number,
//                                     measure: Measurer, fontPt: number): string
//    export function analyzeColumns(columns: ColumnDef[], rows: ExportRow[],
//                                   measure: Measurer, fontPt: number): DocumentLayoutAnalysis
//    export function fitColumns(analysis: DocumentLayoutAnalysis, usableWidth: number): ColumnLayout[]
//
//  pagination.ts
//    export function estimateRowHeights(cols: ColumnLayout[], rows: ExportRow[],
//                                       measure: Measurer, fontPt: number,
//                                       vPad: number): number[]
//    export function planPagination(rowHeights: number[], rowsFirstPage: number,
//                                   usableHeightFirst: number, usableHeightOther: number): PaginationPlan
//    export function balanceLastPages(plan: PaginationPlan): PaginationPlan
//
//  layout.ts
//    export const PAGE_FORMATS: Record<string, {w:number;h:number}>
//    export function selectBestLayout(columns: ColumnDef[], rows: ExportRow[],
//                                     measure: Measurer, opts?: ExportOptions): LayoutDecision
//    export function listCandidates(columns: ColumnDef[], rows: ExportRow[],
//                                   measure: Measurer, opts?: ExportOptions): LayoutCandidate[]
//
//  render.ts
//    export function drawFirstPageHeader(doc, decision, title, subtitle?): number   // returns Y after header
//    export function drawContinuationHeader(doc, decision, title, ref?): number
//    export function drawFooter(doc, decision, pageNum, pageCount, ref?): void
//    export function drawStatBoxes(doc, decision, stats, startY): number
//    export function renderTableDocument(doc, def, decision): void   // full table render
//    export function renderFiche(doc, title, sections, ref?): void
//
//  validate.ts
//    export function validateDocument(doc: any, decision: LayoutDecision,
//                                     def: DocumentDefinition): ValidationReport
//
//  xlsx.ts
//    export async function exportXLSXAdaptive(def: DocumentDefinition): Promise<void>
//    export async function exportCSV(def: DocumentDefinition): Promise<void>
//
//  index.ts (orchestrateur — rétro-compatible)
//    export async function exportPDF(columns, rows, title, filename, subtitle?, stats?): Promise<void>
//    export async function exportXLSX(rows, filename, sheetName?): Promise<void>
//    export async function exportFichePDF(title, sections, filename): Promise<void>
//    export async function exportDocument(def: DocumentDefinition): Promise<void>
// ════════════════════════════════════════════════════════════════════════════
