import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Réinitialisation (côté STAFF) du mot de passe d'un accès portail.
 * Si `motDePasse` est omis, un mot de passe aléatoire est généré et retourné.
 */
export class ResetMotDePasseDto {
  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  motDePasse?: string;
}
