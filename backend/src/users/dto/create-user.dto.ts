import { IsEmail, IsString, MinLength, IsNotEmpty, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'medecin@clinique.ci' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'MotDePasse123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Jean' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Kouassi' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEDECIN })
  @IsEnum(UserRole)
  role: UserRole;

  // Facultatif côté requête : le contrôleur impose TOUJOURS l'établissement de l'administrateur connecté
  // (isolation entre établissements). Un `tenantId` envoyé par le navigateur est ignoré.
  @ApiPropertyOptional({ example: 'clinique-saint-joseph', description: "Ignoré : l'établissement est celui de l'administrateur connecté." })
  @IsOptional()
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
