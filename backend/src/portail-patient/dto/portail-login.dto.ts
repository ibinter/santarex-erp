import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/**
 * Connexion patient au portail : (tenantSlug + identifiant + mot de passe).
 * Aucune énumération : toute erreur renvoie le même message générique.
 */
export class PortailLoginDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  tenantSlug: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  identifiant: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  motDePasse: string;
}
