import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { TypeFournisseur } from '../entities/fournisseur.entity';

export class CreateFournisseurDto {
  @ApiProperty({ example: 'Laborex CI' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ enum: TypeFournisseur, default: TypeFournisseur.GROSSISTE })
  @IsOptional()
  @IsEnum(TypeFournisseur)
  type?: TypeFournisseur;

  @ApiPropertyOptional({ example: 'M. Kouassi' })
  @IsOptional()
  @IsString()
  contact?: string;

  @ApiPropertyOptional({ example: '+225 07 00 00 00 00' })
  @IsOptional()
  @IsString()
  telephone?: string;

  @ApiPropertyOptional({ example: 'contact@laborex.ci' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adresse?: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateFournisseurDto extends CreateFournisseurDto {
  @ApiPropertyOptional({ example: 'Laborex CI' })
  @IsOptional()
  @IsString()
  declare nom: string;
}
