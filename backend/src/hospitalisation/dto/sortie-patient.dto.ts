import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TypeSortie } from '../entities/sejour.entity';

export class SortiePatientDto {
  @ApiProperty({ enum: TypeSortie, description: 'Type de sortie du patient' })
  @IsEnum(TypeSortie)
  typeSortie: TypeSortie;

  @ApiPropertyOptional({ description: 'Diagnostic de sortie' })
  @IsOptional()
  @IsString()
  diagnosticSortie?: string;

  @ApiPropertyOptional({ description: 'Instructions post-hospitalisation' })
  @IsOptional()
  @IsString()
  instructionsPostHospitalisation?: string;
}
