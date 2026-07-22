import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutPlanSoins } from '../entities/plan-soins.entity';

export class CreatePlanSoinsDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation' })
  @IsOptional()
  @IsUUID()
  sejourId?: string;

  @ApiProperty({ description: 'Diagnostic infirmier' })
  @IsString()
  diagnostic: string;

  @ApiProperty({ description: 'Objectif de soin' })
  @IsString()
  objectif: string;

  @ApiPropertyOptional({ description: 'Interventions planifiées' })
  @IsOptional()
  @IsString()
  interventions?: string;

  @ApiPropertyOptional({ description: 'Échéance (ISO)' })
  @IsOptional()
  @IsDateString()
  echeance?: string;

  @ApiPropertyOptional({ enum: StatutPlanSoins, description: 'Statut du plan' })
  @IsOptional()
  @IsEnum(StatutPlanSoins)
  statut?: StatutPlanSoins;
}

export class UpdatePlanSoinsDto {
  @ApiPropertyOptional({ description: 'Diagnostic infirmier' })
  @IsOptional()
  @IsString()
  diagnostic?: string;

  @ApiPropertyOptional({ description: 'Objectif de soin' })
  @IsOptional()
  @IsString()
  objectif?: string;

  @ApiPropertyOptional({ description: 'Interventions planifiées' })
  @IsOptional()
  @IsString()
  interventions?: string;

  @ApiPropertyOptional({ description: 'Échéance (ISO)' })
  @IsOptional()
  @IsDateString()
  echeance?: string;

  @ApiPropertyOptional({ enum: StatutPlanSoins, description: 'Statut du plan' })
  @IsOptional()
  @IsEnum(StatutPlanSoins)
  statut?: StatutPlanSoins;
}
