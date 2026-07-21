/**
 * tenant-scope.util.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Garde-fou (dev-time) OPTIONNEL et NON INTRUSIF pour l'isolation multi-société.
 *
 * SANTAREX est multi-tenant : chaque entité métier porte un `tenantId`. L'isolation
 * repose aujourd'hui à 100 % sur le fait que chaque service pense à filtrer par
 * `tenantId`. Un oubli (`findOne({ where: { id } })` sans tenant) ouvre une fuite
 * de données inter-cliniques.
 *
 * Ce helper permet de VÉRIFIER, dans le code appelant qui le souhaite, qu'une
 * clause `where` TypeORM inclut bien le `tenantId` attendu. Il n'est imposé à
 * AUCUN service existant : il est simplement disponible et documenté, pour être
 * adopté progressivement (nouveaux services, tests, ou wrapping local) sans
 * risque de régression.
 *
 * Exemple d'usage (opt-in) :
 *
 *   const where = { id, tenantId };
 *   assertTenantScoped(where, tenantId);            // throw si tenantId manquant/incohérent
 *   return this.repo.findOne({ where });
 *
 *   // Mode non bloquant (log seulement), utile en observation avant durcissement :
 *   assertTenantScoped(where, tenantId, { mode: 'warn' });
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export type WhereLike = Record<string, unknown>;

export interface AssertTenantScopedOptions {
  /**
   * 'throw' (défaut) : lève une Error si la clause n'est pas scoppée par tenant.
   * 'warn'           : journalise un avertissement mais laisse passer (observation).
   */
  mode?: 'throw' | 'warn';
  /** Nom de la clé de tenant (défaut: 'tenantId'). */
  tenantKey?: string;
  /** Étiquette optionnelle (nom de méthode/entité) pour enrichir le message. */
  label?: string;
  /** Logger injectable (défaut: console). Doit exposer `warn` et `error`. */
  logger?: { warn: (msg: string) => void; error?: (msg: string) => void };
}

/**
 * Indique si une clause `where` (objet unique ou tableau de clauses OR) est
 * correctement restreinte au `tenantId` fourni.
 *
 * - Objet unique : `where[tenantKey]` doit être défini et égal à `tenantId`.
 * - Tableau (OR) : CHAQUE membre du tableau doit être scoppé (sinon une branche
 *   fuit).
 * - `tenantId` falsy (undefined/null/'') est considéré comme non-scoppé : on ne
 *   peut pas garantir l'isolation sans valeur de tenant.
 */
export function isTenantScoped(
  where: WhereLike | WhereLike[] | undefined | null,
  tenantId: string | undefined | null,
  tenantKey = 'tenantId',
): boolean {
  if (!tenantId) return false;
  if (where === undefined || where === null) return false;

  const checkOne = (clause: WhereLike): boolean => {
    if (clause === null || typeof clause !== 'object') return false;
    const value = (clause as Record<string, unknown>)[tenantKey];
    return value !== undefined && value !== null && value === tenantId;
  };

  if (Array.isArray(where)) {
    // Toutes les branches OR doivent être scoppées, sinon fuite possible.
    return where.length > 0 && where.every(checkOne);
  }

  return checkOne(where);
}

/**
 * Vérifie qu'une clause `where` inclut bien le `tenantId` attendu.
 * Par défaut lève une Error ; en mode 'warn' journalise seulement.
 *
 * Retourne `true` si la clause est scoppée, `false` sinon (utile en mode 'warn').
 */
export function assertTenantScoped(
  where: WhereLike | WhereLike[] | undefined | null,
  tenantId: string | undefined | null,
  options: AssertTenantScopedOptions = {},
): boolean {
  const {
    mode = 'throw',
    tenantKey = 'tenantId',
    label,
    logger = console,
  } = options;

  const scoped = isTenantScoped(where, tenantId, tenantKey);
  if (scoped) return true;

  const prefix = label ? `[tenant-scope:${label}]` : '[tenant-scope]';
  const message =
    `${prefix} Requête potentiellement non isolée : la clause "where" n'inclut pas ` +
    `un "${tenantKey}" cohérent (attendu: ${String(tenantId)}). ` +
    `Risque de fuite de données inter-tenant.`;

  if (mode === 'warn') {
    logger.warn(message);
    return false;
  }

  throw new Error(message);
}
