import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutIntervention } from '../entities/intervention.entity';

export class ChangerStatutInterventionDto {
  @ApiProperty({ enum: StatutIntervention, description: 'Nouveau statut de l\'intervention' })
  @IsEnum(StatutIntervention)
  statut: StatutIntervention;

  @ApiPropertyOptional({ description: 'Compte-rendu opératoire (à la clôture)' })
  @IsOptional()
  @IsString()
  compteRendu?: string;
}
