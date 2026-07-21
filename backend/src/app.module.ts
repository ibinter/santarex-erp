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
import { AuditLogsModule } from './audit-logs/audit-logs.module';
import { MailModule } from './mail/mail.module';
import { SuperadminModule } from './superadmin/superadmin.module';
import { ExportsModule } from './exports/exports.module';
import { SearchModule } from './search/search.module';
import { PaiementsSaasModule } from './paiements-saas/paiements-saas.module';
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
    PaiementsSaasModule,
    PaymentsModule,
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
    SeedModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
