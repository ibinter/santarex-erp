import {
  IsString,
  IsEnum,
  IsOptional,
  IsDateString,
  IsObject,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  GraviteIncident,
  StatutIncident,
  TypeActionIncident,
  TypeIncident,
} from '../entities/incident-qualite.entity';

export class CreateIncidentQualiteDto {
  @IsEnum(TypeIncident)
  type: TypeIncident;

  @IsEnum(GraviteIncident)
  gravite: GraviteIncident;

  @IsDateString()
  dateSurvenue: string;

  @IsString()
  @MaxLength(200)
  serviceConcerne: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsString()
  description: string;

  @IsOptional()
  @IsString()
  causesIdentifiees?: string;

  @IsOptional()
  @IsString()
  mesuresCorrectives?: string;

  @IsOptional()
  @IsObject()
  analyseJson?: Record<string, unknown>;
}

export class UpdateIncidentQualiteDto {
  @IsOptional()
  @IsEnum(TypeIncident)
  type?: TypeIncident;

  @IsOptional()
  @IsEnum(GraviteIncident)
  gravite?: GraviteIncident;

  @IsOptional()
  @IsDateString()
  dateSurvenue?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceConcerne?: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  causesIdentifiees?: string;

  @IsOptional()
  @IsString()
  mesuresCorrectives?: string;

  @IsOptional()
  @IsObject()
  analyseJson?: Record<string, unknown>;
}

export class UpdateStatutIncidentDto {
  @IsEnum(StatutIncident)
  statut: StatutIncident;

  /** Commentaire optionnel accompagnant le changement de statut (tracé dans le fil). */
  @IsOptional()
  @IsString()
  commentaire?: string;
}

export class AjouterActionIncidentDto {
  @IsString()
  contenu: string;

  @IsOptional()
  @IsEnum(TypeActionIncident)
  type?: TypeActionIncident;
}
