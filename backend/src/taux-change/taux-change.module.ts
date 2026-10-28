import { Module } from '@nestjs/common';
import { TauxChangeController } from './taux-change.controller';
import { TauxChangeService } from './taux-change.service';

@Module({
  controllers: [TauxChangeController],
  providers: [TauxChangeService],
  exports: [TauxChangeService],
})
export class TauxChangeModule {}
