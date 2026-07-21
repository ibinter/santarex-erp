import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { StatutSalle } from '../entities/salle-operation.entity';

export class UpdateSalleDto {
  @ApiPropertyOptional({ example: 'Salle 1', description: 'Nom / numéro de la salle' })
  @IsOptional()
  @IsString()
  nom?: string;

  @ApiPropertyOptional({ example: 'Chirurgie générale', description: 'Type / spécialité de la salle' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ enum: StatutSalle, description: 'Statut de la salle' })
  @IsOptional()
  @IsEnum(StatutSalle)
  statut?: StatutSalle;

  @ApiPropertyOptional({ default: true, description: 'Salle active ou non' })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}
