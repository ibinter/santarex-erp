import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEmail,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Coordonnées du payeur (facultatives mais utiles au rapprochement admin). */
export class PayerDto {
  @ApiPropertyOptional({ example: 'Awa Traoré' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  name?: string;

  @ApiPropertyOptional({ example: 'awa@example.ci' })
  @IsOptional()
  @IsEmail()
  @MaxLength(160)
  email?: string;

  @ApiPropertyOptional({ example: '+2250700000000' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;
}

/** Création d'une commande de paiement d'abonnement. */
export class CreateTransactionDto {
  @ApiProperty({ example: 'starter', description: "Code de l'offre SaaS visée" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  offerCode: string;

  @ApiProperty({
    example: 'mobile_money.orange',
    description: 'Clé du moyen de paiement (PaymentMethodConfig.key)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  methodKey: string;

  @ApiPropertyOptional({ type: PayerDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => PayerDto)
  payer?: PayerDto;
}

/**
 * Soumission d'une référence client (aucune preuve fichier) :
 * MTCN Western Union / hash de transaction crypto / n° de chèque / code reçu…
 */
export class SubmitProofRefDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Référence fournie par le client (MTCN, hash crypto, n° chèque, code reçu…)',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  clientReference: string;
}

/** Décision admin de validation. */
export class ValidateTransactionDto {
  @ApiPropertyOptional({ description: 'Notes internes de validation' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}

/** Décision admin de rejet. */
export class RejectTransactionDto {
  @ApiProperty({ description: 'Motif du rejet (communiqué en interne)' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  reason: string;
}
