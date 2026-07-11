import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsNumber,
  Min,
} from 'class-validator';
import { MedicamentForme, MedicamentCategorie } from '../entities/medicament.entity';

export class CreateMedicamentDto {
  @ApiProperty({ example: 'Amoxicilline' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: 'Clamoxyl' })
  @IsOptional()
  @IsString()
  nomCommercial?: string;

  @ApiPropertyOptional({ example: 'Amoxicilline' })
  @IsOptional()
  @IsString()
  dci?: string;

  @ApiProperty({ enum: MedicamentForme })
  @IsEnum(MedicamentForme)
  forme: MedicamentForme;

  @ApiProperty({ example: '500mg' })
  @IsString()
  dosage: string;

  @ApiProperty({ example: 'comprimé' })
  @IsString()
  unite: string;

  @ApiProperty({ enum: MedicamentCategorie })
  @IsEnum(MedicamentCategorie)
  categorie: MedicamentCategorie;

  @ApiPropertyOptional({ example: 'Beta-lactamines' })
  @IsOptional()
  @IsString()
  classeTherapeutique?: string;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMinimum?: number;

  @ApiPropertyOptional({ default: 1000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  stockMaximum?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixUnitaire?: number;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixVente?: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  prescriptionRequise?: boolean;
}
