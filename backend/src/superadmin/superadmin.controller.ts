import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DemoModeGuard } from '../common/guards/demo-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SuperadminService } from './superadmin.service';

@ApiTags('SuperAdmin')
@ApiBearerAuth()
// DemoModeGuard : la console SuperAdmin (KPIs cross-tenant IBIG SOFT) est fermée
// en démonstration publique (§4.5).
@UseGuards(JwtAuthGuard, RolesGuard, DemoModeGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('superadmin')
export class SuperadminController {
  constructor(private readonly superadminService: SuperadminService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard global IBIG SOFT — tous les KPIs en une requête' })
  getDashboard() {
    return this.superadminService.getDashboard();
  }
}
