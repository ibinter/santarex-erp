import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsInt,
  IsArray,
  IsUUID,
  IsDateString,
  ValidateNested,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TypeQuestion } from '../entities/questionnaire.entity';

export class QuestionDefDto {
  @IsString()
  id: string;

  @IsString()
  @MaxLength(300)
  libelle: string;

  @IsEnum(TypeQuestion)
  type: TypeQuestion;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];
}

export class CreateQuestionnaireDto {
  @IsString()
  @MaxLength(200)
  titre: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDefDto)
  questions?: QuestionDefDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  echelleMax?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateQuestionnaireDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  titre?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDefDto)
  questions?: QuestionDefDto[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  echelleMax?: number;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class ReponseItemDto {
  @IsString()
  questionId: string;

  /** Valeur libre : nombre (note), booléen (oui/non) ou chaîne (texte/choix). */
  @IsOptional()
  valeur?: number | string | boolean | null;
}

export class CreateReponseDto {
  @IsUUID()
  questionnaireId: string;

  @IsOptional()
  @IsUUID()
  patientId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  serviceConcerne?: string;

  @IsOptional()
  @IsDateString()
  dateReponse?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReponseItemDto)
  reponses: ReponseItemDto[];

  @IsOptional()
  @IsString()
  commentaireLibre?: string;

  @IsOptional()
  @IsBoolean()
  recommande?: boolean;
}
