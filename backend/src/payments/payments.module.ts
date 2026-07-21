import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';

// ── Entités ───────────────────────────────────────────────────────────────
import { PaymentMethodConfig } from './entities/payment-method-config.entity';
import { PaymentTransaction } from './entities/payment-transaction.entity';
import { PaymentProof } from './entities/payment-proof.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Voucher } from './entities/voucher.entity';
import { Licence } from '../licences/entities/licence.entity';

// ── Modules métier réutilisés ───────────────────────────────────────────────
//  MailModule et AuditLogsModule sont déclarés @Global() → pas besoin de les
//  réimporter. On importe explicitement ceux qui ne le sont pas.
import { LicencesModule } from '../licences/licences.module';
import { OffresSaasModule } from '../offres-saas/offres-saas.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { TenantsModule } from '../tenants/tenants.module';

// ── Services (fournis par les agents parallèles, noms de classe garantis) ────
import { PaymentConfigService } from './payments-config.service';
import { ManualPaymentService } from './manual-payment.service';
import { ProofStorageService } from './proof-storage.service';
import { GatewayService } from './gateway.service';
import { MonerooGateway } from './gateways/moneroo.gateway';
import { CinetpayGateway } from './gateways/cinetpay.gateway';
import { PaystackGateway } from './gateways/paystack.gateway';
import { FedapayGateway } from './gateways/fedapay.gateway';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaypalGateway } from './gateways/paypal.gateway';
import { VoucherService } from './voucher.service';
import { LicenceLifecycleService } from './licence-lifecycle.service';
import { LicenceSchedulerService } from './licence-scheduler.service';

// Note : LicenceGuard / ModuleGuard sont désormais fournis par
// EntitlementModule (@Global, autonome basé sur EntitlementService), plus par
// PaymentsModule — voir src/common/entitlement.module.ts.

// ── Controllers ─────────────────────────────────────────────────────────────
import { AdminPaymentsController } from './admin-payments.controller';
import { ClientPaymentsController } from './client-payments.controller';
import { WebhooksController } from './webhooks.controller';
import { VoucherController, VoucherClientController } from './voucher.controller';

/**
 * PaymentsModule — module de paiement SaaS universel (préfixe tables `pay_`).
 *
 * Regroupe :
 *  - la configuration des moyens de paiement (admin) ;
 *  - les paiements manuels (Mobile Money, virement, MTCN, crypto, chèque…) avec
 *    upload de preuve et validation admin ;
 *  - les passerelles électroniques (webhooks signés + idempotents) ;
 *  - les vouchers / codes prépayés à usage unique ;
 *  - le cycle de vie des licences (trial → active → grâce → expiration) et son
 *    planificateur (cron).
 *
 * `ScheduleModule.forRoot()` est activé ici : aucune activation globale de
 * @nestjs/schedule n'existe dans src/app.module.ts (voir payments.module.doc.md).
 * Requiert l'installation de `@nestjs/schedule` et `@nestjs/axios`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      PaymentMethodConfig,
      PaymentTransaction,
      PaymentProof,
      WebhookEvent,
      Voucher,
      Licence,
    ]),
    HttpModule,
    ScheduleModule.forRoot(),
    LicencesModule,
    OffresSaasModule,
    NotificationsModule,
    TenantsModule,
  ],
  controllers: [
    AdminPaymentsController,
    ClientPaymentsController,
    WebhooksController,
    VoucherController,
    VoucherClientController,
  ],
  providers: [
    PaymentConfigService,
    ManualPaymentService,
    ProofStorageService,
    GatewayService,
    // Adaptateurs de passerelle (injectés par GatewayService)
    MonerooGateway,
    CinetpayGateway,
    PaystackGateway,
    FedapayGateway,
    StripeGateway,
    PaypalGateway,
    VoucherService,
    LicenceLifecycleService,
    LicenceSchedulerService,
  ],
  exports: [
    PaymentConfigService,
    ManualPaymentService,
    GatewayService,
    VoucherService,
    LicenceLifecycleService,
  ],
})
export class PaymentsModule {}
