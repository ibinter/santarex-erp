import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from '../patients/entities/patient.entity';
import { ImportLog } from './entities/import-log.entity';
import { ImportsController } from './imports.controller';
import { ImportsService } from './imports.service';

/**
 * Moteur d'import universel XLSX/CSV. Aujourd'hui : patients.
 * À câbler dans app.module.ts (fait manuellement, hors périmètre agent).
 */
@Module({
  imports: [TypeOrmModule.forFeature([Patient, ImportLog])],
  controllers: [ImportsController],
  providers: [ImportsService],
  exports: [ImportsService],
})
export class ImportsModule {}
