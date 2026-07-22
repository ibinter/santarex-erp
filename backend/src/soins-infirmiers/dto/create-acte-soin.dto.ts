import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeActeSoin } from '../entities/acte-soin.entity';

export class CreateActeSoinDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsUUID()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation' })
  @IsOptional()
  @IsUUID()
  sejourId?: string;

  @ApiPropertyOptional({ description: 'Date et heure (ISO). Défaut: maintenant' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiProperty({ enum: TypeActeSoin, description: 'Type d\'acte' })
  @IsEnum(TypeActeSoin)
  type: TypeActeSoin;

  @ApiProperty({ description: 'Description de l\'acte' })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: 'Acte déjà réalisé' })
  @IsOptional()
  @IsBoolean()
  realise?: boolean;
}

export class UpdateActeSoinDto {
  @ApiPropertyOptional({ enum: TypeActeSoin, description: 'Type d\'acte' })
  @IsOptional()
  @IsEnum(TypeActeSoin)
  type?: TypeActeSoin;

  @ApiPropertyOptional({ description: 'Description de l\'acte' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Acte réalisé' })
  @IsOptional()
  @IsBoolean()
  realise?: boolean;
}
