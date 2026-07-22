import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CleApi } from './entities/cle-api.entity';
import { Webhook } from './entities/webhook.entity';
import { ConfigInterface } from './entities/config-interface.entity';
import { MessageInterop } from './entities/message-interop.entity';

import { InteroperabiliteService } from './interoperabilite.service';
import { InteroperabiliteController } from './interoperabilite.controller';
import { ApiPublicController } from './api-public.controller';
import { InteropIngestionController } from './interop-ingestion.controller';
import { ApiKeyGuard } from './guards/api-key.guard';

import { PatientsModule } from '../patients/patients.module';

/**
 * Module d'interopérabilité / API publique.
 *
 * - Console admin (`/interoperabilite/*`) : clés API, webhooks, interfaces,
 *   journal, stats — protégée JWT + rôles ADMIN/DIRECTEUR.
 * - API publique (`/api-public/*`) et ingestion (`/interop/*`) : protégées par
 *   ApiKeyGuard (en-tête X-API-Key), scoping tenant strict.
 *
 * `InteroperabiliteService` est exporté pour que les modules métier puissent
 * appeler `declencher(tenantId, event, payload)` afin d'émettre des webhooks.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([CleApi, Webhook, ConfigInterface, MessageInterop]),
    PatientsModule,
  ],
  controllers: [
    InteroperabiliteController,
    ApiPublicController,
    InteropIngestionController,
  ],
  providers: [InteroperabiliteService, ApiKeyGuard],
  exports: [InteroperabiliteService],
})
export class InteroperabiliteModule {}
