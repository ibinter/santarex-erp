import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipLicence } from '../common/decorators/skip-licence.decorator';
import { UserRole } from '../users/entities/user.entity';
import { HealthService, HealthDetails, HealthSummary } from './health.service';

@ApiTags('Santé / Observabilité')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  /** Sonde publique et légère (probe Kubernetes / uptime). */
  @Get()
  @SkipLicence()
  @ApiOperation({ summary: 'Health-check public — teste réellement la base de données' })
  getSummary(): Promise<HealthSummary> {
    return this.healthService.getSummary();
  }

  /** Détail par service — réservé SUPERADMIN. */
  @Get('details')
  @SkipLicence()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'État détaillé des services (DB, SMTP, IA, disque, mémoire) — SUPERADMIN',
  })
  getDetails(): Promise<HealthDetails> {
    return this.healthService.getDetails();
  }
}
