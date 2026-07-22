import { IsString, IsOptional, IsEnum, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeInstrument } from '../entities/instrument.entity';

export class CreateInstrumentDto {
  @ApiProperty({ example: 'Plateau chirurgie viscérale', description: 'Nom' })
  @IsString()
  nom: string;

  @ApiPropertyOptional({ enum: TypeInstrument, description: 'Type' })
  @IsOptional()
  @IsEnum(TypeInstrument)
  type?: TypeInstrument;

  @ApiPropertyOptional({ example: 1, description: 'Quantité' })
  @IsOptional()
  @IsInt()
  @Min(0)
  quantite?: number;

  @ApiPropertyOptional({ description: 'Code / référence interne' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Actif' })
  @IsOptional()
  @IsBoolean()
  estActif?: boolean;
}
