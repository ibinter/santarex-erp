import { PartialType } from '@nestjs/swagger';
import { IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreatePatientDto } from './create-patient.dto';
import { PatientStatut } from '../entities/patient.entity';

export class UpdatePatientDto extends PartialType(CreatePatientDto) {
  @ApiPropertyOptional({ enum: PatientStatut, description: 'Statut du dossier patient' })
  @IsOptional()
  @IsEnum(PatientStatut)
  statut?: PatientStatut;
}
