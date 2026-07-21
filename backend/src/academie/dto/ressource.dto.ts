import {
  IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min, IsUUID,
} from 'class-validator';
import { RessourceType } from '../academie.enums';

/** Création d'une ressource pédagogique dans un parcours (admin). */
export class CreateRessourceDto {
  @IsUUID()
  parcoursId: string;

  @IsOptional() @IsEnum(RessourceType)
  type?: RessourceType;

  @IsString()
  titre: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  duree?: number;

  // URL réelle uniquement. Laisser vide tant que le contenu n'existe pas.
  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  miniatureUrl?: string;

  @IsOptional() @IsString()
  moduleAssocie?: string;

  @IsOptional() @IsString()
  langue?: string;

  @IsOptional() @IsString()
  versionCompatible?: string;

  @IsOptional() @IsInt() @Min(0)
  ordre?: number;

  @IsOptional() @IsBoolean()
  estPublie?: boolean;

  // Le contenu réel est-il disponible ? false => badge « Bientôt disponible ».
  @IsOptional() @IsBoolean()
  contenuDisponible?: boolean;
}

/** Mise à jour d'une ressource (tous champs facultatifs). */
export class UpdateRessourceDto {
  @IsOptional() @IsEnum(RessourceType)
  type?: RessourceType;

  @IsOptional() @IsString()
  titre?: string;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsInt() @Min(0)
  duree?: number;

  @IsOptional() @IsString()
  url?: string;

  @IsOptional() @IsString()
  miniatureUrl?: string;

  @IsOptional() @IsString()
  moduleAssocie?: string;

  @IsOptional() @IsString()
  langue?: string;

  @IsOptional() @IsString()
  versionCompatible?: string;

  @IsOptional() @IsInt() @Min(0)
  ordre?: number;

  @IsOptional() @IsBoolean()
  estPublie?: boolean;

  @IsOptional() @IsBoolean()
  contenuDisponible?: boolean;
}

/** Marquer la progression d'une ressource. */
export class MarquerProgressionDto {
  @IsOptional() @IsEnum(['en_cours', 'termine'])
  statut?: 'en_cours' | 'termine';
}
