import { IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RemiseCorpsDto {
  @ApiProperty({ example: 'Kouassi Amenan', description: 'Nom de la personne recevant le corps' })
  @IsString()
  personneRemiseNom: string;

  @ApiPropertyOptional({ example: 'Épouse', description: 'Lien avec le défunt' })
  @IsOptional()
  @IsString()
  personneRemiseLien?: string;

  @ApiPropertyOptional({ example: 'CNI CI-00123456', description: 'Pièce d\'identité présentée' })
  @IsOptional()
  @IsString()
  personneRemisePiece?: string;

  @ApiPropertyOptional({ description: 'Référence de l\'agent effectuant la remise' })
  @IsOptional()
  @IsString()
  agentRef?: string;

  @ApiPropertyOptional({ description: 'Date et heure de la remise (défaut: maintenant)' })
  @IsOptional()
  @IsDateString()
  dateSortie?: string;
}
