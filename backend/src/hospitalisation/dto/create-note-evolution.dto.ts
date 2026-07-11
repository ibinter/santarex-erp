import { IsEnum, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeNoteEvolution } from '../entities/note-evolution.entity';

export class CreateNoteEvolutionDto {
  @ApiProperty({ enum: TypeNoteEvolution, description: 'Type de note médicale' })
  @IsEnum(TypeNoteEvolution)
  type: TypeNoteEvolution;

  @ApiProperty({ description: 'Contenu de la note' })
  @IsString()
  contenu: string;

  @ApiPropertyOptional({ example: '120/80', description: 'Tension artérielle (ex: 120/80 mmHg)' })
  @IsOptional()
  @IsString()
  tensionArterielle?: string;

  @ApiPropertyOptional({ example: 72, description: 'Fréquence cardiaque en bpm' })
  @IsOptional()
  @IsNumber()
  frequenceCardiaque?: number;

  @ApiPropertyOptional({ example: 37.5, description: 'Température en degrés Celsius' })
  @IsOptional()
  @IsNumber()
  temperature?: number;

  @ApiPropertyOptional({ example: 98, description: 'Saturation en O2 en %' })
  @IsOptional()
  @IsNumber()
  saturationO2?: number;

  @ApiPropertyOptional({ example: 70.5, description: 'Poids en kilogrammes' })
  @IsOptional()
  @IsNumber()
  poidsKg?: number;
}
