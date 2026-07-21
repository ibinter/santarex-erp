import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ComptabiliteService } from './comptabilite.service';
import { CreateEcritureDto } from './dto/create-ecriture.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutEcriture } from './entities/ecriture-comptable.entity';

/**
 * Comptabilité SYSCOHADA simplifiée, multi-tenant.
 * Le rôle « comptable » n'existe pas dans l'enum : accès réservé à la
 * direction et à l'administration (ADMIN, DIRECTEUR).
 */
@Controller('comptabilite')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
export class ComptabiliteController {
  constructor(private readonly comptabiliteService: ComptabiliteService) {}

  @Get('ecritures')
  findAll(
    @Request() req,
    @Query('journal') journal?: string,
    @Query('statut') statut?: StatutEcriture,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 50,
  ) {
    return this.comptabiliteService.findAll(
      req.user.tenantId,
      { journal, statut, dateDebut, dateFin },
      { page: Number(page), limit: Number(limit) },
    );
  }

  @Post('ecritures')
  create(@Body() dto: CreateEcritureDto, @Request() req) {
    return this.comptabiliteService.createEcriture(
      dto,
      req.user.tenantId,
      req.user.id,
    );
  }

  @Post('ecritures/:id/valider')
  valider(@Param('id') id: string, @Request() req) {
    return this.comptabiliteService.validerEcriture(id, req.user.tenantId);
  }

  @Get('comptes')
  getComptes(@Request() req) {
    return this.comptabiliteService.getComptes(req.user.tenantId);
  }

  @Get('grand-livre')
  getGrandLivre(
    @Request() req,
    @Query('compte') compte: string,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.comptabiliteService.getGrandLivre(req.user.tenantId, compte, {
      dateDebut,
      dateFin,
    });
  }

  @Get('balance')
  getBalance(
    @Request() req,
    @Query('dateDebut') dateDebut?: string,
    @Query('dateFin') dateFin?: string,
  ) {
    return this.comptabiliteService.getBalance(req.user.tenantId, {
      dateDebut,
      dateFin,
    });
  }

  @Get('bilan')
  getBilan(@Request() req) {
    return this.comptabiliteService.getBilan(req.user.tenantId);
  }

  @Get('stats')
  getStats(@Request() req) {
    return this.comptabiliteService.getStats(req.user.tenantId);
  }
}
