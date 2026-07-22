import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionCaisse } from './entities/session-caisse.entity';
import { Recu } from './entities/recu.entity';
import { CaisseSessionsService } from './caisse-sessions.service';
import { CaisseSessionsController } from './caisse-sessions.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SessionCaisse, Recu])],
  providers: [CaisseSessionsService],
  controllers: [CaisseSessionsController],
  exports: [CaisseSessionsService],
})
export class CaisseSessionsModule {}
