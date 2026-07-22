import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { AccesPortail } from './entities/acces-portail.entity';
import { Patient } from '../patients/entities/patient.entity';
import { RendezVous } from '../rendez-vous/entities/rendez-vous.entity';
import { ResultatAnalyse } from '../laboratoire/entities/resultat-analyse.entity';
import { Ordonnance } from '../consultations/entities/ordonnance.entity';

import { PortailPatientService } from './portail-patient.service';
import { PortailPatientController } from './portail-patient.controller';
import { PortailAccesAdminController } from './portail-acces-admin.controller';
import { PortailMoiController } from './portail-moi.controller';
import { PortailGuard } from './guards/portail.guard';

/**
 * Module PORTAIL PATIENT.
 *
 * - Entités en lecture pour exposer les données du patient (RDV, résultats,
 *   ordonnances) + entité propre `AccesPortail`.
 * - JwtModule sans secret par défaut : la signature/vérification du token
 *   portail se fait avec un secret explicite (JWT_SECRET) et un scope distinct,
 *   sans toucher à la configuration JWT du personnel.
 */
@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([
      AccesPortail,
      Patient,
      RendezVous,
      ResultatAnalyse,
      Ordonnance,
    ]),
  ],
  controllers: [
    PortailPatientController,
    PortailAccesAdminController,
    PortailMoiController,
  ],
  providers: [PortailPatientService, PortailGuard],
})
export class PortailPatientModule {}
