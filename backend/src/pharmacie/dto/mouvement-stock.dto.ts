import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class EntreeStockDto {
  @ApiProperty({ example: 'LOT-2024-001' })
  @IsString()
  numeroLot: string;

  @ApiProperty()
  @IsDateString()
  datePeremption: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateReception?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantite: number;

  @ApiPropertyOptional({ example: 'Pharma Distribution CI' })
  @IsOptional()
  @IsString()
  fournisseur?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  prixAchat?: number;

  @ApiPropertyOptional({ example: 'Etagère A2' })
  @IsOptional()
  @IsString()
  localisation?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;
}

export class SortieStockDto {
  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantite: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  motif?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ordonnanceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;
}
