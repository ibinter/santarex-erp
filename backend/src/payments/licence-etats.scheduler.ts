// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Planificateur du MODÈLE À 6 ÉTATS DE LICENCE
//  (cahier IBIG-LICENCE-UNIVERSEL v1.1, §2/§5.6/§9).
//
//  Deux tâches quotidiennes :
//    • 03:00 → recalculerEtats() : ESSAI→DECOUVERTE, ACTIVE→GRACE,
//              GRACE→EXPIREE, et collecte des tenants EXPIREE à purger.
//    • 04:00 → purge best-effort des tenants EXPIREE dont datePurge < now
//              (journalisation + suppression). Ne lève JAMAIS.
//
//  ⚠️ DÉPENDANCE : `@nestjs/schedule`. `ScheduleModule.forRoot()` est importé
//  dans PaymentsModule (pas globalement dans app.module). Sans lui, les @Cron
//  ci-dessous sont inertes (aucune erreur, mais aucun déclenchement).
//
//  Tous les jobs sont défensifs : try/catch global + par élément, logs, et
//  jamais d'exception propagée (le scheduler ne doit pas mourir).
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';

import { Licence, LicenceStatut } from '../licences/entities/licence.entity';
import { LicenceLifecycleService } from './licence-lifecycle.service';

@Injectable()
export class LicenceEtatsScheduler {
  private readonly logger = new Logger(LicenceEtatsScheduler.name);

  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepo: Repository<Licence>,
    private readonly lifecycle: LicenceLifecycleService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  03:00 — Recalcul quotidien des états de licence.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron('0 3 * * *', { name: 'licence-recalcul-etats' })
  async recalculQuotidien(): Promise<void> {
    try {
      const res = await this.lifecycle.recalculerEtats();
      this.logger.log(
        `Recalcul états — essai→découverte:${res.trialToFree}, active→grâce:${res.activeToGrace}, `
          + `grâce→expirée:${res.graceToExpired}, à purger:${res.aPurger.length}`,
      );
    } catch (e) {
      this.logger.error(
        `Job licence-recalcul-etats échoué: ${(e as Error).message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  04:00 — Purge best-effort des tenants EXPIREE dont datePurge < now.
  //          Journalise puis supprime. Ne lève jamais.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron('0 4 * * *', { name: 'licence-purge-retention' })
  async purgeRetention(): Promise<void> {
    try {
      const now = new Date();
      const aPurger = await this.licenceRepo.find({
        where: { statut: LicenceStatut.EXPIREE, datePurge: LessThan(now) },
      });
      if (!aPurger.length) return;

      let purges = 0;
      for (const lic of aPurger) {
        try {
          this.logger.warn(
            `PURGE rétention — tenant=${lic.tenantSlug}, licence=${lic.cle}, `
              + `datePurge=${lic.datePurge?.toISOString?.() ?? lic.datePurge} : suppression des données.`,
          );
          // Purge effective de la licence (best-effort). La suppression des
          // données métier du tenant relève d'un processus dédié ; ici on retire
          // la licence expirée au-delà de la rétention.
          await this.licenceRepo.remove(lic);
          purges++;
        } catch (e) {
          this.logger.error(
            `Échec purge licence ${lic.cle} (${lic.tenantSlug}): ${(e as Error).message}`,
          );
        }
      }
      this.logger.log(`Purge rétention — licences supprimées : ${purges}/${aPurger.length}`);
    } catch (e) {
      this.logger.error(
        `Job licence-purge-retention échoué: ${(e as Error).message}`,
      );
    }
  }
}
