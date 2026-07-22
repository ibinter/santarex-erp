import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeLigneDevis } from '../entities/ligne-devis.entity';

export class CreateLigneDevisDto {
  @IsOptional()
  @IsEnum(TypeLigneDevis)
  type?: TypeLigneDevis;

  @IsString()
  designation: string;

  @IsNumber()
  @Min(0.01)
  quantite: number;

  @IsNumber()
  @Min(0)
  prixUnitaire: number;
}

export class CreateDevisDto {
  @IsString()
  patientId: string;

  @IsString()
  objet: string;

  @IsOptional()
  @IsDateString()
  dateValidite?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  remisePourcent?: number;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLigneDevisDto)
  lignes?: CreateLigneDevisDto[];
}
