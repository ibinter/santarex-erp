import {
  IsString, IsOptional, IsEmail, IsEnum, IsBoolean, IsDateString, IsUUID,
} from 'class-validator';
import { DemandeDemoStatut, ModeDemo } from '../crm.enums';

/**
 * Body du formulaire PUBLIC de la landing : POST /crm/demande-demo (SANS guard).
 * Anti-spam basique : email requis + consentement requis (validés dans le
 * service). `whitelist + forbidNonWhitelisted` globaux rejettent tout champ
 * inconnu.
 */
export class DemandeDemoPubliqueDto {
  @IsString()
  nom: string;

  @IsOptional() @IsString()
  prenom?: string;

  @IsOptional() @IsString()
  entreprise?: string;

  @IsOptional() @IsString()
  fonction?: string;

  @IsOptional() @IsString()
  pays?: string;

  @IsOptional() @IsString()
  telephone?: string;

  @IsOptional() @IsString()
  whatsapp?: string;

  @IsEmail()
  email: string;

  @IsOptional() @IsString()
  taille?: string;

  @IsOptional() @IsString()
  secteur?: string;

  // Logiciel actuel éventuel (affiché dans l'email de confirmation).
  @IsOptional() @IsString()
  logiciel?: string;

  @IsOptional() @IsString()
  besoin?: string;

  @IsOptional() @IsDateString()
  dateSouhaitee?: string;

  @IsOptional() @IsEnum(ModeDemo)
  modeDemo?: ModeDemo;

  // Requis (anti-spam / RGPD) — vérifié aussi côté service.
  @IsBoolean()
  consentement: boolean;
}

/** Création d'une demande de démo par le superadmin (prospect existant). */
export class CreateDemandeDemoDto {
  @IsUUID()
  prospectId: string;

  @IsOptional() @IsDateString()
  dateSouhaitee?: string;

  @IsOptional() @IsEnum(ModeDemo)
  modeDemo?: ModeDemo;

  @IsOptional() @IsString()
  agentAssigne?: string;

  @IsOptional() @IsString()
  lienVisio?: string;
}

/** Mise à jour d'une demande de démo (planification, réalisation…). */
export class UpdateDemandeDemoDto {
  @IsOptional() @IsEnum(DemandeDemoStatut)
  statut?: DemandeDemoStatut;

  @IsOptional() @IsDateString()
  dateSouhaitee?: string;

  @IsOptional() @IsEnum(ModeDemo)
  modeDemo?: ModeDemo;

  @IsOptional() @IsString()
  agentAssigne?: string;

  @IsOptional() @IsString()
  lienVisio?: string;

  @IsOptional() @IsString()
  compteRendu?: string;

  @IsOptional() @IsString()
  tenantCree?: string;
}
