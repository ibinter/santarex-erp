import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  Length,
  MaxLength,
} from 'class-validator';
import { DocumentType } from '../verification.enums';

/**
 * Corps de `POST /verification` — enregistre un document vérifiable.
 * Le contenu est fourni SOIT déjà haché (`hash`), SOIT en clair (`contenu`)
 * pour que le service calcule l'empreinte SHA-256 côté serveur.
 */
export class EnregistrerDocumentDto {
  @IsEnum(DocumentType)
  typeDocument: DocumentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reference: string;

  // Nom lisible de la société émettrice.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  tenantNom: string;

  // Empreinte SHA-256 pré-calculée (64 hex). Optionnel si `contenu` est fourni.
  @IsOptional()
  @IsString()
  @Length(64, 64)
  hash?: string;

  // Contenu brut du document à hacher côté serveur. Optionnel si `hash` fourni.
  @IsOptional()
  @IsString()
  contenu?: string;

  // Date d'émission (ISO). Par défaut : maintenant.
  @IsOptional()
  @IsDateString()
  emisLe?: string;
}
