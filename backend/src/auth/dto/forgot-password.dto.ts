import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'admin@saint-joseph.ci' })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    example: 'clinique-saint-joseph',
    description: 'Identifiant de l\'établissement (optionnel)',
  })
  @IsOptional()
  @IsString()
  tenantId?: string;
}
