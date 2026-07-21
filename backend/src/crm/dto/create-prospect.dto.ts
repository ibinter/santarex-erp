import {
  IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsInt, Min, Max, IsDateString,
} from 'class-validator';
import { ProspectStatut, ProspectOrigine } from '../crm.enums';

/** Création manuelle d'un prospect par le superadmin. */
export class CreateProspectDto {
  @IsString()
  nom: string;

  @IsOptional() @IsString()
  prenom?: string;

  @IsOptional() @IsString()
  entreprise?: string;

  @IsOptional() @IsString()
  fonction?: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  telephone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsOptional() @IsString()
  pays?: string;

  @IsOptional() @IsString()
  secteur?: string;

  @IsOptional() @IsString()
  taille?: string;

  @IsOptional() @IsString()
  logiciel?: string;

  @IsOptional() @IsString()
  besoin?: string;

  @IsOptional() @IsString()
  budgetIndicatif?: string;

  @IsOptional() @IsEnum(ProspectOrigine)
  origine?: ProspectOrigine;

  @IsOptional() @IsEnum(ProspectStatut)
  statut?: ProspectStatut;

  @IsOptional() @IsInt() @Min(0) @Max(100)
  score?: number;

  @IsOptional() @IsBoolean()
  consentement?: boolean;

  @IsOptional() @IsString()
  notes?: string;

  @IsOptional() @IsString()
  prochaineAction?: string;

  @IsOptional() @IsDateString()
  dateRelance?: string;

  @IsOptional() @IsString()
  agentAssigne?: string;
}
