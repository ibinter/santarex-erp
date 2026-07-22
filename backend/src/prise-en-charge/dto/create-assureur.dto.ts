import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsEmail,
  Min,
  Max,
} from 'class-validator';
import { TypeAssureur } from '../entities/assureur.entity';

export class CreateAssureurDto {
  @ApiProperty({ example: 'SUNU Assurances' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ enum: TypeAssureur })
  @IsOptional()
  @IsEnum(TypeAssureur)
  type?: TypeAssureur;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactNom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contactTelephone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsEmail()
  contactEmail?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ default: 80 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxCouvertureDefaut?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  plafond?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
