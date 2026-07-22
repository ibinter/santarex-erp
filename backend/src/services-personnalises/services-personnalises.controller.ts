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
import { ServicesPersonnalisesService } from './services-personnalises.service';
import {
  CreateServicePersonnaliseDto,
  UpdateServicePersonnaliseDto,
  CreateEnregistrementDto,
  UpdateEnregistrementDto,
} from './dto/service-personnalise.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CategorieService } from './entities/service-personnalise.entity';
import { StatutEnregistrement } from './entities/enregistrement-service.entity';

@ApiTags('Services personnalisés')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Controller('services-personnalises')
export class ServicesPersonnalisesController {
  constructor(private readonly service: ServicesPersonnalisesService) {}

  // ── Statistiques ──────────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques des services personnalisés' })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  // ── Définitions de services ───────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Liste des services personnalisés' })
  @ApiQuery({ name: 'categorie', required: false, enum: CategorieService })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  findAll(
    @Request() req,
    @Query('categorie') categorie?: CategorieService,
    @Query('actif') actif?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAllServices(req.user.tenantId, {
      categorie,
      actif: actif === undefined ? undefined : actif === 'true',
      search,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un service personnalisé' })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOneService(id, req.user.tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un service personnalisé (constructeur de formulaire)' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  creer(@Body() dto: CreateServicePersonnaliseDto, @Request() req) {
    return this.service.creerService(dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un service personnalisé' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateServicePersonnaliseDto,
    @Request() req,
  ) {
    return this.service.updateService(id, dto, req.user.tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer un service personnalisé et ses enregistrements' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  remove(@Param('id') id: string, @Request() req) {
    return this.service.removeService(id, req.user.tenantId);
  }

  // ── Enregistrements (tous rôles) ──────────────────────────────────
  @Get(':id/enregistrements')
  @ApiOperation({ summary: 'Liste des enregistrements d\'un service' })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutEnregistrement })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  findEnregistrements(
    @Param('id') id: string,
    @Request() req,
    @Query('patientId') patientId?: string,
    @Query('statut') statut?: StatutEnregistrement,
  ) {
    return this.service.findEnregistrements(id, req.user.tenantId, {
      patientId,
      statut,
    });
  }

  @Post(':id/enregistrements')
  @ApiOperation({ summary: 'Ajouter un enregistrement (formulaire dynamique)' })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  creerEnregistrement(
    @Param('id') id: string,
    @Body() dto: CreateEnregistrementDto,
    @Request() req,
  ) {
    return this.service.creerEnregistrement(id, dto, req.user.tenantId, req.user.id);
  }

  @Patch(':id/enregistrements/:enrId')
  @ApiOperation({ summary: 'Modifier un enregistrement' })
  @Roles(
    UserRole.ADMIN,
    UserRole.DIRECTEUR,
    UserRole.MEDECIN,
    UserRole.INFIRMIER,
    UserRole.PHARMACIEN,
    UserRole.LABORANTIN,
    UserRole.CAISSIER,
    UserRole.DRH,
  )
  updateEnregistrement(
    @Param('id') id: string,
    @Param('enrId') enrId: string,
    @Body() dto: UpdateEnregistrementDto,
    @Request() req,
  ) {
    return this.service.updateEnregistrement(id, enrId, dto, req.user.tenantId);
  }

  @Delete(':id/enregistrements/:enrId')
  @ApiOperation({ summary: 'Supprimer un enregistrement' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR)
  removeEnregistrement(
    @Param('id') id: string,
    @Param('enrId') enrId: string,
    @Request() req,
  ) {
    return this.service.removeEnregistrement(id, enrId, req.user.tenantId);
  }
}
