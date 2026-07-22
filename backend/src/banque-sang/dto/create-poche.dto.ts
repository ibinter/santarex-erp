import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsInt,
  IsDateString,
  Min,
} from 'class-validator';
import {
  GroupeABO,
  Rhesus,
  TypeProduitSanguin,
} from '../entities/poche-sang.entity';

export class CreatePocheDto {
  @ApiPropertyOptional({ description: 'Numéro/code de la poche (auto-généré si absent)' })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiProperty({ enum: GroupeABO })
  @IsEnum(GroupeABO)
  groupe: GroupeABO;

  @ApiProperty({ enum: Rhesus })
  @IsEnum(Rhesus)
  rhesus: Rhesus;

  @ApiProperty({ enum: TypeProduitSanguin })
  @IsEnum(TypeProduitSanguin)
  typeProduit: TypeProduitSanguin;

  @ApiProperty({ example: 450 })
  @IsInt()
  @Min(1)
  volumeMl: number;

  @ApiProperty()
  @IsDateString()
  datePrelevement: string;

  @ApiProperty()
  @IsDateString()
  datePeremption: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  donneurRef?: string;

  @ApiPropertyOptional({ example: 'CNTS Abidjan' })
  @IsOptional()
  @IsString()
  provenance?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  localisation?: string;
}
