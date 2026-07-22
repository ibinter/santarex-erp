import {
  IsEnum,
  IsString,
  IsOptional,
  IsUUID,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SexeDefunt, LieuDeces } from '../entities/deces.entity';

export class CreateDecesDto {
  @ApiPropertyOptional({ description: 'ID du patient décédé (si connu)' })
  @IsOptional()
  @IsUUID()
  patientId?: string;

  @ApiProperty({ example: 'Kouassi', description: 'Nom du défunt' })
  @IsString()
  defuntNom: string;

  @ApiProperty({ example: 'Yao', description: 'Prénom(s) du défunt' })
  @IsString()
  defuntPrenom: string;

  @ApiPropertyOptional({ enum: SexeDefunt, description: 'Sexe du défunt' })
  @IsOptional()
  @IsEnum(SexeDefunt)
  defuntSexe?: SexeDefunt;

  @ApiPropertyOptional({ example: 67, description: 'Âge du défunt' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(150)
  defuntAge?: number;

  @ApiProperty({ description: 'Date et heure du décès (ISO 8601)' })
  @IsDateString()
  dateHeureDeces: string;

  @ApiPropertyOptional({ enum: LieuDeces, description: 'Lieu / circonstance du décès' })
  @IsOptional()
  @IsEnum(LieuDeces)
  lieuDeces?: LieuDeces;

  @ApiPropertyOptional({ description: 'Cause du décès' })
  @IsOptional()
  @IsString()
  causeDeces?: string;

  @ApiPropertyOptional({ description: 'Référence du médecin constatant' })
  @IsOptional()
  @IsString()
  medecinConstatantRef?: string;

  @ApiPropertyOptional({ default: false, description: 'Émettre un certificat de décès à l\'enregistrement' })
  @IsOptional()
  @IsBoolean()
  emettreCertificat?: boolean;
}
