import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutCasier } from '../entities/casier-morgue.entity';

export class CreateCasierDto {
  @ApiProperty({ example: 'CF-01', description: 'Numéro d\'emplacement' })
  @IsString()
  numero: string;

  @ApiPropertyOptional({ example: 'Chambre froide A - rangée 1', description: 'Description / localisation' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: StatutCasier, default: StatutCasier.LIBRE, description: 'Statut initial' })
  @IsOptional()
  @IsEnum(StatutCasier)
  statut?: StatutCasier;

  @ApiPropertyOptional({ default: true, description: 'Casier actif ou non' })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
