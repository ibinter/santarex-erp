// ════════════════════════════════════════════════════════════════════════════
//  DTO de création / mise à jour d'une configuration de moyen de paiement.
//  L'upsert est piloté par la clé logique `key` (unique). Les secrets fournis
//  sont chiffrés côté service ; une valeur masquée ("••••1234") n'écrase jamais
//  un secret existant.
// ════════════════════════════════════════════════════════════════════════════

import {
  IsString,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsObject,
  IsArray,
  IsInt,
  Min,
  MaxLength,
  ArrayMaxSize,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethodType, PaymentGateway } from '../payments.enums';

export class UpsertPaymentConfigDto {
  @ApiProperty({
    example: 'mobile_money.orange',
    description: 'Clé logique unique du moyen de paiement (upsert).',
  })
  @IsString()
  @MaxLength(120)
  key: string;

  @ApiProperty({ enum: PaymentMethodType })
  @IsEnum(PaymentMethodType)
  type: PaymentMethodType;

  @ApiPropertyOptional({ example: 'Orange Money', description: 'Libellé affiché au client.' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  label?: string;

  @ApiPropertyOptional({ default: false, description: 'Activation ON/OFF admin.' })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({ example: 0, description: 'Ordre d\'affichage.' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({ enum: PaymentGateway, description: 'Passerelle électronique (si type=gateway).' })
  @IsOptional()
  @IsEnum(PaymentGateway)
  gateway?: PaymentGateway;

  @ApiPropertyOptional({
    description: 'Paramètres publics NON sensibles (numéro de réception, IBAN, wallet, réseau…).',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  publicConfig?: Record<string, unknown>;

  @ApiPropertyOptional({
    description:
      'Secrets (API keys, secret keys, webhook secrets) — chiffrés au repos. ' +
      'Une valeur masquée "••••1234" est ignorée (le secret existant est conservé).',
    type: Object,
  })
  @IsOptional()
  @IsObject()
  secretConfig?: Record<string, string>;

  @ApiPropertyOptional({ default: true, description: 'Mode sandbox vs production.' })
  @IsOptional()
  @IsBoolean()
  sandbox?: boolean;

  @ApiPropertyOptional({ description: 'Instructions affichées au client.' })
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  instructions?: string;

  @ApiPropertyOptional({
    type: [String],
    description: 'Restriction géographique (codes pays ISO2) ; vide = tous pays.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(300)
  countries?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Restriction par forfait (codes d\'offre) ; vide = tous forfaits.',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(300)
  offerCodes?: string[];

  @ApiPropertyOptional({
    type: [String],
    description: 'Devises acceptées (ISO) ; vide = devise par défaut (XOF).',
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(50)
  currencies?: string[];
}

/** DTO du toggle ON/OFF. */
export class TogglePaymentConfigDto {
  @ApiProperty({ description: 'Nouvel état d\'activation.' })
  @IsBoolean()
  enabled: boolean;
}
