import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Lit } from './entities/lit.entity';
import { Sejour } from './entities/sejour.entity';
import { NoteEvolution } from './entities/note-evolution.entity';
import { SoinInfirmier } from './entities/soin-infirmier.entity';
import { Patient } from '../patients/entities/patient.entity';
import { User } from '../users/entities/user.entity';
import { HospitalisationService } from './hospitalisation.service';
import { HospitalisationController } from './hospitalisation.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Lit, Sejour, NoteEvolution, SoinInfirmier, Patient, User])],
  providers: [HospitalisationService],
  controllers: [HospitalisationController],
  exports: [HospitalisationService],
})
export class HospitalisationModule {}
