import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facture } from './entities/facture.entity';
import { LigneFacture } from './entities/ligne-facture.entity';
import { FacturationService } from './facturation.service';
import { FacturationController } from './facturation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Facture, LigneFacture])],
  providers: [FacturationService],
  controllers: [FacturationController],
  exports: [FacturationService],
})
export class FacturationModule {}
