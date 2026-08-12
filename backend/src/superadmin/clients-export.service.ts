import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

/**
 * Export CSV de TOUTE la base clients (tenants) pour la console SuperAdmin.
 *
 * Un « client » = un tenant (établissement) + sa licence courante + son
 * utilisateur admin (le compte créé à l'inscription). Aucun compte n'est exclu :
 * tous les statuts (établissement ET licence) sont inclus. Filtrage optionnel
 * par statut (correspond à `tenants.statut` OU `licences.statut`).
 *
 * Colonnes réelles utilisées (vérifiées en base) :
 *   tenants(id, slug, nom, type, email, telephone, adresse, ville, pays,
 *           nomResponsable, emailResponsable, telephoneResponsable, statut,
 *           createdAt)
 *   licences(tenantSlug, statut, offreCode, dateExpiration, createdAt)
 *   users(tenantId, firstName, lastName, email, role, createdAt)
 */
@Injectable()
export class ClientsExportService {
  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  /** Statuts disponibles pour le filtre (union licence + établissement). */
  async statutsDisponibles(): Promise<string[]> {
    const rows = await this.dataSource.query(
      `SELECT DISTINCT s FROM (
         SELECT statut::text AS s FROM licences
         UNION SELECT statut::text AS s FROM tenants
       ) u WHERE s IS NOT NULL ORDER BY s`,
    );
    return rows.map((r: { s: string }) => r.s);
  }

  /**
   * Construit le CSV. `statut` (optionnel) filtre sur licence OU établissement.
   * Séparateur « ; » + BOM UTF-8 → ouverture directe dans Excel (y compris FR).
   */
  async genererCsv(statut?: string): Promise<string> {
    const params: unknown[] = [];
    let filtre = '';
    if (statut && statut.trim()) {
      params.push(statut.trim());
      filtre = `WHERE (l.statut::text = $1 OR t.statut::text = $1)`;
    }

    const rows: Record<string, unknown>[] = await this.dataSource.query(
      `SELECT
         t.id                                                   AS id,
         t.nom                                                  AS etablissement,
         t.type::text                                           AS type,
         COALESCE(u."lastName", t."nomResponsable")             AS nom,
         u."firstName"                                          AS prenoms,
         COALESCE(u.email, t.email, t."emailResponsable")       AS email,
         COALESCE(t."telephoneResponsable", t.telephone)        AS whatsapp,
         t.telephone                                            AS telephone,
         NULLIF(concat_ws(', ', t.adresse, t.ville, t.pays), '') AS adresse,
         t.statut::text                                         AS statut_etablissement,
         l.statut::text                                         AS statut_licence,
         l."offreCode"                                          AS offre,
         t."createdAt"                                          AS date_inscription,
         l."dateExpiration"                                     AS date_expiration
       FROM tenants t
       LEFT JOIN LATERAL (
         SELECT * FROM licences ll WHERE ll."tenantSlug" = t.slug
         ORDER BY ll."dateExpiration" DESC NULLS LAST, ll."createdAt" DESC LIMIT 1
       ) l ON true
       LEFT JOIN LATERAL (
         SELECT * FROM users uu
         WHERE uu."tenantId" = t.slug
           AND uu.role::text IN ('admin', 'superadmin', 'directeur')
         ORDER BY uu."createdAt" ASC LIMIT 1
       ) u ON true
       ${filtre}
       ORDER BY t."createdAt" DESC`,
      params,
    );

    const entetes = [
      'ID', 'Établissement', 'Type', 'Nom', 'Prénoms', 'E-mail', 'WhatsApp',
      'Téléphone', 'Adresse', 'Statut établissement', 'Statut licence',
      'Offre/Formule', 'Date inscription', 'Date expiration',
    ];
    const cles = [
      'id', 'etablissement', 'type', 'nom', 'prenoms', 'email', 'whatsapp',
      'telephone', 'adresse', 'statut_etablissement', 'statut_licence',
      'offre', 'date_inscription', 'date_expiration',
    ];

    const fmt = (v: unknown): string => {
      if (v === null || v === undefined) return '';
      if (v instanceof Date) return this.formatDate(v);
      // Les dates renvoyées par pg peuvent être des chaînes ISO.
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(v)) {
        return this.formatDate(new Date(v));
      }
      return String(v);
    };
    const echapper = (s: string): string =>
      /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;

    const lignes = [entetes.join(';')];
    for (const r of rows) {
      lignes.push(cles.map((c) => echapper(fmt(r[c]))).join(';'));
    }
    // BOM UTF-8 pour qu'Excel interprète correctement les accents.
    return '﻿' + lignes.join('\r\n') + '\r\n';
  }

  private formatDate(d: Date): string {
    if (isNaN(d.getTime())) return '';
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  }
}
