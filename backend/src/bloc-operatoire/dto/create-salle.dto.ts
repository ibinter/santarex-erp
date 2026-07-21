import { IsEnum, IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { StatutSalle } from '../entities/salle-operation.entity';

export class CreateSalleDto {
  @ApiProperty({ example: 'Salle 1', description: 'Nom / numéro de la salle' })
  @IsString()
  nom: string;

  @ApiProperty({ example: 'Chirurgie générale', description: 'Type / spécialité de la salle' })
  @IsString()
  type: string;

  @ApiPropertyOptional({ enum: StatutSalle, default: StatutSalle.DISPONIBLE, description: 'Statut initial' })
  @IsOptional()
  @IsEnum(StatutSalle)
  statut?: StatutSalle;

  @ApiPropertyOptional({ default: true, description: 'Salle active ou non' })
  @IsOptional()
  @IsBoolean()
  estActive?: boolean;
}
