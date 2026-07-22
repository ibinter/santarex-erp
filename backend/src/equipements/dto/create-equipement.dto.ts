import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import {
  EquipementCategorie,
  EquipementStatut,
} from '../entities/equipement.entity';

export class CreateEquipementDto {
  @ApiProperty({ example: 'Scanner CT 64 barrettes' })
  @IsString()
  nom: string;

  @ApiProperty({ enum: EquipementCategorie })
  @IsEnum(EquipementCategorie)
  categorie: EquipementCategorie;

  @ApiPropertyOptional({ example: 'Siemens' })
  @IsOptional()
  @IsString()
  marque?: string;

  @ApiPropertyOptional({ example: 'Somatom go.Now' })
  @IsOptional()
  @IsString()
  modele?: string;

  @ApiPropertyOptional({ example: 'SN-123456' })
  @IsOptional()
  @IsString()
  numeroSerie?: string;

  @ApiPropertyOptional({ example: 'Radiologie' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateAcquisition?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  valeurAcquisition?: number;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiPropertyOptional({ enum: EquipementStatut })
  @IsOptional()
  @IsEnum(EquipementStatut)
  statut?: EquipementStatut;

  @ApiPropertyOptional({ default: 0, description: 'Périodicité maintenance préventive (jours)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  periodiciteMaintenanceJours?: number;

  @ApiPropertyOptional({ type: 'string', format: 'date' })
  @IsOptional()
  @IsDateString()
  dateProchaineMaintenance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
