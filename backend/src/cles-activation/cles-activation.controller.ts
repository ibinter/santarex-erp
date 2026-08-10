import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  Ip,
  Header,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

import { ClesActivationService } from './cles-activation.service';
import {
  GenererLotDto,
  ListerClesDto,
  RevoquerDto,
  RevoquerLotDto,
  UtiliserCleDto,
} from './dto/cles-activation.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Clés d\'activation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cles-activation')
export class ClesActivationController {
  constructor(private readonly service: ClesActivationService) {}

  // ── Administration (ADMIN / SUPERADMIN / DIRECTEUR) ─────────────────────────

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Générer un lot de N clés d\'activation' })
  genererLot(@Body() dto: GenererLotDto, @CurrentUser('userId') userId: string) {
    return this.service.genererLot(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Lister / filtrer les clés d\'activation' })
  lister(@Query() dto: ListerClesDto) {
    return this.service.lister(dto);
  }

  @Get('export-csv')
  @Roles(UserRole.SUPERADMIN)
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="cles-activation.csv"')
  @ApiOperation({ summary: 'Exporter les clés (CSV) selon les filtres' })
  exportCsv(@Query() dto: ListerClesDto) {
    return this.service.exportCsv(dto);
  }

  @Patch('revoquer-lot')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Révoquer toutes les clés actives d\'un lot' })
  revoquerLot(@Body() dto: RevoquerLotDto, @CurrentUser('userId') userId: string) {
    return this.service.revoquerLot(dto, userId);
  }

  @Patch(':id/revoquer')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Révoquer une clé d\'activation' })
  revoquer(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RevoquerDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.revoquer(id, dto?.motif, userId);
  }

  // ── Client : saisie de sa clé (ADMIN / DIRECTEUR du tenant) ─────────────────
  // Anti-brute-force applicatif (compteur tenant|IP) + throttle HTTP.

  @Post('utiliser')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  @ApiOperation({ summary: 'Saisir une clé d\'activation pour activer sa licence' })
  utiliser(
    @Body() dto: UtiliserCleDto,
    @CurrentUser() user: { userId: string; tenantId: string },
    @Ip() ip: string,
  ) {
    return this.service.utiliser(dto.code, {
      tenantSlug: user.tenantId,
      userId: user.userId,
      ip,
    });
  }
}
