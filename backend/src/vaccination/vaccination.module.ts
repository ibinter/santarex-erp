import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vaccin } from './entities/vaccin.entity';
import { VaccinationPatient } from './entities/vaccination-patient.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { VaccinationController } from './vaccination.controller';
import { VaccinationService } from './vaccination.service';

@Module({
  imports: [TypeOrmModule.forFeature([Vaccin, VaccinationPatient, Patient, User])],
  controllers: [VaccinationController],
  providers: [VaccinationService],
  exports: [VaccinationService],
})
export class VaccinationModule {}
