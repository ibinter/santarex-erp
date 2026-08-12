import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DemoModeGuard } from '../common/guards/demo-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SuperadminService } from './superadmin.service';
import { ClientsExportService } from './clients-export.service';

@ApiTags('SuperAdmin')
@ApiBearerAuth()
// DemoModeGuard : la console SuperAdmin (KPIs cross-tenant IBIG SOFT) est fermée
// en démonstration publique (§4.5).
@UseGuards(JwtAuthGuard, RolesGuard, DemoModeGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('superadmin')
export class SuperadminController {
  constructor(
    private readonly superadminService: SuperadminService,
    private readonly clientsExport: ClientsExportService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard global IBIG SOFT — tous les KPIs en une requête' })
  getDashboard() {
    return this.superadminService.getDashboard();
  }

  @Get('clients/statuts')
  @ApiOperation({ summary: 'Liste des statuts disponibles pour filtrer l\'export clients' })
  getStatutsClients() {
    return this.clientsExport.statutsDisponibles();
  }

  @Get('clients/export')
  @ApiOperation({
    summary: 'Exporter la base clients en CSV (tous, ou filtrés par statut)',
  })
  @ApiQuery({ name: 'statut', required: false, description: 'Filtrer par statut (licence ou établissement). Omettre pour tout exporter.' })
  async exporterClients(
    @Query('statut') statut: string | undefined,
    @Res() res: Response,
  ) {
    const csv = await this.clientsExport.genererCsv(statut);
    const suffixe = statut && statut.trim() ? `-${statut.trim()}` : '-tous';
    const date = new Date().toISOString().slice(0, 10);
    res.set({
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="clients-santarex${suffixe}-${date}.csv"`,
    });
    res.end(csv);
  }
}
