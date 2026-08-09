// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Séquence d'e-mails du cycle de licence (cahier IBIG v1.1
//  §5.4 / §8.6 / §8.8).
//
//  Un unique @Cron quotidien (03h30) parcourt les licences en ESSAI / DECOUVERTE
//  / EXPIREE et, pour chacune, détermine le(s) jalon(s) du cycle « dû(s) » à
//  partir de `dateExpiration` (et `dateDebut` pour l'accueil J+1) :
//
//    ESSAI :
//      • j1        — J+1 après le début de l'essai        (prise en main)
//      • j3        — J-3 avant l'expiration               (ce qui se ferme)
//      • j1_final  — J-1 avant l'expiration               (dernier jour)
//    ESSAI → DECOUVERTE :
//      • j0        — jour de bascule (>= dateExpiration)   (passage Découverte)
//      • j7        — J+7 après l'expiration                (relance commerciale)
//    EXPIREE (purge) :
//      • j60       — J+60 après l'expiration               (avertissement purge)
//      • j83       — J+83 après l'expiration               (dernier rappel)
//
//  IDEMPOTENCE : chaque jalon envoyé est mémorisé dans la colonne jsonb
//  `licences.emailsCycleEnvoyesJson` (['j1','j3',...]). Un jalon déjà présent
//  n'est jamais renvoyé — aucun double envoi possible, même si un jour de cron
//  a été manqué (les seuils sont « atteint ou dépassé », donc rattrapés une
//  seule fois au premier passage suivant).
//
//  ⚠️ La colonne n'est PAS déclarée sur l'entité Licence (interdit ici) : elle
//  est lue/écrite en SQL brut via le repository injecté.
//
//  ScheduleModule.forRoot() est déjà activé globalement (PaymentsModule) — le
//  décorateur @Cron est donc actif dès l'enregistrement de ce provider dans
//  MailModule. Tous les traitements sont défensifs : jamais d'exception propagée.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Licence, LicenceStatut } from '../licences/entities/licence.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { MailService } from './mail.service';

/** Nombre de jours entre l'expiration et la purge définitive des données. */
const JOURS_AVANT_PURGE = 90;
const MS_JOUR = 24 * 60 * 60 * 1000;

type Jalon = 'j1' | 'j3' | 'j1_final' | 'j0' | 'j7' | 'j60' | 'j83';

@Injectable()
export class LicenceEmailsScheduler {
  private readonly logger = new Logger(LicenceEmailsScheduler.name);

  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepo: Repository<Licence>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private frontUrl(): string {
    return this.config
      .get<string>('FRONTEND_URL', 'https://santarex.ibigsoft.com')
      .replace(/\/$/, '');
  }

  /**
   * Nombre de jours calendaires écoulés entre `from` et `to` (positif si `to`
   * est postérieur). Comparaison à la granularité du jour (heure ignorée) pour
   * un déclenchement stable quelle que soit l'heure du cron.
   */
  private diffJours(from: Date, to: Date): number {
    const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b - a) / MS_JOUR);
  }

  private formatDate(d: Date): string {
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Cron quotidien — 03h30.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron('30 3 * * *', { name: 'licence-emails-cycle' })
  async traiterCycleEmails(): Promise<void> {
    try {
      const now = new Date();
      const candidats = await this.licenceRepo.find({
        where: {
          statut: In([
            LicenceStatut.ESSAI,
            LicenceStatut.DECOUVERTE,
            LicenceStatut.EXPIREE,
          ]),
        },
      });

      let envoyes = 0;
      for (const licence of candidats) {
        try {
          const dus = this.jalonsDus(licence, now);
          if (dus.length === 0) continue;

          // Jalons déjà notifiés (idempotence) — lus en SQL brut.
          const dejaEnvoyes = await this.lireJalonsEnvoyes(licence.id);
          const aEnvoyer = dus.filter((j) => !dejaEnvoyes.includes(j));
          if (aEnvoyer.length === 0) continue;

          const admin = await this.trouverAdmin(licence.tenantSlug);
          if (!admin?.email) {
            this.logger.warn(
              `Aucun admin avec e-mail pour le tenant '${licence.tenantSlug}' (licence ${licence.cle}) — jalons ignorés : ${aEnvoyer.join(',')}`,
            );
            continue;
          }

          const nouveaux: Jalon[] = [];
          for (const jalon of aEnvoyer) {
            try {
              await this.envoyerJalon(jalon, licence, admin, now);
              nouveaux.push(jalon);
              envoyes++;
            } catch (e) {
              this.logger.warn(
                `Échec envoi jalon ${jalon} (licence ${licence.cle}): ${(e as Error).message}`,
              );
            }
          }

          // On ne marque QUE les jalons effectivement traités, une seule fois.
          if (nouveaux.length) {
            await this.marquerJalons(licence.id, [...dejaEnvoyes, ...nouveaux]);
          }
        } catch (e) {
          this.logger.warn(
            `Échec traitement cycle e-mails licence ${licence.cle}: ${(e as Error).message}`,
          );
        }
      }

      if (envoyes) this.logger.log(`Cycle e-mails licence — envois : ${envoyes}`);
    } catch (e) {
      this.logger.error(
        `Job licence-emails-cycle échoué: ${(e as Error).message}`,
      );
    }
  }

  // ── Sélection du jalon dû ────────────────────────────────────────────────
  /**
   * Retourne les jalons « atteints » pour cette licence à la date `now`.
   * Seuils « atteint ou dépassé » : combinés à l'idempotence, chaque jalon
   * n'est déclenché qu'une seule fois, même après un jour de cron manqué.
   */
  private jalonsDus(licence: Licence, now: Date): Jalon[] {
    const dus: Jalon[] = [];
    const exp = licence.dateExpiration ? new Date(licence.dateExpiration) : null;
    if (!exp) return dus;

    const jDepuisDebut = licence.dateDebut
      ? this.diffJours(new Date(licence.dateDebut), now)
      : null;
    const jDepuisExp = this.diffJours(exp, now); // > 0 après expiration

    if (licence.statut === LicenceStatut.ESSAI) {
      if (jDepuisDebut !== null && jDepuisDebut >= 1) dus.push('j1');
      if (jDepuisExp >= -3) dus.push('j3');
      if (jDepuisExp >= -1) dus.push('j1_final');
    }

    // Bascule en Découverte : jour d'expiration atteint (ESSAI ou déjà DECOUVERTE).
    if (
      (licence.statut === LicenceStatut.ESSAI ||
        licence.statut === LicenceStatut.DECOUVERTE) &&
      jDepuisExp >= 0
    ) {
      dus.push('j0');
    }

    // Relance commerciale unique — 7 jours après la bascule.
    if (
      (licence.statut === LicenceStatut.DECOUVERTE ||
        licence.statut === LicenceStatut.ESSAI) &&
      jDepuisExp >= 7
    ) {
      dus.push('j7');
    }

    // Purge — licences payantes expirées non renouvelées.
    if (licence.statut === LicenceStatut.EXPIREE) {
      if (jDepuisExp >= 60) dus.push('j60');
      if (jDepuisExp >= 83) dus.push('j83');
    }

    return dus;
  }

  private async envoyerJalon(
    jalon: Jalon,
    licence: Licence,
    admin: User,
    now: Date,
  ): Promise<void> {
    const prenom = admin.firstName || 'cher client';
    const nomEtablissement = licence.tenantSlug;
    const urlConnexion = `${this.frontUrl()}/login`;
    const urlRenouvellement = `${this.frontUrl()}/licence/renouveler`;
    const exp = new Date(licence.dateExpiration);
    const datePurge = this.formatDate(new Date(exp.getTime() + JOURS_AVANT_PURGE * MS_JOUR));

    switch (jalon) {
      case 'j1':
        return this.mailService.envoyerEssaiJ1({ to: admin.email, prenom, nomEtablissement, urlConnexion });
      case 'j3':
        return this.mailService.envoyerEssaiJ3({ to: admin.email, prenom, nomEtablissement, urlRenouvellement });
      case 'j1_final':
        return this.mailService.envoyerEssaiJ1Final({
          to: admin.email, prenom, nomEtablissement,
          dateExpiration: this.formatDate(exp), urlRenouvellement,
        });
      case 'j0':
        return this.mailService.envoyerEssaiJ0({ to: admin.email, prenom, nomEtablissement, urlRenouvellement, urlConnexion });
      case 'j7':
        return this.mailService.envoyerEssaiJ7({ to: admin.email, prenom, nomEtablissement, urlRenouvellement });
      case 'j60':
        return this.mailService.envoyerPurgeJ60({ to: admin.email, prenom, nomEtablissement, datePurge, urlRenouvellement });
      case 'j83':
        return this.mailService.envoyerPurgeJ83({ to: admin.email, prenom, nomEtablissement, datePurge, urlRenouvellement });
    }
  }

  private async trouverAdmin(tenantSlug: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { tenantId: tenantSlug, role: UserRole.ADMIN, isActive: true },
    });
  }

  // ── Idempotence : lecture/écriture SQL brut de la colonne jsonb ───────────
  private async lireJalonsEnvoyes(licenceId: string): Promise<Jalon[]> {
    const rows = await this.licenceRepo.query(
      `SELECT "emailsCycleEnvoyesJson" AS jalons FROM licences WHERE id = $1`,
      [licenceId],
    );
    const val = rows?.[0]?.jalons;
    if (Array.isArray(val)) return val as Jalon[];
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        return Array.isArray(parsed) ? (parsed as Jalon[]) : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  private async marquerJalons(licenceId: string, jalons: Jalon[]): Promise<void> {
    // Dédoublonnage défensif avant persistance.
    const uniques = Array.from(new Set(jalons));
    await this.licenceRepo.query(
      `UPDATE licences SET "emailsCycleEnvoyesJson" = $1::jsonb WHERE id = $2`,
      [JSON.stringify(uniques), licenceId],
    );
  }
}
