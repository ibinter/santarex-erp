// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Tâches planifiées du cycle de vie des licences.
//
//  Regroupe les @Cron qui pilotent les transitions automatiques :
//    • Expiration des commandes de paiement impayées (pay_transactions).
//    • Passage ACTIVE → GRÂCE à l'échéance.
//    • Fin de grâce / fin de provisoire → EXPIRÉ puis coupure d'accès (SUSPENDU).
//    • Rappels d'expiration J-7 / J-3 / J-1 (idempotents).
//
//  ⚠️ DÉPENDANCE : `@nestjs/schedule` (ScheduleModule.forRoot()) doit être
//  installé et importé dans `app.module.ts`. Il ne l'est PAS actuellement —
//  voir le rapport d'intégration. Sans lui, les décorateurs @Cron ci-dessous
//  sont inertes (aucune erreur, mais aucun déclenchement).
//
//  Tous les jobs sont défensifs : try/catch global + par élément, logs, et
//  jamais d'exception propagée (le scheduler ne doit pas mourir).
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository, In } from 'typeorm';

import { Licence, LicenceStatut } from '../licences/entities/licence.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentStatus, LicenceLifecycle } from './payments.enums';
import { LicenceLifecycleService } from './licence-lifecycle.service';

@Injectable()
export class LicenceSchedulerService {
  private readonly logger = new Logger(LicenceSchedulerService.name);

  constructor(
    @InjectRepository(PaymentTransaction)
    private readonly txRepo: Repository<PaymentTransaction>,
    @InjectRepository(Licence)
    private readonly licenceRepo: Repository<Licence>,
    private readonly lifecycle: LicenceLifecycleService,
  ) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  1) Expiration des commandes impayées — toutes les heures.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron(CronExpression.EVERY_HOUR, { name: 'expire-stale-transactions' })
  async expireStaleTransactions(): Promise<void> {
    try {
      const now = new Date();
      const stale = await this.txRepo.find({
        where: {
          status: In([PaymentStatus.PENDING, PaymentStatus.AWAITING_PROOF]),
          expiresAt: LessThan(now),
        },
      });
      if (stale.length === 0) return;

      for (const tx of stale) {
        try {
          tx.status = PaymentStatus.EXPIRED;
          tx.metadata = {
            ...(tx.metadata ?? {}),
            expiredAt: now.toISOString(),
            expiredBy: 'scheduler',
          };
          await this.txRepo.save(tx);
        } catch (e) {
          this.logger.error(
            `Échec expiration tx ${tx.reference}: ${(e as Error).message}`,
          );
        }
      }
      this.logger.log(`Commandes impayées expirées : ${stale.length}`);
    } catch (e) {
      this.logger.error(
        `Job expire-stale-transactions échoué: ${(e as Error).message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  2) & 3) Échéances licences — quotidien (02h).
  //     ACTIVE échue → GRÂCE ; fin de grâce → EXPIRÉ+SUSPENDU ;
  //     fin de provisoire → EXPIRÉ+SUSPENDU.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron(CronExpression.EVERY_DAY_AT_2AM, { name: 'process-licence-expirations' })
  async processLicenceExpirations(): Promise<void> {
    try {
      const now = new Date();
      // Les états ACTIVE / GRACE / PROVISIONAL sont tous projetés sur
      // LicenceStatut.ACTIVE ; on lit le cycle de vie fin depuis `notes`.
      const candidates = await this.licenceRepo.find({
        where: { statut: LicenceStatut.ACTIVE },
      });

      let toGrace = 0;
      let suspended = 0;

      for (const licence of candidates) {
        try {
          const st = this.lifecycle.getLifecycle(licence);

          if (st.lc === LicenceLifecycle.PROVISIONAL) {
            const until = st.provisionalUntil
              ? new Date(st.provisionalUntil)
              : licence.dateExpiration;
            if (until && until.getTime() < now.getTime()) {
              await this.lifecycle.expireAndSuspend(
                licence,
                'Fin de la période provisoire',
              );
              suspended++;
            }
            continue;
          }

          if (st.lc === LicenceLifecycle.GRACE) {
            const graceEnd = st.graceEndsAt
              ? new Date(st.graceEndsAt)
              : licence.dateExpiration;
            if (graceEnd && graceEnd.getTime() < now.getTime()) {
              await this.lifecycle.expireAndSuspend(
                licence,
                'Fin de la période de grâce',
              );
              suspended++;
            }
            continue;
          }

          if (st.lc === LicenceLifecycle.ACTIVE || st.lc === LicenceLifecycle.TRIAL) {
            if (
              licence.dateExpiration &&
              licence.dateExpiration.getTime() < now.getTime()
            ) {
              await this.lifecycle.transitionToGrace(licence);
              toGrace++;
            }
          }
        } catch (e) {
          this.logger.error(
            `Échec traitement échéance licence ${licence.cle}: ${(e as Error).message}`,
          );
        }
      }

      if (toGrace || suspended) {
        this.logger.log(
          `Échéances licences — grâce: ${toGrace}, suspendues: ${suspended}`,
        );
      }
    } catch (e) {
      this.logger.error(
        `Job process-licence-expirations échoué: ${(e as Error).message}`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  4) Rappels d'expiration J-7 / J-3 / J-1 — quotidien (08h).
  //     Idempotence assurée par LicenceLifecycleService.maybeSendReminder.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron(CronExpression.EVERY_DAY_AT_8AM, { name: 'send-expiry-reminders' })
  async sendExpiryReminders(): Promise<void> {
    try {
      const candidates = await this.licenceRepo.find({
        where: [
          { statut: LicenceStatut.ACTIVE },
          { statut: LicenceStatut.ESSAI },
        ],
      });

      let sent = 0;
      for (const licence of candidates) {
        try {
          const before = this.lifecycle.getLifecycle(licence).reminders;
          await this.lifecycle.maybeSendReminder(licence);
          const after = this.lifecycle.getLifecycle(licence).reminders;
          if (Object.keys(after).length > Object.keys(before).length) sent++;
        } catch (e) {
          this.logger.error(
            `Échec rappel licence ${licence.cle}: ${(e as Error).message}`,
          );
        }
      }

      if (sent) this.logger.log(`Rappels d'expiration envoyés : ${sent}`);
    } catch (e) {
      this.logger.error(
        `Job send-expiry-reminders échoué: ${(e as Error).message}`,
      );
    }
  }
}
