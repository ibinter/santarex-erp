import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ArrayNotEmpty,
  IsEnum,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { ConversationType } from '../entities/conversation.entity';

export class CreateConversationDto {
  /** Identifiants des destinataires (hors auteur courant). */
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  participantsIds: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  sujet?: string;

  @IsOptional()
  @IsEnum(ConversationType)
  type?: ConversationType;

  /** Message initial optionnel. */
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  message?: string;
}

export class EnvoyerMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  contenu: string;

  @IsOptional()
  @IsString()
  pieceJointeUrl?: string;
}
