import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MesureCroissance } from './entities/mesure-croissance.entity';
import { VaccinationEnfant } from './entities/vaccination-enfant.entity';
import { CalendrierVaccinalPediatrique } from './entities/calendrier-vaccinal.entity';
import { Patient } from '../patients/entities/patient.entity';
import { PediatrieController } from './pediatrie.controller';
import { PediatrieService } from './pediatrie.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MesureCroissance,
      VaccinationEnfant,
      CalendrierVaccinalPediatrique,
      Patient,
    ]),
  ],
  controllers: [PediatrieController],
  providers: [PediatrieService],
  exports: [PediatrieService],
})
export class PediatrieModule {}
