import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, IsDateString, Min } from 'class-validator';

export class EnregistrerPaiementDto {
  @ApiProperty({ description: 'Montant payé par l\'assureur (cumulé ou incrément selon `increment`)' })
  @IsNumber()
  @Min(0)
  montant: number;

  @ApiPropertyOptional({
    description:
      'Si true, `montant` est ajouté au montant déjà payé ; sinon il remplace le total payé.',
    default: true,
  })
  @IsOptional()
  increment?: boolean;

  @ApiPropertyOptional({ description: 'Date du paiement (ISO)' })
  @IsOptional()
  @IsDateString()
  datePaiement?: string;

  @ApiPropertyOptional({ description: 'Référence de virement / paiement' })
  @IsOptional()
  @IsString()
  reference?: string;
}
