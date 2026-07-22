import {
  IsEnum,
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CanalMessage, CodeModeleMessage } from '../entities/modele-message.entity';

export class CreateModeleMessageDto {
  @IsEnum(CodeModeleMessage)
  code: CodeModeleMessage;

  @IsString()
  @MinLength(2)
  libelle: string;

  @IsEnum(CanalMessage)
  canal: CanalMessage;

  @IsString()
  @MinLength(2)
  contenu: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

export class UpdateModeleMessageDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  libelle?: string;

  @IsOptional()
  @IsEnum(CanalMessage)
  canal?: CanalMessage;

  @IsOptional()
  @IsString()
  @MinLength(2)
  contenu?: string;

  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}
