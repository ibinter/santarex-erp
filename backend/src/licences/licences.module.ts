import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Licence } from './entities/licence.entity';
import { User } from '../users/entities/user.entity';
import { LicencesController } from './licences.controller';
import { LicencesService } from './licences.service';
import { OffresSaasModule } from '../offres-saas/offres-saas.module';
import { TenantsModule } from '../tenants/tenants.module';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * `User` est enregistré ici en LECTURE SEULE (comptage des utilisateurs actifs
 * par tenant) pour l'application du plafond `maxUtilisateurs` — le module `users`
 * n'est pas modifié. AuditLogsModule et MailModule sont @Global ; AuditLogsModule
 * est importé explicitement pour rendre la dépendance de journalisation lisible,
 * MailService reste injecté via son enregistrement global.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([Licence, User]),
    OffresSaasModule,
    TenantsModule,
    AuditLogsModule,
  ],
  controllers: [LicencesController],
  providers: [LicencesService],
  exports: [LicencesService],
})
export class LicencesModule {}
