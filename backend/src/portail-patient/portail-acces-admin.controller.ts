import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { PortailPatientService } from './portail-patient.service';
import { CreateAccesDto } from './dto/create-acces.dto';
import { ResetMotDePasseDto } from './dto/reset-mot-de-passe.dto';

/**
 * Surface STAFF (Administration) : gestion du cycle de vie des accès portail.
 * Protégée par l'authentification personnel classique (JwtAuthGuard + rôles).
 * Toutes les opérations sont scopées au tenant de l'utilisateur connecté.
 *
 * Route de base : /api/v1/portail-patient/acces
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
@Controller('portail-patient/acces')
export class PortailAccesAdminController {
  constructor(private readonly service: PortailPatientService) {}

  @Get()
  lister(@CurrentUser('tenantId') tenantId: string) {
    return this.service.listerAcces(tenantId);
  }

  @Post()
  creer(@Body() dto: CreateAccesDto, @CurrentUser('tenantId') tenantId: string) {
    return this.service.creerAcces(dto, tenantId);
  }

  @Patch(':id/activer')
  activer(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.definirActif(id, true, tenantId);
  }

  @Patch(':id/desactiver')
  desactiver(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.definirActif(id, false, tenantId);
  }

  @Patch(':id/mot-de-passe')
  reinitialiser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ResetMotDePasseDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.service.reinitialiserMotDePasse(id, dto, tenantId);
  }
}
