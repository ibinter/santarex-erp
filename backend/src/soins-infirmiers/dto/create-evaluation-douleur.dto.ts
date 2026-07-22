import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EchelleDouleur } from '../entities/evaluation-douleur.entity';

export class CreateEvaluationDouleurDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation' })
  @IsOptional()
  @IsUUID()
  sejourId?: string;

  @ApiPropertyOptional({ description: 'Date et heure (ISO). Défaut: maintenant' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ enum: EchelleDouleur, description: 'Échelle utilisée' })
  @IsEnum(EchelleDouleur)
  echelle: EchelleDouleur;

  @ApiProperty({ description: 'Score sur l\'échelle', minimum: 0, maximum: 15 })
  @IsInt()
  @Min(0)
  @Max(15)
  score: number;

  @ApiPropertyOptional({ description: 'Localisation de la douleur' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ description: 'Traitement antalgique administré' })
  @IsOptional()
  @IsString()
  traitementAdministre?: string;

  @ApiPropertyOptional({ description: 'Date/heure de réévaluation (ISO)' })
  @IsOptional()
  @IsDateString()
  reevaluation?: string;
}
