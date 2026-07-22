import { IsEnum, IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ResultatIndicateur } from '../entities/lot-sterilisation.entity';

export class ValiderCycleDto {
  @ApiProperty({ enum: ResultatIndicateur, description: 'Résultat de l\'indicateur de conformité' })
  @IsEnum(ResultatIndicateur)
  resultatIndicateur: ResultatIndicateur;

  @ApiPropertyOptional({ description: 'Durée de validité de la stérilité en jours (si conforme)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  dureeValiditeJours?: number;

  @ApiPropertyOptional({ description: 'Observations de validation' })
  @IsOptional()
  @IsString()
  observations?: string;
}
