import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateSurveillanceTravailDto {
  @ApiProperty({ description: 'Heure de l\'observation (ISO)' })
  @IsDateString()
  heure: string;

  @ApiPropertyOptional({ description: 'ID de l\'accouchement associé' })
  @IsOptional()
  @IsString()
  accouchementId?: string;

  @ApiPropertyOptional({ description: 'Dilatation du col en cm (0-10)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(10)
  dilatationCol?: number;

  @ApiPropertyOptional({ description: 'Descente de la présentation' })
  @IsOptional()
  @IsString()
  descentePresentation?: string;

  @ApiPropertyOptional({ description: 'Fréquence des contractions (nb / 10 min)' })
  @IsOptional()
  @IsInt()
  frequenceContractions?: number;

  @ApiPropertyOptional({ description: 'Rythme cardiaque fœtal (bpm)' })
  @IsOptional()
  @IsInt()
  rythmeCardiaqueFoetal?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
