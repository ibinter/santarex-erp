import { IsString, IsEnum, IsOptional, IsInt, IsBoolean, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OffreCycle } from '../entities/offre-saas.entity';

export class CreateOffreSaasDto {
  @ApiProperty({ example: 'starter' })
  @IsString()
  code: string;

  @ApiProperty({ example: 'STARTER' })
  @IsString()
  nom: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 49000 })
  @IsInt()
  @Min(0)
  prix: number;

  @ApiProperty({ enum: OffreCycle })
  @IsEnum(OffreCycle)
  cycle: OffreCycle;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  remiseAnnuelle?: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @Min(1)
  maxUtilisateurs: number;

  @ApiPropertyOptional({ description: 'JSON array de codes modules' })
  @IsOptional()
  @IsString()
  modulesInclus?: string;

  @ApiPropertyOptional({ description: 'JSON array de fonctionnalités' })
  @IsOptional()
  @IsString()
  fonctionnalites?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estVisible?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  estMisEnAvant?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  ordre?: number;
}
