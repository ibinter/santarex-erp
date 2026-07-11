import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceHospitalisation, StatutLit } from '../entities/lit.entity';

export class CreateLitDto {
  @ApiProperty({ example: 'MED-101', description: 'Numéro identifiant du lit' })
  @IsString()
  numero: string;

  @ApiProperty({ enum: ServiceHospitalisation, description: 'Service médical du lit' })
  @IsEnum(ServiceHospitalisation)
  service: ServiceHospitalisation;

  @ApiPropertyOptional({ example: 'Salle 1', description: 'Numéro ou nom de la salle' })
  @IsOptional()
  @IsString()
  salle?: string;

  @ApiPropertyOptional({ example: '2ème étage', description: 'Étage du lit' })
  @IsOptional()
  @IsString()
  etage?: string;

  @ApiPropertyOptional({ enum: StatutLit, default: StatutLit.LIBRE, description: 'Statut initial du lit' })
  @IsOptional()
  @IsEnum(StatutLit)
  statut?: StatutLit;

  @ApiPropertyOptional({ default: true, description: 'Lit actif ou non' })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
