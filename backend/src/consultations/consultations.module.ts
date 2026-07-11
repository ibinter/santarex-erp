import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConsultationsController } from './consultations.controller';
import { ConsultationsService } from './consultations.service';
import { Consultation } from './entities/consultation.entity';
import { Ordonnance } from './entities/ordonnance.entity';
import { RendezVousModule } from '../rendez-vous/rendez-vous.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Consultation, Ordonnance]),
    RendezVousModule,
  ],
  controllers: [ConsultationsController],
  providers: [ConsultationsService],
  exports: [ConsultationsService],
})
export class ConsultationsModule {}
