import {
  IsUUID,
  IsInt,
  IsOptional,
  IsString,
  IsBoolean,
  IsEnum,
  IsDateString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { VoieVaccination } from '../entities/vaccination-patient.entity';

/** Payload d'enregistrement d'une dose administrée. */
export class EnregistrerVaccinationDto {
  @ApiProperty()
  @IsUUID()
  patientId: string;

  @ApiProperty()
  @IsUUID()
  vaccinId: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  doseNumero?: number;

  @ApiPropertyOptional({ description: 'Date d\'administration (ISO). Défaut : maintenant.' })
  @IsOptional()
  @IsDateString()
  dateAdministration?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional({ enum: VoieVaccination })
  @IsOptional()
  @IsEnum(VoieVaccination)
  voie?: VoieVaccination;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteInjection?: string;

  @ApiPropertyOptional({ description: 'ID du vaccinateur (User)' })
  @IsOptional()
  @IsString()
  vaccinateurRef?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  aDeclarer?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
