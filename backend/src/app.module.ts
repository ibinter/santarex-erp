import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { OffresSaasModule } from './offres-saas/offres-saas.module';
import { LicencesModule } from './licences/licences.module';
import { PaymentsModule } from './payments/payments.module';
import { EntitlementModule } from './common/entitlement.module';
import { ComptabiliteModule } from './comptabilite/comptabilite.module';
import { RhModule } from './rh/rh.module';
import { BlocOperatoireModule } from './bloc-operatoire/bloc-operatoire.module';
import { ImagerieModule } from './imagerie/imagerie.module';
import { ImportsModule } from './imports/imports.module';
import { VerificationModule } from './verification/verification.module';
import { CrmModule } from './crm/crm.module';
import { OffresCommercialesModule } from './offres-commerciales/offres-commerciales.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { AcademieModule } from './academie/academie.module';
import { SauvegardesModule } from './sauvegardes/sauvegardes.module';
import { HealthModule } from './health/health.module';
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { MailModule } from './mail/mail.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { ExportsModule } from './exports/exports.module';
import { SearchModule } from './search/search.module';
import { AiAssistantModule } from './ai-assistant/ai-assistant.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SupportTicketsModule } from './support-tickets/support-tickets.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { PatientsModule } from './patients/patients.module';
import { DmeModule } from './dme/dme.module';
import { RendezVousModule } from './rendez-vous/rendez-vous.module';
import { ConsultationsModule } from './consultations/consultations.module';
import { FacturationModule } from './facturation/facturation.module';
import { PaiementsModule } from './paiements/paiements.module';
import { UrgencesModule } from './urgences/urgences.module';
import { PharmacieModule } from './pharmacie/pharmacie.module';
import { LaboratoireModule } from './laboratoire/laboratoire.module';
import { HospitalisationModule } from './hospitalisation/hospitalisation.module';
// Vague 1 — nouveaux modules hospitaliers
import { MaterniteModule } from './maternite/maternite.module';
import { PriseEnChargeModule } from './prise-en-charge/prise-en-charge.module';
import { ApprovisionnementModule } from './approvisionnement/approvisionnement.module';
import { InteractionsModule } from './interactions-medicamenteuses/interactions.module';
import { IncidentsQualiteModule } from './incidents-qualite/incidents-qualite.module';
// Vague 2 — nouveaux modules hospitaliers
import { PediatrieModule } from './pediatrie/pediatrie.module';
import { BanqueSangModule } from './banque-sang/banque-sang.module';
import { SterilisationModule } from './sterilisation/sterilisation.module';
import { ConsentementsModule } from './consentements/consentements.module';
import { SoinsInfirmiersModule } from './soins-infirmiers/soins-infirmiers.module';
import { SeedModule } from './database/seed.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USER', 'santarex'),
        password: configService.get('DB_PASSWORD', 'santarex_secure_password'),
        database: configService.get('DB_NAME', 'santarex_db'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    AuditLogsModule,
    MailModule,
    SuperadminModule,
    ExportsModule,
    SearchModule,
    PaymentsModule,
    EntitlementModule,
    AiAssistantModule,
    NotificationsModule,
    SupportTicketsModule,
    TenantsModule,
    OffresSaasModule,
    LicencesModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    DmeModule,
    RendezVousModule,
    ConsultationsModule,
    FacturationModule,
    PaiementsModule,
    UrgencesModule,
    PharmacieModule,
    LaboratoireModule,
    HospitalisationModule,
    ComptabiliteModule,
    RhModule,
    BlocOperatoireModule,
    ImagerieModule,
    ImportsModule,
    VerificationModule,
    CrmModule,
    OffresCommercialesModule,
    AnalyticsModule,
    AcademieModule,
    SauvegardesModule,
    MaterniteModule,
    PriseEnChargeModule,
    ApprovisionnementModule,
    InteractionsModule,
    IncidentsQualiteModule,
    PediatrieModule,
    BanqueSangModule,
    SterilisationModule,
    ConsentementsModule,
    SoinsInfirmiersModule,
    HealthModule,
    SeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    // ────────────────────────────────────────────────────────────────────────
    //  APPLICATION DE LICENCE / ENTITLEMENT MODULE — décision de câblage
    //  ────────────────────────────────────────────────────────────────────────
    //  `LicenceGuard` et `ModuleGuard` (src/common/guards) ne sont VOLONTAIREMENT
    //  PAS enregistrés en APP_GUARD ici. Motif : cette application n'a PAS de
    //  JwtAuthGuard GLOBAL — le JWT est appliqué par contrôleur via
    //  `@UseGuards(JwtAuthGuard)`. Or les gardes globaux (APP_GUARD) s'exécutent
    //  AVANT les gardes de contrôleur : `req.user` ne serait pas encore posé et
    //  les gardes de licence ne verraient jamais le tenant (donc aucun effet).
    //
    //  Ils sont donc EXPOSÉS (providers/exports de PaymentsModule) pour être
    //  appliqués PAR CONTRÔLEUR, APRÈS l'auth :
    //      @UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
    //
    //  Détails et procédure : src/common/guards/README-licence-enforcement.md
    // ────────────────────────────────────────────────────────────────────────
  ],
})
export class AppModule {}
