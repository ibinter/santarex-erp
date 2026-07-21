import {
  IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min,
} from 'class-validator';
import { ParcoursCategorie, ParcoursNiveau } from '../academie.enums';

/** Création d'un parcours de formation (admin). */
export class CreateParcoursDto {
  @IsString()
  titre: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(ParcoursCategorie)
  categorie?: ParcoursCategorie;

  @IsOptional() @IsEnum(ParcoursNiveau)
  niveau?: ParcoursNiveau;

  @IsOptional() @IsInt() @Min(0)
  ordre?: number;

  @IsOptional() @IsBoolean()
  estPublie?: boolean;

  @IsOptional() @IsString()
  iconeUrl?: string;
}

/** Mise à jour d'un parcours (tous champs facultatifs). */
export class UpdateParcoursDto {
  @IsOptional() @IsString()
  titre?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsEnum(ParcoursCategorie)
  categorie?: ParcoursCategorie;

  @IsOptional() @IsEnum(ParcoursNiveau)
  niveau?: ParcoursNiveau;

  @IsOptional() @IsInt() @Min(0)
  ordre?: number;

  @IsOptional() @IsBoolean()
  estPublie?: boolean;

  @IsOptional() @IsString()
  iconeUrl?: string;
}
