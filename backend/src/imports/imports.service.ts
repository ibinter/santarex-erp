import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import {
  Patient,
  PatientSexe,
  PatientGroupeSanguin,
  PatientStatut,
} from '../patients/entities/patient.entity';
import { ImportLog } from './entities/import-log.entity';

/** Fichier multipart tel que fourni par Multer. */
export interface UploadedImportFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** Ligne validée prête à l'insertion (clés = colonnes de l'entité Patient). */
export interface ParsedPatientRow {
  nom: string;
  prenom: string;
  dateNaissance: string; // ISO yyyy-mm-dd
  sexe: PatientSexe;
  telephone?: string;
  telephoneUrgence?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  nationalite?: string;
  numeroPieceIdentite?: string;
  typePieceIdentite?: string;
  groupeSanguin?: PatientGroupeSanguin;
  assuranceNom?: string;
  assuranceNumero?: string;
}

export interface LigneErreur {
  ligne: number;
  erreurs: string[];
}

export interface LigneDoublon {
  ligne: number;
  nom: string;
  prenom: string;
  dateNaissance: string;
  source: 'base' | 'fichier';
}

export interface PreviewResult {
  totalLignes: number;
  lignesValides: Array<{ ligne: number; data: ParsedPatientRow }>;
  lignesEnErreur: LigneErreur[];
  doublons: LigneDoublon[];
  colonnesReconnues: string[];
  colonnesIgnorees: string[];
}

export interface ConfirmResult {
  crees: number;
  ignores: number;
  erreurs: number;
  detailsErreurs: LigneErreur[];
}

const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 Mo
const INSERT_BATCH_SIZE = 200;

/** Colonnes du modèle. La 1re clé est l'en-tête canonique du modèle XLSX. */
const COLUMN_DEFS: Array<{
  field: keyof ParsedPatientRow;
  header: string;
  aliases: string[];
  required?: boolean;
}> = [
  { field: 'nom', header: 'nom', aliases: ['nom', 'nomdefamille', 'lastname', 'name'], required: true },
  { field: 'prenom', header: 'prenom', aliases: ['prenom', 'prenoms', 'firstname'], required: true },
  { field: 'dateNaissance', header: 'dateNaissance', aliases: ['datenaissance', 'ddn', 'dateofbirth', 'dob', 'naissance'], required: true },
  { field: 'sexe', header: 'sexe', aliases: ['sexe', 'genre', 'sex', 'gender'], required: true },
  { field: 'telephone', header: 'telephone', aliases: ['telephone', 'tel', 'phone', 'mobile', 'gsm', 'contact'] },
  { field: 'telephoneUrgence', header: 'telephoneUrgence', aliases: ['telephoneurgence', 'telurgence', 'urgencetel'] },
  { field: 'adresse', header: 'adresse', aliases: ['adresse', 'address'] },
  { field: 'ville', header: 'ville', aliases: ['ville', 'city', 'commune'] },
  { field: 'pays', header: 'pays', aliases: ['pays', 'country'] },
  { field: 'nationalite', header: 'nationalite', aliases: ['nationalite', 'nationality'] },
  { field: 'numeroPieceIdentite', header: 'numeroPieceIdentite', aliases: ['numeropieceidentite', 'cni', 'piece', 'numerocni'] },
  { field: 'typePieceIdentite', header: 'typePieceIdentite', aliases: ['typepieceidentite', 'typepiece'] },
  { field: 'groupeSanguin', header: 'groupeSanguin', aliases: ['groupesanguin', 'groupe', 'bloodgroup', 'sang'] },
  { field: 'assuranceNom', header: 'assuranceNom', aliases: ['assurancenom', 'assurance', 'mutuelle'] },
  { field: 'assuranceNumero', header: 'assuranceNumero', aliases: ['assurancenumero', 'numeroassurance', 'numassurance'] },
];

@Injectable()
export class ImportsService {
  private readonly logger = new Logger(ImportsService.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
    @InjectRepository(ImportLog)
    private readonly importLogRepository: Repository<ImportLog>,
    private readonly dataSource: DataSource,
  ) {}

  // ── Sécurité fichier ────────────────────────────────────────────────────

  /**
   * Rejette : fichiers > 5 Mo, extensions non xlsx/csv, exécutables déguisés
   * (contrôle des magic bytes, indépendant de l'extension).
   * Retourne le type détecté ('xlsx' | 'csv').
   */
  private assertSafeFile(file: UploadedImportFile): 'xlsx' | 'csv' {
    if (!file || !file.buffer || file.size === 0) {
      throw new BadRequestException('Fichier vide ou manquant.');
    }
    if (file.size > MAX_FILE_BYTES) {
      throw new BadRequestException('Fichier trop volumineux (maximum 5 Mo).');
    }

    const name = (file.originalname || '').toLowerCase();
    const ext = name.slice(name.lastIndexOf('.') + 1);
    if (ext !== 'xlsx' && ext !== 'csv') {
      throw new BadRequestException('Extension non autorisée. Formats acceptés : .xlsx, .csv');
    }

    const buf = file.buffer;
    const b0 = buf[0];
    const b1 = buf[1];
    const b2 = buf[2];
    const b3 = buf[3];

    // Rejet des exécutables / binaires connus, quelle que soit l'extension.
    const isMZ = b0 === 0x4d && b1 === 0x5a; // PE/DOS .exe .dll
    const isELF = b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46; // ELF
    const isMachO =
      (b0 === 0xfe && b1 === 0xed && b2 === 0xfa) ||
      (b0 === 0xcf && b1 === 0xfa && b2 === 0xed && b3 === 0xfe); // Mach-O
    const isShebang = b0 === 0x23 && b1 === 0x21; // #!
    const isPDF = b0 === 0x25 && b1 === 0x50 && b2 === 0x44 && b3 === 0x46; // %PDF
    if (isMZ || isELF || isMachO || isShebang || isPDF) {
      throw new BadRequestException('Fichier exécutable ou binaire refusé.');
    }

    const isZip =
      b0 === 0x50 && b1 === 0x4b && (b2 === 0x03 || b2 === 0x05 || b2 === 0x07);

    if (ext === 'xlsx') {
      // Un .xlsx est une archive ZIP : magic bytes "PK".
      if (!isZip) {
        throw new BadRequestException('Fichier .xlsx invalide (signature ZIP absente).');
      }
      return 'xlsx';
    }

    // ext === 'csv' : ne doit PAS être une archive ZIP déguisée.
    if (isZip) {
      throw new BadRequestException('Fichier .csv invalide (archive détectée).');
    }
    return 'csv';
  }

  // ── Neutralisation anti-formule (CSV / formula injection) ─────────────────

  /**
   * Toute valeur textuelle commençant par = + - @ (ou tab/CR) est neutralisée :
   * elle est traitée comme du texte et jamais évaluée. On préfixe une
   * apostrophe pour désamorcer l'interprétation par un tableur en aval.
   */
  private neutralizeFormula(value: string): string {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    if (/^[=+\-@\t\r]/.test(trimmed)) {
      return `'${trimmed}`;
    }
    return trimmed;
  }

  private cellToString(cell: ExcelJS.Cell | ExcelJS.CellValue): string {
    // exceljs : une cellule formule est un objet { formula, result } — on ne
    // conserve JAMAIS la formule, uniquement le texte affiché, neutralisé.
    let raw: any = cell;
    if (cell && typeof cell === 'object') {
      const anyCell: any = cell;
      if ('text' in anyCell && anyCell.text !== undefined) raw = anyCell.text;
      else if ('result' in anyCell) raw = anyCell.result;
      else if ('richText' in anyCell && Array.isArray(anyCell.richText)) {
        raw = anyCell.richText.map((r: any) => r.text).join('');
      } else if ('formula' in anyCell) {
        raw = anyCell.result ?? '';
      } else if (anyCell instanceof Date) {
        raw = this.dateToIso(anyCell);
      } else if ('value' in anyCell) {
        raw = anyCell.value;
      }
    }
    if (raw === null || raw === undefined) return '';
    if (raw instanceof Date) return this.dateToIso(raw);
    return this.neutralizeFormula(String(raw));
  }

  // ── Parsing (xlsx & csv) → matrice de chaînes ─────────────────────────────

  private async parseToMatrix(file: UploadedImportFile, kind: 'xlsx' | 'csv'): Promise<string[][]> {
    if (kind === 'xlsx') return this.parseXlsx(file.buffer);
    return this.parseCsv(file.buffer);
  }

  private async parseXlsx(buffer: Buffer): Promise<string[][]> {
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as any);
    } catch {
      throw new BadRequestException('Impossible de lire le fichier XLSX (corrompu ?).');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Le classeur ne contient aucune feuille.');

    const matrix: string[][] = [];
    ws.eachRow({ includeEmpty: false }, (row) => {
      const cells: string[] = [];
      // row.values est 1-indexé (index 0 vide).
      const values = row.values as any[];
      for (let i = 1; i < values.length; i++) {
        cells.push(this.cellToString(values[i]));
      }
      matrix.push(cells);
    });
    return matrix;
  }

  private parseCsv(buffer: Buffer): string[][] {
    const text = this.decodeText(buffer);
    // Détection du séparateur : ; (fréquent en environnement FR) sinon ,
    const firstLine = text.split(/\r?\n/, 1)[0] ?? '';
    const delimiter = (firstLine.match(/;/g)?.length ?? 0) >= (firstLine.match(/,/g)?.length ?? 0) ? ';' : ',';

    const rows: string[][] = [];
    let field = '';
    let record: string[] = [];
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"') {
          if (text[i + 1] === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else if (c === '"') {
        inQuotes = true;
      } else if (c === delimiter) {
        record.push(field); field = '';
      } else if (c === '\n') {
        record.push(field); field = '';
        rows.push(record); record = [];
      } else if (c === '\r') {
        // ignoré (géré avec \n)
      } else {
        field += c;
      }
    }
    if (field.length > 0 || record.length > 0) {
      record.push(field);
      rows.push(record);
    }
    // Neutralisation anti-formule + trim sur chaque cellule.
    return rows
      .filter((r) => r.some((v) => (v ?? '').trim() !== ''))
      .map((r) => r.map((v) => this.neutralizeFormula(v ?? '')));
  }

  /** Détecte le BOM (UTF-8 / UTF-16) et décode ; fallback latin1 si non-UTF-8. */
  private decodeText(buffer: Buffer): string {
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return buffer.slice(3).toString('utf8');
    }
    if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
      return buffer.slice(2).toString('utf16le');
    }
    if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
      // UTF-16 BE : swap → LE
      const swapped = Buffer.from(buffer.slice(2));
      swapped.swap16();
      return swapped.toString('utf16le');
    }
    const utf8 = buffer.toString('utf8');
    // Le caractère de remplacement U+FFFD signale un décodage UTF-8 raté →
    // on retente en latin1 (Windows-1252 courant pour les CSV Excel FR).
    if (utf8.includes('�')) {
      return buffer.toString('latin1');
    }
    return utf8;
  }

  // ── Mapping des en-têtes ──────────────────────────────────────────────────

  private normalizeHeader(h: string): string {
    return (h || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '') // supprime les accents (diacritiques)
      .replace(/^['\s]+/, '') // apostrophe de neutralisation éventuelle
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
  }

  private buildColumnMap(headerRow: string[]): {
    map: Map<number, keyof ParsedPatientRow>;
    reconnues: string[];
    ignorees: string[];
  } {
    const map = new Map<number, keyof ParsedPatientRow>();
    const reconnues: string[] = [];
    const ignorees: string[] = [];
    const usedFields = new Set<string>();

    headerRow.forEach((raw, idx) => {
      const norm = this.normalizeHeader(raw);
      if (!norm) return;
      const def = COLUMN_DEFS.find(
        (d) => !usedFields.has(d.field) && d.aliases.includes(norm),
      );
      if (def) {
        map.set(idx, def.field);
        usedFields.add(def.field);
        reconnues.push(def.header);
      } else {
        ignorees.push(raw.trim());
      }
    });
    return { map, reconnues, ignorees };
  }

  // ── Validation d'une ligne ────────────────────────────────────────────────

  private dateToIso(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private parseDate(value: string): string | null {
    const v = value.trim().replace(/^'/, '');
    if (!v) return null;
    // ISO yyyy-mm-dd
    let m = v.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) return this.buildDate(+m[1], +m[2], +m[3]);
    // dd/mm/yyyy ou dd-mm-yyyy ou dd.mm.yyyy
    m = v.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
    if (m) return this.buildDate(+m[3], +m[2], +m[1]);
    return null;
  }

  private buildDate(y: number, mo: number, d: number): string | null {
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const date = new Date(Date.UTC(y, mo - 1, d));
    if (
      date.getUTCFullYear() !== y ||
      date.getUTCMonth() !== mo - 1 ||
      date.getUTCDate() !== d
    ) {
      return null; // date inexistante (ex : 31/02)
    }
    if (date.getTime() > Date.now()) return null; // pas de date future
    const iso = `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return iso;
  }

  private parseSexe(value: string): PatientSexe | null {
    const v = this.normalizeHeader(value);
    if (['m', 'masculin', 'homme', 'male', 'h'].includes(v)) return PatientSexe.MASCULIN;
    if (['f', 'feminin', 'femme', 'female'].includes(v)) return PatientSexe.FEMININ;
    if (['i', 'indetermine', 'autre', 'inconnu', 'x'].includes(v)) return PatientSexe.INDETERMINE;
    return null;
  }

  private parseGroupeSanguin(value: string): PatientGroupeSanguin | null | 'invalid' {
    const v = value.trim().replace(/^'/, '').toUpperCase().replace(/\s/g, '');
    if (!v) return null;
    const valid = Object.values(PatientGroupeSanguin) as string[];
    if (valid.includes(v)) return v as PatientGroupeSanguin;
    return 'invalid';
  }

  private validateRow(
    cells: string[],
    colMap: Map<number, keyof ParsedPatientRow>,
  ): { data?: ParsedPatientRow; erreurs: string[] } {
    const erreurs: string[] = [];
    const get = (field: keyof ParsedPatientRow): string => {
      for (const [idx, f] of colMap) {
        if (f === field) return (cells[idx] ?? '').trim().replace(/^'/, '');
      }
      return '';
    };

    const nom = get('nom');
    const prenom = get('prenom');
    if (!nom) erreurs.push('Nom manquant');
    if (!prenom) erreurs.push('Prénom manquant');

    const dateRaw = get('dateNaissance');
    let dateNaissance = '';
    if (!dateRaw) {
      erreurs.push('Date de naissance manquante');
    } else {
      const parsed = this.parseDate(dateRaw);
      if (!parsed) erreurs.push(`Date de naissance invalide : "${dateRaw}" (formats : AAAA-MM-JJ ou JJ/MM/AAAA)`);
      else dateNaissance = parsed;
    }

    const sexeRaw = get('sexe');
    let sexe: PatientSexe | null = null;
    if (!sexeRaw) {
      erreurs.push('Sexe manquant');
    } else {
      sexe = this.parseSexe(sexeRaw);
      if (!sexe) erreurs.push(`Sexe invalide : "${sexeRaw}" (attendu : M, F ou I)`);
    }

    let groupeSanguin: PatientGroupeSanguin | undefined;
    const groupeRaw = get('groupeSanguin');
    if (groupeRaw) {
      const g = this.parseGroupeSanguin(groupeRaw);
      if (g === 'invalid') erreurs.push(`Groupe sanguin invalide : "${groupeRaw}"`);
      else if (g) groupeSanguin = g;
    }

    if (erreurs.length > 0) return { erreurs };

    const optional = (field: keyof ParsedPatientRow): string | undefined => {
      const v = get(field);
      return v ? v.slice(0, 250) : undefined;
    };

    const data: ParsedPatientRow = {
      nom: nom.slice(0, 100),
      prenom: prenom.slice(0, 100),
      dateNaissance,
      sexe: sexe as PatientSexe,
      telephone: optional('telephone'),
      telephoneUrgence: optional('telephoneUrgence'),
      adresse: optional('adresse'),
      ville: optional('ville'),
      pays: optional('pays'),
      nationalite: optional('nationalite'),
      numeroPieceIdentite: optional('numeroPieceIdentite'),
      typePieceIdentite: optional('typePieceIdentite'),
      groupeSanguin,
      assuranceNom: optional('assuranceNom'),
      assuranceNumero: optional('assuranceNumero'),
    };
    return { data, erreurs: [] };
  }

  // ── Détection de doublons (tenant-scoped) ─────────────────────────────────

  private dupKey(nom: string, prenom: string, dateNaissance: string): string {
    return `${this.normalizeHeader(nom)}|${this.normalizeHeader(prenom)}|${dateNaissance}`;
  }

  private async loadExistingKeys(tenantId: string): Promise<Set<string>> {
    const rows = await this.patientRepository.find({
      where: { tenantId },
      select: ['nom', 'prenom', 'dateNaissance'],
    });
    const set = new Set<string>();
    for (const r of rows) {
      const iso =
        r.dateNaissance instanceof Date
          ? this.dateToIso(r.dateNaissance)
          : String(r.dateNaissance).slice(0, 10);
      set.add(this.dupKey(r.nom, r.prenom, iso));
    }
    return set;
  }

  // ── Coeur : validation d'un fichier → rapport ─────────────────────────────

  private async analyze(
    file: UploadedImportFile,
    tenantId: string,
  ): Promise<PreviewResult> {
    const kind = this.assertSafeFile(file);
    const matrix = await this.parseToMatrix(file, kind);

    if (matrix.length === 0) {
      throw new BadRequestException('Le fichier ne contient aucune donnée.');
    }
    const [headerRow, ...dataRows] = matrix;
    const { map, reconnues, ignorees } = this.buildColumnMap(headerRow);

    // Vérifie que les colonnes obligatoires sont présentes.
    const missingRequired = COLUMN_DEFS.filter(
      (d) => d.required && ![...map.values()].includes(d.field),
    ).map((d) => d.header);
    if (missingRequired.length > 0) {
      throw new BadRequestException(
        `Colonnes obligatoires manquantes : ${missingRequired.join(', ')}. ` +
          `Téléchargez le modèle pour connaître le format attendu.`,
      );
    }

    const existingKeys = await this.loadExistingKeys(tenantId);
    const seenInFile = new Set<string>();

    const lignesValides: PreviewResult['lignesValides'] = [];
    const lignesEnErreur: LigneErreur[] = [];
    const doublons: LigneDoublon[] = [];

    dataRows.forEach((cells, i) => {
      const ligne = i + 2; // +1 en-tête, +1 index 1-based
      if (!cells.some((v) => (v ?? '').trim() !== '')) return; // ligne vide

      const { data, erreurs } = this.validateRow(cells, map);
      if (erreurs.length > 0 || !data) {
        lignesEnErreur.push({ ligne, erreurs });
        return;
      }

      const key = this.dupKey(data.nom, data.prenom, data.dateNaissance);
      if (existingKeys.has(key)) {
        doublons.push({ ligne, nom: data.nom, prenom: data.prenom, dateNaissance: data.dateNaissance, source: 'base' });
      } else if (seenInFile.has(key)) {
        doublons.push({ ligne, nom: data.nom, prenom: data.prenom, dateNaissance: data.dateNaissance, source: 'fichier' });
      }
      seenInFile.add(key);
      lignesValides.push({ ligne, data });
    });

    return {
      totalLignes: dataRows.filter((r) => r.some((v) => (v ?? '').trim() !== '')).length,
      lignesValides,
      lignesEnErreur,
      doublons,
      colonnesReconnues: reconnues,
      colonnesIgnorees: ignorees,
    };
  }

  async preview(file: UploadedImportFile, tenantId: string): Promise<PreviewResult> {
    return this.analyze(file, tenantId);
  }

  // ── Confirmation : insertion transactionnelle par lots ────────────────────

  async confirmer(
    file: UploadedImportFile,
    tenantId: string,
    userId: string,
    doublonsPolicy: 'ignorer' | 'creer' = 'ignorer',
  ): Promise<ConfirmResult> {
    const report = await this.analyze(file, tenantId);

    const doublonLignes = new Set(report.doublons.map((d) => d.ligne));
    const aInserer =
      doublonsPolicy === 'creer'
        ? report.lignesValides
        : report.lignesValides.filter((l) => !doublonLignes.has(l.ligne));

    let crees = 0;
    if (aInserer.length > 0) {
      const startNumber = await this.nextIppStartNumber(tenantId);
      const year = new Date().getFullYear();

      await this.dataSource.transaction(async (manager) => {
        const repo = manager.getRepository(Patient);
        let counter = startNumber;
        for (let i = 0; i < aInserer.length; i += INSERT_BATCH_SIZE) {
          const chunk = aInserer.slice(i, i + INSERT_BATCH_SIZE);
          const entities = chunk.map(({ data }) => {
            const ipp = `${year}-${String(counter).padStart(5, '0')}`;
            counter++;
            return repo.create({
              ...data,
              dateNaissance: data.dateNaissance as any,
              ipp,
              tenantId,
              createdById: userId,
              pays: data.pays || 'CI',
              statut: PatientStatut.ACTIF,
            });
          });
          await repo.save(entities);
          crees += entities.length;
        }
      });
    }

    const ignores = report.lignesValides.length - aInserer.length;
    const erreurs = report.lignesEnErreur.length;

    // Journalisation best-effort (ne bloque jamais l'import).
    try {
      await this.importLogRepository.save(
        this.importLogRepository.create({
          type: 'patients',
          fichier: (file.originalname || '').slice(0, 200),
          lignesTotal: report.totalLignes,
          crees,
          ignores,
          erreurs,
          tenantId,
          createdById: userId,
        }),
      );
    } catch (e) {
      this.logger.warn(`Journalisation import échouée: ${(e as Error).message}`);
    }

    return { crees, ignores, erreurs, detailsErreurs: report.lignesEnErreur };
  }

  /** Prochain numéro d'IPP disponible (année courante, tenant). */
  private async nextIppStartNumber(tenantId: string): Promise<number> {
    const year = new Date().getFullYear();
    const last = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.tenantId = :tenantId', { tenantId })
      .andWhere('patient.ipp LIKE :prefix', { prefix: `${year}-%` })
      .orderBy('patient.ipp', 'DESC')
      .getOne();
    let next = 1;
    if (last?.ipp) {
      const n = parseInt(last.ipp.split('-')[1], 10);
      if (!isNaN(n)) next = n + 1;
    }
    return next;
  }

  // ── Génération du modèle XLSX ─────────────────────────────────────────────

  async genererModele(): Promise<Buffer> {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SANTAREX ERP — IBIG SOFT';
    const ws = wb.addWorksheet('Patients', { views: [{ state: 'frozen', ySplit: 1 }] });

    ws.columns = COLUMN_DEFS.map((d) => ({
      header: d.required ? `${d.header} *` : d.header,
      key: d.field,
      width: 20,
    }));

    const headerRow = ws.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
    headerRow.height = 24;
    headerRow.alignment = { vertical: 'middle' };

    // Ligne d'exemple (les * indiquent les champs obligatoires).
    ws.addRow({
      nom: 'KOUASSI',
      prenom: 'Jean-Baptiste',
      dateNaissance: '1985-03-15',
      sexe: 'M',
      telephone: '+2250707070707',
      telephoneUrgence: '+2250808080808',
      adresse: 'Rue des Fleurs, Cocody',
      ville: 'Abidjan',
      pays: 'CI',
      nationalite: 'Ivoirienne',
      numeroPieceIdentite: 'CI-2024-123456',
      typePieceIdentite: 'CNI',
      groupeSanguin: 'O+',
      assuranceNom: 'MUGEFCI',
      assuranceNumero: 'MUG-2024-789',
    });

    // Feuille d'instructions.
    const info = wb.addWorksheet('Instructions');
    info.columns = [{ width: 24 }, { width: 60 }];
    const lines: Array<[string, string]> = [
      ['Colonne', 'Consigne'],
      ['nom *', 'Obligatoire. Nom de famille.'],
      ['prenom *', 'Obligatoire. Prénom(s).'],
      ['dateNaissance *', 'Obligatoire. Format AAAA-MM-JJ ou JJ/MM/AAAA. Pas de date future.'],
      ['sexe *', 'Obligatoire. M / F / I (ou Homme / Femme / Masculin / Féminin).'],
      ['telephone', 'Facultatif.'],
      ['groupeSanguin', 'Facultatif. Valeurs : A+ A- B+ B- AB+ AB- O+ O-.'],
      ['ville / adresse / pays…', 'Facultatifs.'],
      ['', ''],
      ['Doublons', 'Détectés par nom + prénom + date de naissance (patients existants et lignes en double dans le fichier).'],
      ['Sécurité', 'Fichier ≤ 5 Mo, .xlsx ou .csv uniquement.'],
    ];
    lines.forEach(([a, b], i) => {
      const r = info.addRow([a, b]);
      if (i === 0) {
        r.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        r.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
      }
    });

    return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
  }
}
