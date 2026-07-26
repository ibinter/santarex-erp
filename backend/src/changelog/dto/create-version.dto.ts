import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StatutVersion } from '../entities/version-erp.entity';

export class NouveauteDto {
  @IsString()
  texte: string;

  @IsOptional()
  @IsString()
  formuleMin?: string;
}

export class CreateVersionDto {
  @IsString()
  version: string;

  @IsString()
  titre: string;

  @IsOptional()
  @IsDateString()
  datePublication?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => NouveauteDto)
  nouveautesJson?: NouveauteDto[];

  @IsOptional()
  @IsEnum(StatutVersion)
  statut?: StatutVersion;

  @IsOptional()
  @IsBoolean()
  estMajeure?: boolean;
}
