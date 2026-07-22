import {
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CanalMessage, CodeModeleMessage } from '../entities/modele-message.entity';

/**
 * Envoi unitaire. Deux modes :
 *  - fournir `modeleCode` + `variables` (le contenu est composé depuis le modèle),
 *  - ou fournir directement `contenu` (texte libre).
 */
export class EnvoiMessageDto {
  /** Patient destinataire (optionnel : le numéro peut être fourni directement). */
  @IsOptional()
  @IsString()
  patientId?: string;

  /** Numéro destinataire. Requis si aucun patientId fourni. */
  @IsOptional()
  @IsString()
  destinataire?: string;

  @IsOptional()
  @IsEnum(CanalMessage)
  canal?: CanalMessage;

  @IsOptional()
  @IsEnum(CodeModeleMessage)
  modeleCode?: CodeModeleMessage;

  @IsOptional()
  @IsString()
  @MinLength(1)
  contenu?: string;

  @IsOptional()
  @IsObject()
  variables?: Record<string, string | number>;

  /** Référence de l'objet source (ex. rdvId) pour l'idempotence. */
  @IsOptional()
  @IsString()
  referenceObjet?: string;
}
