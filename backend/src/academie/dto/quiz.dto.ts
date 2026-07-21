import {
  IsArray, IsInt, IsString, Min, ValidateNested, ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

/** Réponse de l'utilisateur à une question (indices des options choisies). */
export class ReponseQuizDto {
  @IsString()
  questionId: string;

  // Indices (0-based) des options sélectionnées. Vide = aucune réponse.
  @IsArray() @IsInt({ each: true }) @Min(0, { each: true })
  options: number[];
}

/** Soumission d'un quiz : l'ensemble des réponses de l'utilisateur. */
export class SoumettreQuizDto {
  @IsArray() @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => ReponseQuizDto)
  reponses: ReponseQuizDto[];
}
