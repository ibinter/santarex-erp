import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sauvegarde } from './entities/sauvegarde.entity';
import { SauvegardesController } from './sauvegardes.controller';
import { SauvegardesService } from './sauvegardes.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

/**
 * Module de sauvegarde / restauration. NON ajouté à app.module.ts
 * volontairement : le câblage dans l'application est décidé par l'orchestrateur.
 *
 * AuditLogsModule est @Global (import redondant mais explicite ici pour la
 * lisibilité de la dépendance de journalisation). ScheduleModule.forRoot() est
 * supposé actif globalement (app.module) : le @Cron de SauvegardesService — déjà
 * enregistré comme provider ci-dessous — est alors découvert automatiquement.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Sauvegarde]), AuditLogsModule],
  controllers: [SauvegardesController],
  providers: [SauvegardesService],
  exports: [SauvegardesService],
})
export class SauvegardesModule {}
