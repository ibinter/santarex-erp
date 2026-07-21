import {
  IsString,
  IsInt,
  IsEmail,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  IsDateString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OptionOffreDto {
  @IsString()
  libelle: string;

  @IsInt()
  @Min(0)
  prix: number;
}

export class EcheanceDto {
  @IsString()
  libelle: string;

  @IsInt()
  @Min(0)
  montant: number;

  @IsOptional()
  @IsString()
  echeance?: string;
}

export class CreateOffreCommercialeDto {
  @IsOptional()
  @IsString()
  prospectId?: string;

  @IsString()
  clientNom: string;

  @IsEmail()
  clientEmail: string;

  @IsOptional()
  @IsString()
  logiciel?: string;

  @IsOptional()
  @IsString()
  formule?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modules?: string[];

  @IsOptional()
  @IsInt()
  @Min(1)
  nbUtilisateurs?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  nbSites?: number;

  @IsOptional()
  @IsString()
  duree?: string;

  @IsOptional()
  @IsString()
  devise?: string;

  @IsInt()
  @Min(0)
  prixHT: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  remise?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OptionOffreDto)
  options?: OptionOffreDto[];

  @IsOptional()
  @IsString()
  formation?: string;

  @IsOptional()
  @IsString()
  migration?: string;

  @IsOptional()
  @IsString()
  accompagnement?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EcheanceDto)
  echeancier?: EcheanceDto[];

  @IsOptional()
  @IsDateString()
  dateValidite?: string;

  @IsOptional()
  @IsString()
  conditions?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
