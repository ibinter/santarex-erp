import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CreateBordereauDto {
  @ApiProperty({ description: "ID de l'assureur (prise-en-charge.assureurs)" })
  @IsString()
  assureurId: string;

  @ApiProperty({ description: 'Début de la période couverte (ISO)' })
  @IsDateString()
  periodeDebut: string;

  @ApiProperty({ description: 'Fin de la période couverte (ISO)' })
  @IsDateString()
  periodeFin: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
