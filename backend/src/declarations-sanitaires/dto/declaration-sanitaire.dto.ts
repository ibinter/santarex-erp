import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsUUID,
  IsInt,
  Min,
  Max,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import {
  CategorieMaladie,
} from '../entities/maladie-declarable.entity';
import {
  StatutDeclaration,
  GraviteDeclaration,
  EvolutionCas,
  SexePatient,
} from '../entities/declaration-sanitaire.entity';

// ── Référentiel MDO ───────────────────────────────────────────────────────────
export class CreateMaladieDto {
  @IsString()
  @MaxLength(200)
  nom: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codeCIM10?: string;

  @IsEnum(CategorieMaladie)
  categorie: CategorieMaladie;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8760)
  delaiDeclarationHeures?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateMaladieDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  nom?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  codeCIM10?: string;

  @IsOptional()
  @IsEnum(CategorieMaladie)
  categorie?: CategorieMaladie;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(8760)
  delaiDeclarationHeures?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

// ── Déclarations ──────────────────────────────────────────────────────────────
export class CreateDeclarationDto {
  @IsUUID()
  maladieId: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientNom?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  patientAge?: number;

  @IsOptional()
  @IsEnum(SexePatient)
  patientSexe?: SexePatient;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  localite?: string;

  @IsDateString()
  dateDiagnostic: string;

  @IsOptional()
  @IsEnum(GraviteDeclaration)
  gravite?: GraviteDeclaration;

  @IsOptional()
  @IsEnum(EvolutionCas)
  evolution?: EvolutionCas;

  @IsOptional()
  @IsString()
  mesuresPrises?: string;
}

export class UpdateDeclarationDto {
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  patientNom?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  patientAge?: number;

  @IsOptional()
  @IsEnum(SexePatient)
  patientSexe?: SexePatient;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  localite?: string;

  @IsOptional()
  @IsDateString()
  dateDiagnostic?: string;

  @IsOptional()
  @IsEnum(GraviteDeclaration)
  gravite?: GraviteDeclaration;

  @IsOptional()
  @IsEnum(EvolutionCas)
  evolution?: EvolutionCas;

  @IsOptional()
  @IsString()
  mesuresPrises?: string;
}

export class ChangerStatutDeclarationDto {
  @IsEnum(StatutDeclaration)
  statut: StatutDeclaration;
}

export class TransmettreDeclarationDto {
  @IsString()
  @MaxLength(200)
  autoriteDestinataire: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  referenceTransmission?: string;
}
