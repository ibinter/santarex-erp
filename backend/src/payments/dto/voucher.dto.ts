// ════════════════════════════════════════════════════════════════════════════
//  DTOs des codes prépayés (vouchers) — génération en lot + redemption client.
//  Contexte SaaS Côte d'Ivoire : valeurs en centimes de XOF.
// ════════════════════════════════════════════════════════════════════════════
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsISO8601,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Génération d'un lot de codes prépayés par un administrateur. */
export class GenerateVouchersDto {
  @ApiProperty({ example: 100, minimum: 1, maximum: 10000, description: 'Nombre de codes à générer' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(10000)
  quantity: number;

  @ApiPropertyOptional({ example: 1500000, description: 'Valeur faciale en centimes de XOF (optionnel)' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  value?: number;

  @ApiPropertyOptional({ example: 'PRO-ANNUEL', description: 'Code de l\'offre associée (optionnel)' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  offerCode?: string;

  @ApiProperty({ example: 365, minimum: 1, description: 'Durée d\'abonnement conférée (jours)' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3650)
  durationDays: number;

  @ApiPropertyOptional({ example: '2027-12-31T23:59:59.000Z', description: 'Date d\'expiration des codes (ISO 8601, optionnel)' })
  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @ApiPropertyOptional({ example: 'REV-ABIDJAN-007', description: 'Référence du revendeur agréé (optionnel)' })
  @IsOptional()
  @IsString()
  @MaxLength(128)
  resellerRef?: string;
}

/** Redemption (activation) d'un code par un tenant client. */
export class RedeemVoucherDto {
  @ApiProperty({ example: 'SANT-ABCD-EFGH-JKLM', description: 'Code prépayé à usage unique' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  code: string;
}
