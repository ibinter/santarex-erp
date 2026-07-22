import {
  IsString,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  Min,
} from 'class-validator';
import { TypeSite, StatutSite } from '../entities/site.entity';

export class CreateSiteDto {
  @IsString()
  code: string;

  @IsString()
  nom: string;

  @IsOptional()
  @IsEnum(TypeSite)
  type?: TypeSite;

  @IsOptional()
  @IsString()
  adresse?: string;

  @IsOptional()
  @IsString()
  ville?: string;

  @IsOptional()
  @IsString()
  telephone?: string;

  @IsOptional()
  @IsString()
  responsableRef?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  capaciteLits?: number;

  @IsOptional()
  @IsEnum(StatutSite)
  statut?: StatutSite;

  @IsOptional()
  @IsBoolean()
  estPrincipal?: boolean;
}
