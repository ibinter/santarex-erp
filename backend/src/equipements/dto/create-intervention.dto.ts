import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import {
  InterventionType,
  InterventionStatut,
} from '../entities/intervention-maintenance.entity';

export class CreateInterventionDto {
  @ApiProperty({ enum: InterventionType })
  @IsEnum(InterventionType)
  type: InterventionType;

  @ApiPropertyOptional({ type: 'string', format: 'date', description: 'Défaut: aujourd\'hui' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Technicien interne (userId)' })
  @IsOptional()
  @IsString()
  technicienRef?: string;

  @ApiPropertyOptional({ description: 'Prestataire externe' })
  @IsOptional()
  @IsString()
  prestataire?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cout?: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  resultat?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  dureeIndispoHeures?: number;

  @ApiPropertyOptional({ enum: InterventionStatut, default: InterventionStatut.TERMINEE })
  @IsOptional()
  @IsEnum(InterventionStatut)
  statut?: InterventionStatut;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @IsDateString()
  prochaineDate?: string;
}
