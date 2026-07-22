import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

/**
 * Création (côté STAFF) d'un accès portail pour un patient.
 * L'identifiant peut être fourni ou généré automatiquement s'il est omis.
 * Idem pour le mot de passe (retourné une seule fois, en clair, à l'admin).
 */
export class CreateAccesDto {
  @IsUUID()
  @IsNotEmpty()
  patientId: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  identifiant?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  motDePasse?: string;
}
