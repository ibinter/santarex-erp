import {
  IsString, IsOptional, IsEnum, IsArray, ArrayNotEmpty,
} from 'class-validator';
import { SeveriteInteraction, GraviteContreIndication } from '../interactions.enums';

/** Corps de la requête de vérification : liste de DCI / médicaments saisis. */
export class VerifierInteractionsDto {
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  medicaments: string[];
}

/** Création d'une interaction dans le référentiel (admin). */
export class CreateInteractionDto {
  @IsString()
  dciA: string;

  @IsString()
  dciB: string;

  @IsEnum(SeveriteInteraction)
  severite: SeveriteInteraction;

  @IsOptional() @IsString()
  mecanisme?: string;

  @IsOptional() @IsString()
  effet?: string;

  @IsOptional() @IsString()
  conduiteATenir?: string;

  @IsOptional() @IsString()
  source?: string;
}

/** Mise à jour d'une interaction (tous champs facultatifs). */
export class UpdateInteractionDto {
  @IsOptional() @IsString()
  dciA?: string;

  @IsOptional() @IsString()
  dciB?: string;

  @IsOptional() @IsEnum(SeveriteInteraction)
  severite?: SeveriteInteraction;

  @IsOptional() @IsString()
  mecanisme?: string;

  @IsOptional() @IsString()
  effet?: string;

  @IsOptional() @IsString()
  conduiteATenir?: string;

  @IsOptional() @IsString()
  source?: string;
}

/** Création d'une contre-indication (admin). */
export class CreateContreIndicationDto {
  @IsString()
  dci: string;

  @IsString()
  condition: string;

  @IsEnum(GraviteContreIndication)
  gravite: GraviteContreIndication;

  @IsOptional() @IsString()
  description?: string;

  @IsOptional() @IsString()
  source?: string;
}
