import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDateString } from 'class-validator';

export class CreateMesureCroissanceDto {
  @ApiProperty({ description: 'ID du patient (enfant)' })
  @IsString()
  patientId: string;

  @ApiPropertyOptional({ description: 'Date de la mesure (YYYY-MM-DD). Par défaut aujourd\'hui.' })
  @IsOptional()
  @IsDateString()
  dateMesure?: string;

  @ApiPropertyOptional({ description: 'Poids en kilogrammes' })
  @IsOptional()
  @IsNumber()
  poidsKg?: number;

  @ApiPropertyOptional({ description: 'Taille en centimètres' })
  @IsOptional()
  @IsNumber()
  tailleCm?: number;

  @ApiPropertyOptional({ description: 'Périmètre crânien en centimètres' })
  @IsOptional()
  @IsNumber()
  perimetreCranienCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
