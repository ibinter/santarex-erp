import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiAssistantController } from './ai-assistant.controller';
import { AiAssistantService } from './ai-assistant.service';
import { AiConfig } from './entities/ai-config.entity';
import { AiUsage } from './entities/ai-usage.entity';
import { KnowledgeService } from './knowledge/knowledge.service';
import { OffreSaas } from '../offres-saas/entities/offre-saas.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AiConfig, AiUsage, OffreSaas])],
  controllers: [AiAssistantController],
  providers: [AiAssistantService, KnowledgeService],
})
export class AiAssistantModule {}
