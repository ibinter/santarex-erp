import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsIn,
  MaxLength,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Clinique Saint-Joseph', description: 'Nom de l\'établissement' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nomEtablissement: string;

  @ApiProperty({ example: 'Kouassi', description: 'Nom de l\'administrateur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  adminNom: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom de l\'administrateur' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  adminPrenom: string;

  @ApiProperty({ example: 'admin@saint-joseph.ci', description: 'Email de l\'administrateur' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'MotDePasse123!', description: 'Mot de passe (8 caractères minimum)' })
  @IsString()
  @MinLength(8)
  @MaxLength(72) // limite de bcrypt
  @Matches(/(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Le mot de passe doit contenir au moins une lettre et un chiffre',
  })
  password: string;

  @ApiPropertyOptional({ example: '+22507000000' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'CI' })
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional({
    example: 'gratuit',
    description:
      "Palier à l'inscription : 'essai' (essai 30j, défaut) ou 'gratuit' "
      + '(palier Découverte, gratuit à vie plafonné à 10 patients).',
    enum: ['essai', 'gratuit'],
  })
  @IsOptional()
  @IsIn(['essai', 'gratuit'])
  palier?: 'essai' | 'gratuit';
}
