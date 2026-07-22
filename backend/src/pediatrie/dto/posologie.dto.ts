import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsInt, IsString, Min } from 'class-validator';

export class PosologieDto {
  @ApiProperty({ description: "Poids de l'enfant en kilogrammes", example: 12 })
  @IsNumber()
  @Min(0)
  poidsKg: number;

  @ApiProperty({ description: 'Posologie prescrite en mg par kg par jour', example: 30 })
  @IsNumber()
  @Min(0)
  mgParKgParJour: number;

  @ApiProperty({ description: 'Nombre de prises par jour', example: 3 })
  @IsInt()
  @Min(1)
  nbPrises: number;

  @ApiPropertyOptional({ description: 'Nom du médicament (facultatif, pour affichage)' })
  @IsOptional()
  @IsString()
  medicament?: string;

  @ApiPropertyOptional({ description: 'Dose maximale journalière en mg (plafond de sécurité)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  doseMaxJourMg?: number;
}
