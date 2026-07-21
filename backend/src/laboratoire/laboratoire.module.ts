import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeAnalyse } from './entities/type-analyse.entity';
import { DemandeAnalyse } from './entities/demande-analyse.entity';
import { ResultatAnalyse } from './entities/resultat-analyse.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { LaboratoireController } from './laboratoire.controller';
import { LaboratoireService } from './laboratoire.service';

@Module({
  imports: [TypeOrmModule.forFeature([TypeAnalyse, DemandeAnalyse, ResultatAnalyse, Patient, User])],
  controllers: [LaboratoireController],
  providers: [LaboratoireService],
  exports: [LaboratoireService],
})
export class LaboratoireModule {}
