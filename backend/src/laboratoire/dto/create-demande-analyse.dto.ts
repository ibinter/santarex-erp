import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class CreateDemandeAnalyseDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: 'ID du médecin prescripteur' })
  @IsString()
  medecinId: string;

  @ApiPropertyOptional({ description: 'ID de la consultation associée' })
  @IsOptional()
  @IsString()
  consultationId?: string;

  @ApiProperty({ description: 'Tableau des IDs de types d\'analyse', type: [String] })
  @IsArray()
  @IsString({ each: true })
  analyses: string[];

  @ApiPropertyOptional({ default: false, description: 'Demande urgente' })
  @IsOptional()
  @IsBoolean()
  urgence?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
