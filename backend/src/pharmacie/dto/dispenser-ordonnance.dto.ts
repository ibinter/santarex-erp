import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsArray, IsNumber, IsOptional, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LigneMedicamentOrdonnanceDto {
  @ApiProperty()
  @IsString()
  medicamentId: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantite: number;
}

export class DispenserOrdonnanceDto {
  @ApiProperty({ type: [LigneMedicamentOrdonnanceDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneMedicamentOrdonnanceDto)
  lignes: LigneMedicamentOrdonnanceDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patientId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
