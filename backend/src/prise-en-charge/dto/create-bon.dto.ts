import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class CreateBonDto {
  @ApiProperty({ description: 'ID du patient' })
  @IsString()
  patientId: string;

  @ApiProperty({ description: "ID de l'assureur" })
  @IsString()
  assureurId: string;

  @ApiPropertyOptional({ description: "Numéro d'assuré / de police" })
  @IsOptional()
  @IsString()
  numeroAssure?: string;

  @ApiProperty({ description: 'Acte / prestation demandée' })
  @IsString()
  prestation: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Montant estimé de l'acte (XOF)" })
  @IsNumber()
  @Min(0)
  montantEstime: number;

  @ApiPropertyOptional({
    description: 'Taux de couverture (%) — par défaut celui de l\'assureur',
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  tauxCouverture?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
