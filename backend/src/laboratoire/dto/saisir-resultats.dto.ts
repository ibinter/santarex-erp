import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, ValidateNested, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { InterpretationResultat } from '../entities/resultat-analyse.entity';

export class ValeurResultatDto {
  @ApiProperty({ example: 'Hémoglobine' })
  @IsString()
  paramNom: string;

  @ApiProperty({ example: 13.5 })
  valeur: string | number;

  @ApiProperty({ example: 'g/dL' })
  @IsString()
  unite: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valeursNormalesMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  valeursNormalesMax?: number;

  @ApiProperty({ enum: InterpretationResultat })
  @IsEnum(InterpretationResultat)
  interpretation: InterpretationResultat;
}

export class SaisirResultatsDto {
  @ApiProperty({ description: 'ID du type d\'analyse' })
  @IsString()
  typeAnalyseId: string;

  @ApiProperty({ type: [ValeurResultatDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ValeurResultatDto)
  resultats: ValeurResultatDto[];

  @ApiPropertyOptional({ description: 'Commentaire du biologiste' })
  @IsOptional()
  @IsString()
  interpretation?: string;
}

export class SaisirTousResultatsDto {
  @ApiProperty({ type: [SaisirResultatsDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaisirResultatsDto)
  analyses: SaisirResultatsDto[];
}
