import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Clinique Saint-Joseph', description: 'Nom de l\'établissement' })
  @IsString()
  @IsNotEmpty()
  nomEtablissement: string;

  @ApiProperty({ example: 'Kouassi', description: 'Nom de l\'administrateur' })
  @IsString()
  @IsNotEmpty()
  adminNom: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom de l\'administrateur' })
  @IsString()
  @IsNotEmpty()
  adminPrenom: string;

  @ApiProperty({ example: 'admin@saint-joseph.ci', description: 'Email de l\'administrateur' })
  @IsEmail()
  adminEmail: string;

  @ApiProperty({ example: 'MotDePasse123!', description: 'Mot de passe (8 caractères minimum)' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({ example: '+22507000000' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'CI' })
  @IsOptional()
  @IsString()
  pays?: string;
}
