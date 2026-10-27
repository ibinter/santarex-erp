import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Facture } from './entities/facture.entity';
import { LigneFacture } from './entities/ligne-facture.entity';
import { Patient } from '../patients/entities/patient.entity';
import { FacturationService } from './facturation.service';
import { FacturationController } from './facturation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Facture, LigneFacture, Patient])],
  providers: [FacturationService],
  controllers: [FacturationController],
  exports: [FacturationService],
})
export class FacturationModule {}
