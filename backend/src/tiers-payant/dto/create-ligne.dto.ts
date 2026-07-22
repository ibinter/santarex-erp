import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export class CreateLigneDto {
  @ApiPropertyOptional({ description: 'Référence facture (facturation.factures)' })
  @IsOptional()
  @IsString()
  factureRef?: string;

  @ApiProperty({ description: 'Nom du patient' })
  @IsString()
  patientNom: string;

  @ApiProperty({ description: "Libellé de l'acte / prestation" })
  @IsString()
  acte: string;

  @ApiProperty({ description: "Date de l'acte (ISO)" })
  @IsDateString()
  dateActe: string;

  @ApiProperty({ description: "Montant total de l'acte (XOF)" })
  @IsNumber()
  @Min(0)
  montantTotal: number;

  @ApiProperty({ description: 'Taux de couverture appliqué (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxCouverture: number;

  @ApiPropertyOptional({ description: 'Numéro de bon de prise en charge lié' })
  @IsOptional()
  @IsString()
  numeroBPC?: string;
}
