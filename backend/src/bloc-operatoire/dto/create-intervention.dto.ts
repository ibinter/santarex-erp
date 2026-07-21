import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInterventionDto {
  @ApiProperty({ description: 'UUID du patient à opérer' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'UUID du chirurgien référent' })
  @IsUUID()
  chirurgienId: string;

  @ApiPropertyOptional({ description: 'UUID de l\'anesthésiste (optionnel)' })
  @IsOptional()
  @IsUUID()
  anesthesisteId?: string;

  @ApiProperty({ description: 'UUID de la salle d\'opération' })
  @IsUUID()
  salleId: string;

  @ApiProperty({ example: 'Appendicectomie', description: 'Type / libellé de l\'intervention' })
  @IsString()
  typeIntervention: string;

  @ApiProperty({ description: 'Date et heure prévues (ISO 8601)' })
  @IsDateString()
  dateHeurePrevue: string;

  @ApiProperty({ example: 90, description: 'Durée estimée en minutes' })
  @IsInt()
  @Min(1)
  dureeEstimee: number;

  @ApiPropertyOptional({ default: false, description: 'Intervention urgente' })
  @IsOptional()
  @IsBoolean()
  urgence?: boolean;
}
