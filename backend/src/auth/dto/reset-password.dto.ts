import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Identifiant de l\'utilisateur (uid du lien de réinitialisation)' })
  @IsString()
  @IsNotEmpty()
  uid: string;

  @ApiProperty({ description: 'Token de réinitialisation reçu par email' })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NouveauMotDePasse123!', description: 'Nouveau mot de passe (8 caractères minimum)' })
  @IsString()
  @MinLength(8)
  password: string;
}
