import {
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsUrl,
  ArrayNotEmpty,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EvenementWebhook } from '../entities/webhook.entity';
import { TypeInterface } from '../entities/config-interface.entity';

// ── Clés API ────────────────────────────────────────────────────────────────
export class CreateCleApiDto {
  @ApiProperty({ example: 'Automate labo Cobas' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: ['patients:read', 'hl7:write'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  scopes?: string[];
}

// ── Webhooks ────────────────────────────────────────────────────────────────
export class CreateWebhookDto {
  @ApiProperty({ example: 'https://client.example.com/hooks/santarex' })
  @IsUrl({ require_tld: false })
  url: string;

  @ApiProperty({ enum: EvenementWebhook, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(EvenementWebhook, { each: true })
  evenements: EvenementWebhook[];
}

export class UpdateWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  url?: string;

  @ApiPropertyOptional({ enum: EvenementWebhook, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EvenementWebhook, { each: true })
  evenements?: EvenementWebhook[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

// ── Configuration d'interface (HL7 / DICOM) ─────────────────────────────────
export class CreateConfigInterfaceDto {
  @ApiProperty({ enum: TypeInterface })
  @IsEnum(TypeInterface)
  type: TypeInterface;

  @ApiProperty({ example: 'Cobas 6000 - Salle B' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ example: '192.168.1.50' })
  @IsOptional()
  @IsString()
  hote?: string;

  @ApiPropertyOptional({ example: 104 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  parametresJson?: Record<string, unknown>;
}

export class UpdateConfigInterfaceDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  hote?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65535)
  port?: number;

  @ApiPropertyOptional({ type: 'object' })
  @IsOptional()
  @IsObject()
  parametresJson?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  actif?: boolean;
}

// ── Ingestion HL7 ───────────────────────────────────────────────────────────
export class IngestionHl7Dto {
  @ApiProperty({
    description: 'Message HL7 v2 en texte brut (segments séparés par \\r ou \\n)',
    example:
      'MSH|^~\\&|LAB|HOP|SANTAREX|HOP|20260722||ORU^R01|1|P|2.3\rOBX|1|NM|GLU^Glucose||5.4|mmol/L|3.9-6.1|N',
  })
  @IsString()
  message: string;
}
