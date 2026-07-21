import {
  Injectable,
  Logger,
  BadRequestException,
  PayloadTooLargeException,
  UnsupportedMediaTypeException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID } from 'crypto';
import { createReadStream, existsSync, mkdirSync, writeFileSync, ReadStream } from 'fs';
import { join, resolve, sep, extname } from 'path';
import { PaymentProof } from './entities/payment-proof.entity';

/**
 * Fichier uploadé minimal (compatible Express.Multer.File / memoryStorage).
 * On ne dépend pas des types `multer` : seules ces propriétés sont utilisées.
 */
export interface UploadedProofFile {
  buffer: Buffer;
  originalname: string;
  mimetype: string;
  size: number;
}

/** Résultat du stockage d'une preuve. */
export interface StoredProof {
  storagePath: string; // chemin RELATIF à la racine privée (<tenant>/<uuid>.<ext>)
  sha256: string;
  mimeType: string;
  sizeBytes: number;
  originalName: string;
}

/** Taille maximale acceptée : 5 Mo. */
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

/** Extensions explicitement interdites (exécutables / scripts / vecteurs XSS). */
const FORBIDDEN_EXTENSIONS = new Set([
  '.php', '.php3', '.php4', '.php5', '.phtml',
  '.exe', '.dll', '.com', '.bat', '.cmd', '.msi', '.scr',
  '.js', '.mjs', '.cjs', '.jsx', '.ts',
  '.sh', '.bash', '.zsh', '.ps1', '.psm1',
  '.html', '.htm', '.xhtml', '.svg', '.xml',
  '.jar', '.war', '.py', '.rb', '.pl', '.cgi', '.asp', '.aspx', '.jsp',
]);

/**
 * Types réellement acceptés. Liste blanche stricte : le fichier doit avoir une
 * extension autorisée ET une signature binaire (magic bytes) correspondante.
 */
type AllowedKind = 'jpeg' | 'png' | 'webp' | 'heic' | 'pdf';

const ALLOWED_EXTENSIONS: Record<string, AllowedKind> = {
  '.jpg': 'jpeg',
  '.jpeg': 'jpeg',
  '.png': 'png',
  '.webp': 'webp',
  '.heic': 'heic',
  '.heif': 'heic',
  '.pdf': 'pdf',
};

const MIME_BY_KIND: Record<AllowedKind, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  heic: 'image/heic',
  pdf: 'application/pdf',
};

// Marques ISOBMFF (offset 8) valides pour un conteneur HEIC/HEIF.
const HEIC_BRANDS = new Set(['heic', 'heix', 'heif', 'mif1', 'hevc', 'hevx', 'msf1']);

/**
 * Stockage PRIVÉ des preuves de paiement.
 * - Racine hors de tout dossier `/public` (défaut: `storage/payment-proofs`).
 * - Refuse les exécutables / scripts déguisés (extension + magic bytes).
 * - Refuse > 5 Mo, n'accepte que jpg/png/webp/heic et PDF.
 * - Calcule le SHA256 (déduplication côté service).
 */
@Injectable()
export class ProofStorageService {
  private readonly logger = new Logger(ProofStorageService.name);
  private readonly root: string;

  constructor(private readonly config: ConfigService) {
    const configured =
      this.config.get<string>('PAYMENT_PROOF_STORAGE_ROOT') || 'storage/payment-proofs';
    // Résolution absolue depuis la racine du process ; jamais sous /public.
    this.root = resolve(process.cwd(), configured);
  }

  /** SHA256 hexadécimal d'un buffer (utilisé pour la déduplication). */
  computeSha256(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex');
  }

  /**
   * Valide puis écrit le fichier dans le stockage privé.
   * @throws PayloadTooLargeException si > 5 Mo
   * @throws UnsupportedMediaTypeException si type non autorisé / signature invalide
   * @throws BadRequestException si fichier vide / extension interdite
   */
  async store(file: UploadedProofFile, tenantId: string): Promise<StoredProof> {
    if (!file || !file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Fichier de preuve manquant ou vide.');
    }
    const sizeBytes = file.size ?? file.buffer.length;
    if (sizeBytes > MAX_SIZE_BYTES) {
      throw new PayloadTooLargeException('La preuve dépasse la taille maximale de 5 Mo.');
    }

    const originalName = (file.originalname || 'preuve').trim();
    const ext = extname(originalName).toLowerCase();

    if (FORBIDDEN_EXTENSIONS.has(ext)) {
      throw new UnsupportedMediaTypeException(
        `Type de fichier interdit (${ext || 'inconnu'}). Seules les images et les PDF sont acceptés.`,
      );
    }

    const kind = ALLOWED_EXTENSIONS[ext];
    if (!kind) {
      throw new UnsupportedMediaTypeException(
        'Extension non autorisée. Formats acceptés : jpg, png, webp, heic, pdf.',
      );
    }

    // Vérification des magic bytes : bloque les exécutables/scripts renommés.
    const detected = this.detectKind(file.buffer);
    if (detected !== kind) {
      throw new UnsupportedMediaTypeException(
        'Le contenu du fichier ne correspond pas à son extension (fichier potentiellement falsifié).',
      );
    }

    const sha256 = this.computeSha256(file.buffer);

    // Nom de fichier non devinable ; on ne réutilise jamais le nom client.
    const safeTenant = this.sanitizeSegment(tenantId);
    const relativePath = join(safeTenant, `${randomUUID()}${ext}`);
    const absolutePath = join(this.root, relativePath);

    const dir = join(this.root, safeTenant);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(absolutePath, file.buffer, { flag: 'wx' });

    this.logger.log(`Preuve stockée (privé) tenant=${tenantId} sha256=${sha256.slice(0, 12)}…`);

    return {
      storagePath: relativePath.split(sep).join('/'),
      sha256,
      mimeType: MIME_BY_KIND[kind],
      sizeBytes,
      originalName,
    };
  }

  /**
   * Ouvre un flux de lecture sur une preuve (accès admin protégé uniquement).
   * Protège contre le path traversal : le chemin résolu doit rester sous la racine.
   */
  getStream(proof: Pick<PaymentProof, 'storagePath'>): ReadStream {
    if (!proof?.storagePath) {
      throw new NotFoundException('Preuve introuvable.');
    }
    const absolutePath = resolve(this.root, proof.storagePath);
    const rootWithSep = this.root.endsWith(sep) ? this.root : this.root + sep;
    if (absolutePath !== this.root && !absolutePath.startsWith(rootWithSep)) {
      throw new BadRequestException('Chemin de preuve invalide.');
    }
    if (!existsSync(absolutePath)) {
      throw new NotFoundException('Fichier de preuve introuvable sur le stockage.');
    }
    return createReadStream(absolutePath);
  }

  /** Détecte le type réel d'après les premiers octets. Retourne null si inconnu. */
  private detectKind(buf: Buffer): AllowedKind | null {
    if (buf.length < 12) return null;

    // JPEG : FF D8 FF
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpeg';

    // PNG : 89 50 4E 47 0D 0A 1A 0A
    if (
      buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
      buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
    ) {
      return 'png';
    }

    // PDF : %PDF-
    if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46 && buf[4] === 0x2d) {
      return 'pdf';
    }

    // WEBP : "RIFF" .... "WEBP"
    if (
      buf.toString('ascii', 0, 4) === 'RIFF' &&
      buf.toString('ascii', 8, 12) === 'WEBP'
    ) {
      return 'webp';
    }

    // HEIC/HEIF : conteneur ISOBMFF avec box "ftyp" et marque connue.
    if (buf.toString('ascii', 4, 8) === 'ftyp') {
      const brand = buf.toString('ascii', 8, 12).toLowerCase();
      if (HEIC_BRANDS.has(brand)) return 'heic';
    }

    return null;
  }

  /** Empêche l'injection de séparateurs / traversal dans le segment tenant. */
  private sanitizeSegment(value: string): string {
    const cleaned = (value || 'unknown').replace(/[^a-zA-Z0-9_-]/g, '_');
    return cleaned.length > 0 ? cleaned : 'unknown';
  }
}
