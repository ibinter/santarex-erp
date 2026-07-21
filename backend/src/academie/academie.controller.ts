import {
  Controller, Get, Post, Patch, Body, Param, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AcademieService } from './academie.service';
import { ProgressionStatut } from './academie.enums';
import { CreateParcoursDto, UpdateParcoursDto } from './dto/parcours.dto';
import { CreateRessourceDto, UpdateRessourceDto } from './dto/ressource.dto';
import { MarquerProgressionDto } from './dto/ressource.dto';

/** Utilisateur authentifié tel qu'exposé par la JwtStrategy. */
interface AuthUser { id: string; userId: string; email: string; role: string; tenantId: string | null; }

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.SUPERADMIN];

@ApiTags('Académie')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academie')
export class AcademieController {
  constructor(private readonly academieService: AcademieService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  LECTURE — tout utilisateur authentifié
  // ══════════════════════════════════════════════════════════════════════════

  @Get('parcours')
  @ApiOperation({ summary: 'Parcours de formation publiés (groupés par catégorie)' })
  listerParcours(@CurrentUser() user: AuthUser) {
    return this.academieService.listerParcoursPublies(user.tenantId ?? null);
  }

  @Get('parcours/:id')
  @ApiOperation({ summary: 'Détail d\'un parcours publié et de ses ressources' })
  getParcours(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    return this.academieService.getParcoursPublie(id, user.tenantId ?? null);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMINISTRATION — parcours & ressources (ADMIN / DIRECTEUR / SUPERADMIN)
  // ══════════════════════════════════════════════════════════════════════════

  @Post('parcours')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Créer un parcours de formation' })
  creerParcours(@Body() dto: CreateParcoursDto, @CurrentUser() user: AuthUser) {
    // SUPERADMIN crée du contenu global (tenantId null) ; les autres, du contenu tenant.
    const tenantId = user.role === UserRole.SUPERADMIN ? null : (user.tenantId ?? null);
    return this.academieService.creerParcours(dto, tenantId);
  }

  @Patch('parcours/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Mettre à jour un parcours' })
  majParcours(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateParcoursDto) {
    return this.academieService.majParcours(id, dto);
  }

  @Post('ressources')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Créer une ressource dans un parcours' })
  creerRessource(@Body() dto: CreateRessourceDto) {
    return this.academieService.creerRessource(dto);
  }

  @Patch('ressources/:id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Mettre à jour une ressource' })
  majRessource(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRessourceDto) {
    return this.academieService.majRessource(id, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PROGRESSION — utilisateur courant
  // ══════════════════════════════════════════════════════════════════════════

  @Post('progression/:ressourceId')
  @ApiOperation({ summary: 'Marquer une ressource consultée / terminée' })
  marquerProgression(
    @Param('ressourceId', ParseUUIDPipe) ressourceId: string,
    @Body() dto: MarquerProgressionDto,
    @CurrentUser() user: AuthUser,
  ) {
    const statut = dto.statut === 'termine' ? ProgressionStatut.TERMINE : ProgressionStatut.EN_COURS;
    return this.academieService.marquerProgression(user.id, user.tenantId ?? null, ressourceId, statut);
  }

  @Get('progression')
  @ApiOperation({ summary: 'Ma progression de formation' })
  maProgression(@CurrentUser() user: AuthUser) {
    return this.academieService.maProgression(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques de progression de formation' })
  getStats(@CurrentUser() user: AuthUser) {
    return this.academieService.getStats(user.id, user.tenantId ?? null);
  }
}
