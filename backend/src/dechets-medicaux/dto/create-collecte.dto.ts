import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
} from 'class-validator';
import {
  CategorieDechet,
  TypeConditionnement,
} from '../entities/collecte-dechets.entity';

export class CreateCollecteDto {
  @ApiProperty({ enum: CategorieDechet })
  @IsEnum(CategorieDechet)
  categorie: CategorieDechet;

  @ApiProperty({ example: 'Bloc opératoire' })
  @IsString()
  serviceProducteur: string;

  @ApiPropertyOptional({ example: 'Salle 2' })
  @IsOptional()
  @IsString()
  uniteProducteur?: string;

  @ApiProperty({ example: 3.5 })
  @IsNumber()
  @Min(0)
  poidsKg: number;

  @ApiProperty({ enum: TypeConditionnement })
  @IsEnum(TypeConditionnement)
  typeConditionnement: TypeConditionnement;

  @ApiProperty({ example: '2026-07-22T08:30:00.000Z' })
  @IsDateString()
  dateCollecte: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agentRef?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  observations?: string;
}
