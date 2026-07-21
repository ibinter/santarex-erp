import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientUrgence } from './entities/patient-urgence.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { UrgencesService } from './urgences.service';
import { UrgencesController } from './urgences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PatientUrgence, Patient, User])],
  providers: [UrgencesService],
  controllers: [UrgencesController],
  exports: [UrgencesService],
})
export class UrgencesModule {}
