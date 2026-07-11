import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'medecin@clinique.ci' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'clinique-saint-joseph', description: 'Identifiant de l\'établissement (tenant)' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;
}
