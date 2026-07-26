import {
  IsString,
  IsOptional,
  IsInt,
  Min,
  Max,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CleActivationStatut } from '../entities/cle-activation.entity';

/** Génération d'un LOT de N clés (admin/superadmin). */
export class GenererLotDto {
  @ApiProperty({ example: 50, description: 'Nombre de clés à générer (1..1000)' })
  @IsInt()
  @Min(1)
  @Max(1000)
  nombre: number;

  @ApiProperty({ example: 'starter', description: 'Code de l\'offre/formule liée' })
  @IsString()
  offreCode: string;

  @ApiProperty({ example: 30, description: 'Durée de licence octroyée (jours)' })
  @IsInt()
  @Min(1)
  dureeJours: number;

  @ApiPropertyOptional({
    description:
      'Slug du tenant réservataire (omettre pour des clés génériques, utilisables par tout tenant)',
  })
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({
    description: 'Durée de validité de la clé elle-même en jours (au-delà : expirée). Défaut : 365.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  validiteJours?: number;

  @ApiPropertyOptional({ description: 'Libellé de lot personnalisé (généré automatiquement si absent)' })
  @IsOptional()
  @IsString()
  lot?: string;
}

/** Filtres de listing des clés. */
export class ListerClesDto {
  @ApiPropertyOptional({ enum: CleActivationStatut })
  @IsOptional()
  @IsEnum(CleActivationStatut)
  statut?: CleActivationStatut;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  lot?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  offreCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantSlug?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}

/** Révocation unitaire ou par lot. */
export class RevoquerDto {
  @ApiPropertyOptional({ description: 'Motif de la révocation' })
  @IsOptional()
  @IsString()
  motif?: string;
}

export class RevoquerLotDto {
  @ApiProperty({ description: 'Identifiant du lot à révoquer' })
  @IsString()
  lot: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;
}

/** Saisie d'une clé par un client connecté. */
export class UtiliserCleDto {
  @ApiProperty({ example: 'SRX-XXXX-XXXX-XXXX', description: 'Code d\'activation à saisir' })
  @IsString()
  code: string;
}
