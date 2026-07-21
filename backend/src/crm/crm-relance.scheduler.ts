// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Relances commerciales automatisées (cycle d'emails).
//
//  Deux @Cron quotidiens, best-effort et idempotents :
//    1) Prospects  : relance ceux dont `dateRelance` est échue et non convertis.
//    2) Devis      : relance les offres commerciales ENVOYEE non acceptées après
//                    un délai configurable.
//
//  Idempotence : chaque cible mémorise `dateDerniereRelance` + `nbRelances`.
//    • On ne renvoie pas si une relance a déjà eu lieu il y a moins de
//      RELANCE_GAP_JOURS jours.
//    • On plafonne à RELANCE_MAX relances par cible.
//
//  ⚠️ Dépend de `@nestjs/schedule` (ScheduleModule.forRoot() présent dans
//  app.module). Enregistré comme provider dans `crm.module.ts`.
//  Tous les jobs sont défensifs : jamais d'exception propagée.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Not, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Prospect } from './entities/prospect.entity';
import { ProspectStatut } from './crm.enums';
import { MailService } from '../mail/mail.service';
import {
  OffreCommerciale,
  OffreCommercialeStatut,
} from '../offres-commerciales/entities/offre-commerciale.entity';

@Injectable()
export class CrmRelanceScheduler {
  private readonly logger = new Logger(CrmRelanceScheduler.name);

  // Délai minimal entre deux relances d'une même cible (jours).
  private readonly gapJours: number;
  // Nombre maximal de relances automatiques par cible.
  private readonly maxRelances: number;
  // Ancienneté minimale d'un devis ENVOYEE avant première relance (jours).
  private readonly delaiDevisJours: number;

  constructor(
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(OffreCommerciale)
    private readonly offreRepo: Repository<OffreCommerciale>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {
    this.gapJours = Number(this.config.get('RELANCE_GAP_JOURS', 3));
    this.maxRelances = Number(this.config.get('RELANCE_MAX', 3));
    this.delaiDevisJours = Number(this.config.get('RELANCE_DEVIS_JOURS', 5));
  }

  private joursAvant(n: number): Date {
    return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
  }

  private frontUrl(): string {
    return this.config
      .get<string>('FRONTEND_URL', 'https://santarex.ibigsoft.com')
      .replace(/\/$/, '');
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  1) Relance des prospects — quotidien (09h).
  // ══════════════════════════════════════════════════════════════════════════
  @Cron(CronExpression.EVERY_DAY_AT_9AM, { name: 'crm-relance-prospects' })
  async relancerProspects(): Promise<void> {
    try {
      const maintenant = new Date();
      const seuilGap = this.joursAvant(this.gapJours);

      // Prospects à relancer : dateRelance échue, non convertis/perdus,
      // consentement RGPD, plafond non atteint.
      const candidats = await this.prospectRepo.find({
        where: {
          dateRelance: LessThanOrEqual(maintenant),
          statut: Not(In([ProspectStatut.GAGNE, ProspectStatut.PERDU])),
          consentement: true,
        },
      });

      let envoyees = 0;
      for (const prospect of candidats) {
        try {
          if ((prospect.nbRelances ?? 0) >= this.maxRelances) continue;
          if (!prospect.email) continue;
          // Respect du délai minimal entre deux relances.
          if (
            prospect.dateDerniereRelance &&
            new Date(prospect.dateDerniereRelance).getTime() > seuilGap.getTime()
          ) {
            continue;
          }

          await this.mailService.envoyerRelanceProspect({
            to: prospect.email,
            prenom: prospect.prenom ?? prospect.nom,
            entreprise: prospect.entreprise ?? '',
            logiciel: prospect.logiciel ?? 'SANTAREX ERP',
            urlContact: `${this.frontUrl()}/contact`,
          });

          prospect.nbRelances = (prospect.nbRelances ?? 0) + 1;
          prospect.dateDerniereRelance = maintenant;
          // Repousse la prochaine relance pour éviter tout renvoi en boucle.
          prospect.dateRelance = new Date(
            maintenant.getTime() + this.gapJours * 24 * 60 * 60 * 1000,
          );
          await this.prospectRepo.save(prospect);
          envoyees++;
        } catch (e) {
          this.logger.error(
            `Échec relance prospect ${prospect.id}: ${(e as Error).message}`,
          );
        }
      }

      if (envoyees) this.logger.log(`Relances prospects envoyées : ${envoyees}`);
    } catch (e) {
      this.logger.error(
        `Job crm-relance-prospects échoué: ${(e as Error).message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  2) Relance des devis (offres commerciales) — quotidien (09h30).
  // ══════════════════════════════════════════════════════════════════════════
  @Cron('0 30 9 * * *', { name: 'crm-relance-devis' })
  async relancerDevis(): Promise<void> {
    try {
      const maintenant = new Date();
      const seuilGap = this.joursAvant(this.gapJours);
      const seuilAnciennete = this.joursAvant(this.delaiDevisJours);

      // Offres ENVOYEE, suffisamment anciennes, non acceptées/refusées.
      const candidats = await this.offreRepo.find({
        where: {
          statut: OffreCommercialeStatut.ENVOYEE,
          createdAt: LessThanOrEqual(seuilAnciennete),
        },
      });

      let envoyees = 0;
      for (const offre of candidats) {
        try {
          if ((offre.nbRelances ?? 0) >= this.maxRelances) continue;
          if (!offre.clientEmail) continue;
          // Ne pas relancer un devis expiré par sa date de validité.
          if (
            offre.dateValidite &&
            new Date(offre.dateValidite).getTime() < maintenant.getTime()
          ) {
            continue;
          }
          if (
            offre.dateDerniereRelance &&
            new Date(offre.dateDerniereRelance).getTime() > seuilGap.getTime()
          ) {
            continue;
          }

          await this.mailService.envoyerRelanceDevis({
            to: offre.clientEmail,
            clientNom: offre.clientNom,
            numero: offre.numero,
            url: `${this.frontUrl()}/offre/${offre.tokenAcceptation}`,
            dateValidite: offre.dateValidite
              ? new Date(offre.dateValidite).toLocaleDateString('fr-FR')
              : undefined,
          });

          offre.nbRelances = (offre.nbRelances ?? 0) + 1;
          offre.dateDerniereRelance = maintenant;
          await this.offreRepo.save(offre);
          envoyees++;
        } catch (e) {
          this.logger.error(
            `Échec relance devis ${offre.numero}: ${(e as Error).message}`,
          );
        }
      }

      if (envoyees) this.logger.log(`Relances devis envoyées : ${envoyees}`);
    } catch (e) {
      this.logger.error(
        `Job crm-relance-devis échoué: ${(e as Error).message}`,
      );
    }
  }
}
