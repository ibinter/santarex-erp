import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExportsService } from './exports.service';
import { ExportsController } from './exports.controller';
import { Patient } from '../patients/entities/patient.entity';
import { Medicament } from '../pharmacie/entities/medicament.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Medicament])],
  controllers: [ExportsController],
  providers: [ExportsService],
  exports: [ExportsService],
})
export class ExportsModule {}
