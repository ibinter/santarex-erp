import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { AuditAction } from '../entities/audit-log.entity';

/**
 * Filtres du journal d'audit. Ils doivent être déclarés ici : le serveur refuse tout paramètre inconnu, et les
 * filtres « action » et « ressource » de l'écran renvoyaient donc une erreur 400.
 */
export class ListAuditLogsQueryDto extends PaginationDto {
  @ApiPropertyOptional({ description: "Établissement (réservé au superadmin ; ignoré pour les autres)" })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tenantId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  userId?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ressource?: string;
}
