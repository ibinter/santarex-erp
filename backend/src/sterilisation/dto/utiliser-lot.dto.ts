import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UtiliserLotDto {
  @ApiPropertyOptional({ description: 'Référence de l\'usage (ex: ID intervention bloc opératoire)' })
  @IsOptional()
  @IsString()
  utiliseParRef?: string;
}
