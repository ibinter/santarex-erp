import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sauvegarde } from './entities/sauvegarde.entity';
import { SauvegardesController } from './sauvegardes.controller';
import { SauvegardesService } from './sauvegardes.service';

/**
 * Module de sauvegarde / restauration. NON ajouté à app.module.ts
 * volontairement : le câblage dans l'application est décidé par l'orchestrateur.
 */
@Module({
  imports: [TypeOrmModule.forFeature([Sauvegarde])],
  controllers: [SauvegardesController],
  providers: [SauvegardesService],
  exports: [SauvegardesService],
})
export class SauvegardesModule {}
