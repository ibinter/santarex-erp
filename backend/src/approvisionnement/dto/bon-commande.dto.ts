import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  Min,
  IsDateString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class LigneCommandeDto {
  @ApiProperty({ example: 'Amoxicilline 500mg comprimé' })
  @IsString()
  designation: string;

  @ApiPropertyOptional({ description: 'Lien optionnel vers un médicament pharmacie' })
  @IsOptional()
  @IsUUID()
  medicamentId?: string;

  @ApiProperty({ example: 100 })
  @IsNumber()
  @Min(0)
  quantiteCommandee: number;

  @ApiProperty({ example: 250 })
  @IsNumber()
  @Min(0)
  prixUnitaire: number;
}

export class CreateBonCommandeDto {
  @ApiProperty()
  @IsUUID()
  fournisseurId: string;

  @ApiPropertyOptional({ description: 'Défaut : maintenant' })
  @IsOptional()
  @IsDateString()
  dateCommande?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateLivraisonPrevue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ default: 'XOF' })
  @IsOptional()
  @IsString()
  devise?: string;

  @ApiProperty({ type: [LigneCommandeDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  lignes: LigneCommandeDto[];
}

export class UpdateBonCommandeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fournisseurId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateCommande?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  dateLivraisonPrevue?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ type: [LigneCommandeDto], description: 'Si fourni, remplace toutes les lignes existantes (bon en brouillon uniquement)' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneCommandeDto)
  lignes?: LigneCommandeDto[];
}

export class LigneReceptionDto {
  @ApiProperty({ description: 'Id de la ligne de commande concernée' })
  @IsUUID()
  ligneId: string;

  @ApiProperty({ example: 80, description: 'Quantité reçue pour cette réception (cumulée à quantiteRecue)' })
  @IsNumber()
  @Min(0)
  quantiteRecue: number;
}

export class ReceptionDto {
  @ApiProperty({ type: [LigneReceptionDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LigneReceptionDto)
  lignes: LigneReceptionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
