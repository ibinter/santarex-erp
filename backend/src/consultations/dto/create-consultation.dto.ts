import {
  IsString,
  IsDateString,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { TypeConsultation } from '../entities/consultation.entity';

export class CreateConsultationDto {
  @IsString()
  patientId: string;

  @IsString()
  medecinId: string;

  @IsOptional()
  @IsString()
  rendezVousId?: string;

  @IsDateString()
  dateHeure: string;

  @IsEnum(TypeConsultation)
  type: TypeConsultation;

  @IsString()
  motif: string;

  @IsOptional()
  @IsString()
  anamnese?: string;

  @IsOptional()
  @IsString()
  examenClinique?: string;

  @IsOptional()
  @IsString()
  tensionArterielle?: string;

  @IsOptional()
  @IsNumber()
  frequenceCardiaque?: number;

  @IsOptional()
  @IsNumber()
  temperature?: number;

  @IsOptional()
  @IsNumber()
  poidsKg?: number;

  @IsOptional()
  @IsNumber()
  tailleCm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  saturationO2?: number;

  @IsOptional()
  @IsString()
  diagnostic?: string;

  @IsOptional()
  @IsString()
  codeCIM10?: string;

  @IsOptional()
  @IsString()
  conclusion?: string;

  @IsOptional()
  @IsString()
  planSoins?: string;

  @IsOptional()
  @IsNumber()
  prochainRdvJours?: number;
}
