import {
  IsString,
  IsOptional,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeVisiteHAD, StatutVisiteHAD } from '../entities/visite-had.entity';

export class CreateVisiteDto {
  @ApiProperty({ description: 'Date et heure planifiées (ISO)' })
  @IsDateString()
  dateVisite: string;

  @ApiProperty({ enum: TypeVisiteHAD })
  @IsEnum(TypeVisiteHAD)
  type: TypeVisiteHAD;

  @ApiPropertyOptional({ description: 'ID de l\'intervenant assigné' })
  @IsOptional()
  @IsString()
  intervenantRef?: string;

  @ApiPropertyOptional({ enum: StatutVisiteHAD })
  @IsOptional()
  @IsEnum(StatutVisiteHAD)
  statut?: StatutVisiteHAD;

  @ApiPropertyOptional({ description: 'Observations' })
  @IsOptional()
  @IsString()
  observations?: string;

  @ApiPropertyOptional({ description: 'Actes réalisés' })
  @IsOptional()
  @IsString()
  actesRealises?: string;

  @ApiPropertyOptional({ description: 'Date de prochaine visite suggérée (ISO)' })
  @IsOptional()
  @IsDateString()
  prochaineVisite?: string;
}
