import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { statfs } from 'fs/promises';
import { join } from 'path';
import { readFileSync } from 'fs';

export type CheckStatus = 'up' | 'degraded' | 'down' | 'configured' | 'not_configured';

export interface ServiceCheck {
  /** Identifiant technique du service (db, smtp, ia, disk, memory). */
  key: string;
  /** Libellé lisible. */
  label: string;
  /** Statut synthétique. */
  status: CheckStatus;
  /** Latence de la sonde en millisecondes (le cas échéant). */
  latenceMs?: number;
  /** Message d'explication (erreur, configuration, etc.). */
  message?: string;
  /** Détails additionnels par service. */
  details?: Record<string, unknown>;
}

export interface HealthSummary {
  status: 'ok' | 'degraded' | 'down';
  timestamp: string;
}

export interface HealthDetails extends HealthSummary {
  version: string;
  uptimeSec: number;
  services: ServiceCheck[];
}

/**
 * HealthService — sondes réelles et NON bloquantes.
 * Chaque sonde est protégée par try/catch + timeout court : une panne d'un
 * service ne fait jamais planter le endpoint, elle produit un statut degraded/down.
 */
@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private readonly startedAt = Date.now();

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {}

  /** Version applicative lue depuis package.json (fallback sur env / '0.0.0'). */
  private getVersion(): string {
    try {
      // dist/health -> remonter jusqu'à la racine backend où réside package.json
      const pkgPath = join(process.cwd(), 'package.json');
      const raw = readFileSync(pkgPath, 'utf-8');
      const pkg = JSON.parse(raw) as { version?: string };
      return pkg.version || process.env.npm_package_version || '0.0.0';
    } catch {
      return process.env.npm_package_version || '0.0.0';
    }
  }

  /** Exécute une promesse avec un plafond de temps ; rejette si dépassé. */
  private withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Timeout ${label} (${ms}ms)`)), ms);
      p.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }

  /** DB : SELECT 1 réel via TypeORM, latence mesurée. */
  async checkDatabase(): Promise<ServiceCheck> {
    const label = 'Base de données';
    const start = Date.now();
    try {
      if (!this.dataSource.isInitialized) {
        return { key: 'db', label, status: 'down', message: 'DataSource non initialisée' };
      }
      await this.withTimeout(this.dataSource.query('SELECT 1'), 3000, 'DB');
      const latenceMs = Date.now() - start;
      return {
        key: 'db',
        label,
        status: latenceMs > 1000 ? 'degraded' : 'up',
        latenceMs,
        details: { driver: this.dataSource.options.type },
      };
    } catch (err) {
      return {
        key: 'db',
        label,
        status: 'down',
        latenceMs: Date.now() - start,
        message: (err as Error).message,
      };
    }
  }

  /**
   * SMTP : vérifie la présence de la configuration (host + user + pass).
   * Ne tente pas de connexion bloquante — statut configuré / non configuré.
   */
  checkSmtp(): ServiceCheck {
    const label = 'Messagerie (SMTP)';
    const host = this.config.get<string>('SMTP_HOST');
    const user = this.config.get<string>('SMTP_USER');
    const pass = this.config.get<string>('SMTP_PASS');
    const configured = Boolean(host && user && pass);
    return {
      key: 'smtp',
      label,
      status: configured ? 'configured' : 'not_configured',
      message: configured
        ? undefined
        : 'Variables SMTP_HOST / SMTP_USER / SMTP_PASS incomplètes',
      details: {
        host: host || null,
        port: this.config.get<number>('SMTP_PORT', 587),
        userDefini: Boolean(user),
      },
    };
  }

  /** IA : présence d'au moins une clé de fournisseur active (Groq / OpenAI / Anthropic). */
  checkIa(): ServiceCheck {
    const label = 'Assistant IA';
    const groq = this.config.get<string>('GROQ_API_KEY');
    const openai = this.config.get<string>('OPENAI_API_KEY');
    const anthropic = this.config.get<string>('ANTHROPIC_API_KEY');
    const fournisseurs: string[] = [];
    if (groq) fournisseurs.push('groq');
    if (openai) fournisseurs.push('openai');
    if (anthropic) fournisseurs.push('anthropic');
    const configured = fournisseurs.length > 0;
    return {
      key: 'ia',
      label,
      status: configured ? 'configured' : 'not_configured',
      message: configured ? undefined : 'Aucune clé IA (GROQ/OPENAI/ANTHROPIC) définie',
      details: { fournisseurs },
    };
  }

  /** Disque : espace libre via fs.statfs (fallback statut inconnu si indisponible). */
  async checkDisk(): Promise<ServiceCheck> {
    const label = 'Espace disque';
    try {
      const stats = await statfs(process.cwd());
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bavail * stats.bsize;
      const usedBytes = totalBytes - freeBytes;
      const pctUtilise = totalBytes > 0 ? (usedBytes / totalBytes) * 100 : 0;
      const status: CheckStatus =
        pctUtilise >= 95 ? 'down' : pctUtilise >= 85 ? 'degraded' : 'up';
      return {
        key: 'disk',
        label,
        status,
        details: {
          totalGo: +(totalBytes / 1024 ** 3).toFixed(2),
          libreGo: +(freeBytes / 1024 ** 3).toFixed(2),
          pctUtilise: +pctUtilise.toFixed(1),
        },
      };
    } catch (err) {
      return {
        key: 'disk',
        label,
        status: 'degraded',
        message: `Mesure disque indisponible : ${(err as Error).message}`,
      };
    }
  }

  /** Mémoire : process.memoryUsage() (heap). */
  checkMemory(): ServiceCheck {
    const label = 'Mémoire process';
    try {
      const mem = process.memoryUsage();
      const heapUsedMo = mem.heapUsed / 1024 ** 2;
      const heapTotalMo = mem.heapTotal / 1024 ** 2;
      const rssMo = mem.rss / 1024 ** 2;
      const pctHeap = heapTotalMo > 0 ? (heapUsedMo / heapTotalMo) * 100 : 0;
      const status: CheckStatus = pctHeap >= 95 ? 'degraded' : 'up';
      return {
        key: 'memory',
        label,
        status,
        details: {
          heapUsedMo: +heapUsedMo.toFixed(1),
          heapTotalMo: +heapTotalMo.toFixed(1),
          rssMo: +rssMo.toFixed(1),
          pctHeap: +pctHeap.toFixed(1),
        },
      };
    } catch (err) {
      return { key: 'memory', label, status: 'degraded', message: (err as Error).message };
    }
  }

  /** Sonde légère et publique : DB uniquement (le reste n'impacte pas la disponibilité). */
  async getSummary(): Promise<HealthSummary> {
    const db = await this.checkDatabase();
    const status: HealthSummary['status'] =
      db.status === 'down' ? 'down' : db.status === 'degraded' ? 'degraded' : 'ok';
    return { status, timestamp: new Date().toISOString() };
  }

  /** Rapport détaillé (réservé SUPERADMIN). */
  async getDetails(): Promise<HealthDetails> {
    const [db, disk] = await Promise.all([this.checkDatabase(), this.checkDisk()]);
    const smtp = this.checkSmtp();
    const ia = this.checkIa();
    const memory = this.checkMemory();
    const services = [db, smtp, ia, disk, memory];

    // Seuls les services critiques (DB, disque, mémoire) déclassent la disponibilité.
    // SMTP/IA "not_configured" n'est pas un incident : signalé mais neutre.
    const criticals = [db, disk, memory];
    const status: HealthDetails['status'] = criticals.some((s) => s.status === 'down')
      ? 'down'
      : criticals.some((s) => s.status === 'degraded')
        ? 'degraded'
        : 'ok';

    return {
      status,
      timestamp: new Date().toISOString(),
      version: this.getVersion(),
      uptimeSec: Math.floor((Date.now() - this.startedAt) / 1000),
      services,
    };
  }
}
