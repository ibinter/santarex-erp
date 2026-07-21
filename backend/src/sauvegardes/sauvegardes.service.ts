import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { spawn } from 'child_process';
import { createHash } from 'crypto';
import { createReadStream } from 'fs';
import * as fs from 'fs/promises';
import * as path from 'path';
import {
  Sauvegarde,
  StatutSauvegarde,
  TypeSauvegarde,
} from './entities/sauvegarde.entity';

interface DbConfig {
  host: string;
  port: string;
  user: string;
  password: string;
  name: string;
}

@Injectable()
export class SauvegardesService {
  private readonly logger = new Logger(SauvegardesService.name);

  /**
   * Jeton de confirmation fort exigé pour toute restauration destructrice.
   * L'appelant DOIT renvoyer exactement cette chaîne.
   */
  static readonly CONFIRMATION_TOKEN = 'RESTAURER-DEFINITIVEMENT';

  constructor(
    @InjectRepository(Sauvegarde)
    private readonly repo: Repository<Sauvegarde>,
  ) {}

  // ── Configuration ────────────────────────────────────────────────────────

  /**
   * Dossier PRIVÉ de stockage des dumps, résolu depuis process.cwd().
   * Jamais un répertoire `public`. Configurable via BACKUP_DIR (peut être
   * absolu ou relatif au cwd).
   */
  private getBackupDir(): string {
    const configured = process.env.BACKUP_DIR;
    if (configured && configured.trim().length > 0) {
      return path.isAbsolute(configured)
        ? path.resolve(configured)
        : path.resolve(process.cwd(), configured);
    }
    return path.resolve(process.cwd(), 'storage', 'backups');
  }

  private getDbConfig(): DbConfig {
    return {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || '5432',
      user: process.env.DB_USER || 'santarex',
      password: process.env.DB_PASSWORD || 'santarex_secure_password',
      name: process.env.DB_NAME || 'santarex_db',
    };
  }

  private pgBinary(bin: 'pg_dump' | 'pg_restore' | 'psql'): string {
    // Permet de pointer un chemin absolu si le binaire n'est pas dans le PATH.
    const dir = process.env.PG_BIN_DIR;
    return dir ? path.join(dir, bin) : bin;
  }

  /**
   * Empêche toute évasion hors du dossier de sauvegarde (path traversal).
   * Retourne le chemin absolu validé, sinon lève une erreur.
   */
  private resolveInsideBackupDir(fileName: string): string {
    // On n'accepte qu'un basename : pas de séparateur, pas de '..'.
    const base = path.basename(fileName);
    if (
      base !== fileName ||
      base.includes('..') ||
      base.includes('/') ||
      base.includes('\\') ||
      base.length === 0
    ) {
      throw new BadRequestException('Nom de fichier de sauvegarde invalide.');
    }
    const dir = this.getBackupDir();
    const resolved = path.resolve(dir, base);
    const normalizedDir = path.resolve(dir) + path.sep;
    if (!(resolved + path.sep).startsWith(normalizedDir) && resolved !== path.resolve(dir)) {
      throw new BadRequestException('Chemin de sauvegarde hors périmètre.');
    }
    return resolved;
  }

  private async computeChecksum(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = createReadStream(filePath);
      stream.on('error', reject);
      stream.on('data', (chunk) => hash.update(chunk));
      stream.on('end', () => resolve(hash.digest('hex')));
    });
  }

  // ── Création (opération de LECTURE de la base — sûre) ─────────────────────

  async creerSauvegarde(
    initiateurId: string | null,
    nom?: string,
    type: TypeSauvegarde = TypeSauvegarde.MANUELLE,
  ): Promise<Sauvegarde> {
    const dir = this.getBackupDir();
    await fs.mkdir(dir, { recursive: true });

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const db = this.getDbConfig();
    const fileName = `santarex-${db.name}-${stamp}.dump`;
    const filePath = path.resolve(dir, fileName);

    let sauvegarde = this.repo.create({
      nom: nom?.trim() || `Sauvegarde ${stamp}`,
      type,
      statut: StatutSauvegarde.EN_COURS,
      cheminFichier: filePath,
      nomFichier: fileName,
      initiateurId,
    });
    sauvegarde = await this.repo.save(sauvegarde);

    try {
      await this.runPgDump(db, filePath);

      const stat = await fs.stat(filePath);
      const checksum = await this.computeChecksum(filePath);

      sauvegarde.statut = StatutSauvegarde.REUSSIE;
      sauvegarde.tailleOctets = stat.size.toString();
      sauvegarde.checksum = checksum;
      sauvegarde.terminatedAt = new Date();
      return await this.repo.save(sauvegarde);
    } catch (err: any) {
      this.logger.error(`Échec sauvegarde ${sauvegarde.id}: ${err?.message}`);
      // Nettoyage d'un dump partiel éventuel.
      await fs.rm(filePath, { force: true }).catch(() => undefined);
      sauvegarde.statut = StatutSauvegarde.ECHOUEE;
      sauvegarde.erreur = String(err?.message ?? err).slice(0, 2000);
      sauvegarde.cheminFichier = null;
      sauvegarde.terminatedAt = new Date();
      await this.repo.save(sauvegarde);
      throw new InternalServerErrorException(
        `La sauvegarde a échoué : ${sauvegarde.erreur}`,
      );
    }
  }

  /**
   * Exécute pg_dump au format "custom" (-Fc), directement dans un fichier.
   * Le mot de passe est fourni via l'environnement PGPASSWORD (jamais en argv,
   * jamais loggé). Utilise spawn (pas de shell) pour éviter toute injection.
   */
  private runPgDump(db: DbConfig, outPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h', db.host,
        '-p', db.port,
        '-U', db.user,
        '-d', db.name,
        '-Fc',
        '--no-owner',
        '--no-privileges',
        '-f', outPath,
      ];

      let child;
      try {
        child = spawn(this.pgBinary('pg_dump'), args, {
          env: { ...process.env, PGPASSWORD: db.password },
          windowsHide: true,
        });
      } catch (spawnErr: any) {
        return reject(spawnErr);
      }

      let stderr = '';
      child.stderr?.on('data', (d) => {
        stderr += d.toString();
      });
      child.on('error', (e: any) => {
        if (e?.code === 'ENOENT') {
          reject(
            new Error(
              'Binaire pg_dump introuvable dans le conteneur (postgresql-client absent de node:18-alpine). ' +
                'Ajouter postgresql-client à l\'image backend ou définir PG_BIN_DIR.',
            ),
          );
        } else {
          reject(e);
        }
      });
      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`pg_dump code ${code}: ${stderr.trim()}`));
      });
    });
  }

  // ── Consultation ─────────────────────────────────────────────────────────

  async lister(): Promise<Sauvegarde[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 500 });
  }

  async findOne(id: string): Promise<Sauvegarde> {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sauvegarde introuvable.');
    return s;
  }

  // ── Téléchargement sécurisé (stream, anti-path-traversal) ────────────────

  async ouvrirFluxTelechargement(
    id: string,
  ): Promise<{ stream: ReturnType<typeof createReadStream>; nomFichier: string; taille: number }> {
    const s = await this.findOne(id);
    if (s.statut !== StatutSauvegarde.REUSSIE || !s.nomFichier) {
      throw new BadRequestException(
        'Cette sauvegarde n\'est pas disponible au téléchargement.',
      );
    }
    // Re-résolution défensive à partir du seul basename (jamais du chemin stocké).
    const filePath = this.resolveInsideBackupDir(s.nomFichier);
    let stat;
    try {
      stat = await fs.stat(filePath);
    } catch {
      throw new NotFoundException('Le fichier de sauvegarde est absent du stockage.');
    }
    return {
      stream: createReadStream(filePath),
      nomFichier: s.nomFichier,
      taille: stat.size,
    };
  }

  // ── Suppression ──────────────────────────────────────────────────────────

  async supprimer(id: string): Promise<{ supprime: true }> {
    const s = await this.findOne(id);
    if (s.nomFichier) {
      try {
        const filePath = this.resolveInsideBackupDir(s.nomFichier);
        await fs.rm(filePath, { force: true });
      } catch (e: any) {
        this.logger.warn(`Suppression fichier dump ${id}: ${e?.message}`);
      }
    }
    await this.repo.remove(s);
    return { supprime: true };
  }

  // ── Restauration (DESTRUCTRICE) ──────────────────────────────────────────

  /**
   * Restauration protégée par un jeton de confirmation fort. Crée d'abord une
   * sauvegarde préalable de sécurité, journalise l'intention, puis — si et
   * seulement si l'environnement l'autorise explicitement
   * (ALLOW_DB_RESTORE=true) — exécute pg_restore --clean.
   *
   * ⚠️ Par défaut ALLOW_DB_RESTORE n'est PAS activé : la méthode s'arrête après
   * la sauvegarde préalable et retourne le plan d'exécution, SANS toucher à la
   * base. C'est volontaire : l'exécution réelle d'une restauration doit être
   * décidée dans un environnement approprié (fenêtre de maintenance, DB
   * accessible, pg_restore présent).
   */
  async restaurer(
    id: string,
    confirmationText: string,
    initiateurId: string | null,
  ): Promise<{
    restauree: boolean;
    execute: boolean;
    sauvegardePrealableId: string;
    message: string;
  }> {
    if (confirmationText !== SauvegardesService.CONFIRMATION_TOKEN) {
      throw new ForbiddenException(
        `Confirmation invalide. Renvoyez exactement « ${SauvegardesService.CONFIRMATION_TOKEN} » pour confirmer.`,
      );
    }

    const cible = await this.findOne(id);
    if (cible.statut !== StatutSauvegarde.REUSSIE || !cible.nomFichier) {
      throw new BadRequestException(
        'Impossible de restaurer depuis une sauvegarde non réussie.',
      );
    }
    // Vérifie la présence effective du fichier (anti-traversal via basename).
    const ciblePath = this.resolveInsideBackupDir(cible.nomFichier);
    try {
      await fs.stat(ciblePath);
    } catch {
      throw new NotFoundException('Le fichier de sauvegarde cible est absent.');
    }

    this.logger.warn(
      `RESTAURATION demandée sur sauvegarde ${id} par ${initiateurId ?? 'inconnu'} — création d'une sauvegarde préalable.`,
    );

    // 1) Filet de sécurité : snapshot de l'état courant AVANT toute écriture.
    const prealable = await this.creerSauvegarde(
      initiateurId,
      `Pré-restauration (avant #${id})`,
      TypeSauvegarde.MANUELLE,
    );

    const allow = String(process.env.ALLOW_DB_RESTORE).toLowerCase() === 'true';
    if (!allow) {
      this.logger.warn(
        `RESTAURATION non exécutée (ALLOW_DB_RESTORE désactivé). Plan prêt, base intacte.`,
      );
      return {
        restauree: false,
        execute: false,
        sauvegardePrealableId: prealable.id,
        message:
          'Sauvegarde préalable créée. Restauration NON exécutée : activez ALLOW_DB_RESTORE=true ' +
          'dans un environnement approprié (fenêtre de maintenance) pour lancer réellement pg_restore.',
      };
    }

    // 2) Exécution réelle (uniquement si explicitement autorisée par l'env).
    const db = this.getDbConfig();
    await this.runPgRestore(db, ciblePath);
    this.logger.warn(`RESTAURATION exécutée depuis la sauvegarde ${id}.`);
    return {
      restauree: true,
      execute: true,
      sauvegardePrealableId: prealable.id,
      message: 'Restauration exécutée. Une sauvegarde préalable a été conservée.',
    };
  }

  private runPgRestore(db: DbConfig, dumpPath: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const args = [
        '-h', db.host,
        '-p', db.port,
        '-U', db.user,
        '-d', db.name,
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        dumpPath,
      ];
      let child;
      try {
        child = spawn(this.pgBinary('pg_restore'), args, {
          env: { ...process.env, PGPASSWORD: db.password },
          windowsHide: true,
        });
      } catch (e) {
        return reject(e);
      }
      let stderr = '';
      child.stderr?.on('data', (d) => (stderr += d.toString()));
      child.on('error', (e: any) => {
        if (e?.code === 'ENOENT') {
          reject(new Error('Binaire pg_restore introuvable dans le conteneur.'));
        } else reject(e);
      });
      child.on('close', (code) => {
        // pg_restore peut renvoyer un code non nul sur des warnings bénins ;
        // ici on reste strict : tout code != 0 est une erreur.
        if (code === 0) resolve();
        else reject(new Error(`pg_restore code ${code}: ${stderr.trim()}`));
      });
    });
  }
}
