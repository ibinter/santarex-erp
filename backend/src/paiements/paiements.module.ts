import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Paiement } from './entities/paiement.entity';
import { Facture } from '../facturation/entities/facture.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PaiementsService } from './paiements.service';
import { PaiementsController } from './paiements.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Paiement, Facture, Patient])],
  providers: [PaiementsService],
  controllers: [PaiementsController],
  exports: [PaiementsService],
})
export class PaiementsModule {}
