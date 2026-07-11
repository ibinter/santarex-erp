import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PatientUrgence } from './entities/patient-urgence.entity';
import { UrgencesService } from './urgences.service';
import { UrgencesController } from './urgences.controller';

@Module({
  imports: [TypeOrmModule.forFeature([PatientUrgence])],
  providers: [UrgencesService],
  controllers: [UrgencesController],
  exports: [UrgencesService],
})
export class UrgencesModule {}
