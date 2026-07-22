import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { PriseEnChargeService } from './prise-en-charge.service';
import { CreateAssureurDto } from './dto/create-assureur.dto';
import { CreateBonDto } from './dto/create-bon.dto';
import { RepondreBonDto } from './dto/repondre-bon.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutBon } from './entities/bon-prise-en-charge.entity';

@ApiTags('Prise en charge')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte au personnel administratif/soignant ; mutations réservées
// aux profils facturation/administration.
@Roles(
  UserRole.CAISSIER,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('prise-en-charge')
export class PriseEnChargeController {
  constructor(private readonly service: PriseEnChargeService) {}

  // ── Assureurs ────────────────────────────────────────────────────
  @Get('assureurs')
  @ApiOperation({ summary: 'Liste des assureurs / mutuelles' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  findAllAssureurs(
    @Request() req,
    @Query('search') search?: string,
    @Query('actif') actif?: string,
  ) {
    return this.service.findAllAssureurs(req.user.tenantId, {
      search,
      actif: actif !== undefined ? actif === 'true' : undefined,
    });
  }

  @Post('assureurs')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un assureur' })
  createAssureur(@Body() dto: CreateAssureurDto, @Request() req) {
    return this.service.createAssureur(dto, req.user.tenantId);
  }

  @Get('assureurs/:id')
  @ApiOperation({ summary: "Détail d'un assureur" })
  findOneAssureur(@Param('id') id: string, @Request() req) {
    return this.service.findOneAssureur(id, req.user.tenantId);
  }

  @Patch('assureurs/:id')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Modifier un assureur' })
  updateAssureur(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAssureurDto>,
    @Request() req,
  ) {
    return this.service.updateAssureur(id, dto, req.user.tenantId);
  }

  // ── Bons de prise en charge ──────────────────────────────────────
  @Get('bons')
  @ApiOperation({ summary: 'Liste des bons de prise en charge' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'assureurId', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutBon })
  findAllBons(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string,
    @Query('assureurId') assureurId?: string,
    @Query('statut') statut?: StatutBon,
  ) {
    return this.service.findAllBons(
      req.user.tenantId,
      { patientId, assureurId, statut },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Post('bons')
  @Roles(UserRole.CAISSIER, UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un bon de prise en charge' })
  createBon(@Body() dto: CreateBonDto, @Request() req) {
    return this.service.createBon(dto, req.user.tenantId, req.user.id);
  }

  @Get('bons/:id')
  @ApiOperation({ summary: "Détail d'un bon de prise en charge" })
  findOneBon(@Param('id') id: string, @Request() req) {
    return this.service.findOneBon(id, req.user.tenantId);
  }

  @Patch('bons/:id')
  @Roles(UserRole.CAISSIER, UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Modifier un bon (brouillon uniquement)' })
  updateBon(
    @Param('id') id: string,
    @Body() dto: Partial<CreateBonDto>,
    @Request() req,
  ) {
    return this.service.updateBon(id, dto, req.user.tenantId);
  }

  @Patch('bons/:id/envoyer')
  @Roles(UserRole.CAISSIER, UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: "Envoyer la demande à l'assureur" })
  envoyerBon(@Param('id') id: string, @Request() req) {
    return this.service.envoyerBon(id, req.user.tenantId);
  }

  @Patch('bons/:id/repondre')
  @Roles(UserRole.CAISSIER, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: "Enregistrer la réponse de l'assureur (accepté / refusé)" })
  repondreBon(
    @Param('id') id: string,
    @Body() dto: RepondreBonDto,
    @Request() req,
  ) {
    return this.service.repondreBon(id, dto, req.user.tenantId);
  }

  // ── Stats ────────────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques prise en charge' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }
}
