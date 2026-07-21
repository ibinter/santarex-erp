import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';

/**
 * HealthModule — observabilité réelle (DB/SMTP/IA/disque/mémoire).
 *
 * À CÂBLER MANUELLEMENT dans AppModule (non ajouté automatiquement).
 * Dépendances : DataSource (TypeORM) et ConfigService, tous deux fournis
 * globalement par AppModule — aucun import supplémentaire nécessaire ici.
 */
@Module({
  controllers: [HealthController],
  providers: [HealthService],
  exports: [HealthService],
})
export class HealthModule {}
