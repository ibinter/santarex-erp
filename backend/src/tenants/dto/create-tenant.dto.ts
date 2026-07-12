import { IsString, IsEnum, IsOptional, IsEmail, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TenantStatut, TenantType } from '../entities/tenant.entity';

export class CreateTenantDto {
  @ApiProperty({ example: 'clinique-saint-joseph' })
  @IsString()
  slug: string;

  @ApiProperty({ example: 'Clinique Saint-Joseph' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ enum: TenantType })
  @IsOptional()
  @IsEnum(TenantType)
  type?: TenantType;

  @ApiPropertyOptional({ example: 'contact@saint-joseph.ci' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+22507000000' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  pays?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  siteWeb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nomResponsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  emailResponsable?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  telephoneResponsable?: string;

  @ApiPropertyOptional({ enum: TenantStatut })
  @IsOptional()
  @IsEnum(TenantStatut)
  statut?: TenantStatut;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUtilisateurs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notesInternes?: string;
}
