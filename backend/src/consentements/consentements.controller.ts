import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';

import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

import { ConsentementsService } from './consentements.service';
import { TypeConsentement } from './entities/modele-consentement.entity';
import { StatutConsentement } from './entities/consentement.entity';
import {
  CreateModeleConsentementDto,
  UpdateModeleConsentementDto,
  CreateConsentementDto,
  SignerConsentementDto,
  RefuserConsentementDto,
  RevoquerConsentementDto,
} from './dto/consentement.dto';

@ApiTags('Consentements éclairés')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Lecture ouverte au personnel soignant ; création/signature réservées aux
// prescripteurs et à l'administration ; suppression réservée à l'encadrement.
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('consentements')
export class ConsentementsController {
  constructor(private readonly service: ConsentementsService) {}

  // ── Modèles ───────────────────────────────────────────────────────────────

  @Get('modeles')
  @ApiOperation({ summary: 'Liste des modèles de consentement' })
  @ApiQuery({ name: 'type', required: false, enum: TypeConsentement })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  findAllModeles(
    @Request() req,
    @Query('type') type?: TypeConsentement,
    @Query('actif') actif?: string,
  ) {
    return this.service.findAllModeles(req.user.tenantId, {
      type,
      actif: actif !== undefined ? actif === 'true' : undefined,
    });
  }

  @Get('modeles/:id')
  @ApiOperation({ summary: "Détail d'un modèle de consentement" })
  findOneModele(@Param('id') id: string, @Request() req) {
    return this.service.findOneModele(id, req.user.tenantId);
  }

  @Post('modeles')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Créer un modèle de consentement' })
  createModele(@Body() dto: CreateModeleConsentementDto, @Request() req) {
    return this.service.createModele(dto, req.user.tenantId);
  }

  @Patch('modeles/:id')
  @Roles(UserRole.MEDECIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Modifier un modèle de consentement' })
  updateModele(
    @Param('id') id: string,
    @Body() dto: UpdateModeleConsentementDto,
    @Request() req,
  ) {
    return this.service.updateModele(id, dto, req.user.tenantId);
  }

  @Delete('modeles/:id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un modèle de consentement' })
  removeModele(@Param('id') id: string, @Request() req) {
    return this.service.removeModele(id, req.user.tenantId);
  }

  // ── Stats ───────────────────────────────────────────────────────────────

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des consentements' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Consentements ─────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Liste des consentements avec filtres' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutConsentement })
  @ApiQuery({ name: 'type', required: false, enum: TypeConsentement })
  @ApiQuery({ name: 'interventionId', required: false, type: String })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string,
    @Query('statut') statut?: StatutConsentement,
    @Query('type') type?: TypeConsentement,
    @Query('interventionId') interventionId?: string,
  ) {
    return this.service.findAllConsentements(
      req.user.tenantId,
      { patientId, statut, type, interventionId },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Get(':id')
  @ApiOperation({ summary: "Détail d'un consentement" })
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOneConsentement(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un consentement (depuis un modèle ou libre)' })
  create(@Body() dto: CreateConsentementDto, @Request() req) {
    return this.service.createConsentement(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/signer')
  @ApiOperation({ summary: 'Enregistrer la signature du consentement' })
  signer(
    @Param('id') id: string,
    @Body() dto: SignerConsentementDto,
    @Request() req,
  ) {
    return this.service.signer(id, dto, req.user.tenantId);
  }

  @Patch(':id/refuser')
  @ApiOperation({ summary: 'Enregistrer le refus du consentement (avec motif)' })
  refuser(
    @Param('id') id: string,
    @Body() dto: RefuserConsentementDto,
    @Request() req,
  ) {
    return this.service.refuser(id, dto, req.user.tenantId);
  }

  @Patch(':id/revoquer')
  @ApiOperation({ summary: 'Révoquer un consentement signé (avec motif)' })
  revoquer(
    @Param('id') id: string,
    @Body() dto: RevoquerConsentementDto,
    @Request() req,
  ) {
    return this.service.revoquer(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Supprimer un consentement (hors signé)' })
  remove(@Param('id') id: string, @Request() req) {
    return this.service.removeConsentement(id, req.user.tenantId);
  }
}
