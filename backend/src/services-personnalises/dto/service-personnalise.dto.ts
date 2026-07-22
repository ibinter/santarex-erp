import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  IsUUID,
  ValidateNested,
  ArrayMaxSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CategorieService, TypeChamp } from '../entities/service-personnalise.entity';
import { StatutEnregistrement } from '../entities/enregistrement-service.entity';

/** Définition d'un champ envoyée par le constructeur de formulaire. */
export class ChampDefinitionDto {
  @IsString()
  @MaxLength(64)
  id: string;

  @IsString()
  @MaxLength(120)
  libelle: string;

  @IsEnum(TypeChamp)
  type: TypeChamp;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  options?: string[];

  @IsBoolean()
  requis: boolean;
}

export class CreateServicePersonnaliseDto {
  @IsString()
  @MaxLength(150)
  nom: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(CategorieService)
  categorie: CategorieService;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icone?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChampDefinitionDto)
  @ArrayMaxSize(100)
  champsSchema: ChampDefinitionDto[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateServicePersonnaliseDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nom?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CategorieService)
  categorie?: CategorieService;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icone?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChampDefinitionDto)
  @ArrayMaxSize(100)
  champsSchema?: ChampDefinitionDto[];

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class CreateEnregistrementDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsObject()
  valeurs: Record<string, unknown>;

  @IsOptional()
  @IsEnum(StatutEnregistrement)
  statut?: StatutEnregistrement;

  @IsOptional()
  @IsString()
  date?: string;
}

export class UpdateEnregistrementDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsObject()
  valeurs?: Record<string, unknown>;

  @IsOptional()
  @IsEnum(StatutEnregistrement)
  statut?: StatutEnregistrement;

  @IsOptional()
  @IsString()
  date?: string;
}
