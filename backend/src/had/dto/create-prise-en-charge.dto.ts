import {
  IsString,
  IsOptional,
  IsUUID,
  IsDateString,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutHAD } from '../entities/prise-en-charge-had.entity';

export class CreatePriseEnChargeDto {
  @ApiProperty({ description: 'UUID du patient à admettre en HAD' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'Adresse du domicile' })
  @IsString()
  adresseDomicile: string;

  @ApiPropertyOptional({ description: 'Ville / commune' })
  @IsOptional()
  @IsString()
  ville?: string;

  @ApiPropertyOptional({ description: 'Téléphone de contact' })
  @IsOptional()
  @IsString()
  telephoneContact?: string;

  @ApiProperty({ description: 'Motif / pathologie' })
  @IsString()
  motif: string;

  @ApiProperty({ description: 'ID du médecin référent' })
  @IsString()
  medecinReferentRef: string;

  @ApiProperty({ description: 'Date de début (YYYY-MM-DD)' })
  @IsDateString()
  dateDebut: string;

  @ApiPropertyOptional({ description: 'Date de fin prévue (YYYY-MM-DD)' })
  @IsOptional()
  @IsDateString()
  dateFinPrevue?: string;

  @ApiPropertyOptional({ description: 'Protocole / plan de soins à domicile' })
  @IsOptional()
  @IsString()
  protocoleSoins?: string;

  @ApiPropertyOptional({ description: 'Fréquence de visites prévue' })
  @IsOptional()
  @IsString()
  frequenceVisites?: string;

  @ApiPropertyOptional({ description: 'ID du séjour hospitalier d\'origine' })
  @IsOptional()
  @IsString()
  sejourOrigineRef?: string;

  @ApiPropertyOptional({ enum: StatutHAD })
  @IsOptional()
  @IsEnum(StatutHAD)
  statut?: StatutHAD;
}
