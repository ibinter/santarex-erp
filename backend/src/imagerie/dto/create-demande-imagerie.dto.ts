import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class CreateDemandeImagerieDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'ID du médecin prescripteur' })
  @IsString()
  medecinPrescripteurId: string;

  @ApiProperty({ description: 'ID du type d\'examen (catalogue)' })
  @IsString()
  typeExamenId: string;

  @ApiPropertyOptional({ description: 'Région anatomique (défaut : celle du type d\'examen)' })
  @IsOptional()
  @IsString()
  regionAnatomique?: string;

  @ApiPropertyOptional({ default: false, description: 'Examen urgent' })
  @IsOptional()
  @IsBoolean()
  urgence?: boolean;

  @ApiPropertyOptional({ description: 'Indication clinique / motif' })
  @IsOptional()
  @IsString()
  indicationClinique?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
