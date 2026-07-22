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
import { DeclarationsSanitairesService } from './declarations-sanitaires.service';
import {
  CreateMaladieDto,
  UpdateMaladieDto,
  CreateDeclarationDto,
  UpdateDeclarationDto,
  ChangerStatutDeclarationDto,
  TransmettreDeclarationDto,
} from './dto/declaration-sanitaire.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CategorieMaladie } from './entities/maladie-declarable.entity';
import {
  StatutDeclaration,
  GraviteDeclaration,
} from './entities/declaration-sanitaire.entity';

@ApiTags('Déclarations sanitaires (MDO)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Surveillance épidémiologique : la déclaration est ouverte au personnel
// soignant ; le référentiel MDO et les stats sont utiles à l'admin/direction.
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.LABORANTIN,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('declarations-sanitaires')
export class DeclarationsSanitairesController {
  constructor(private readonly service: DeclarationsSanitairesService) {}

  // ── Référentiel MDO ─────────────────────────────────────────────────────
  @Get('maladies')
  @ApiOperation({ summary: 'Référentiel des maladies à déclaration obligatoire' })
  @ApiQuery({ name: 'categorie', required: false, enum: CategorieMaladie })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String })
  findMaladies(
    @Request() req,
    @Query('categorie') categorie?: CategorieMaladie,
    @Query('actif') actif?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findMaladies(req.user.tenantId, {
      categorie,
      actif: actif === undefined ? undefined : actif === 'true',
      search,
    });
  }

  @Post('maladies')
  @ApiOperation({ summary: 'Ajouter une MDO propre au tenant' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.MEDECIN)
  creerMaladie(@Body() dto: CreateMaladieDto, @Request() req) {
    return this.service.creerMaladie(dto, req.user.tenantId);
  }

  @Patch('maladies/:id')
  @ApiOperation({ summary: 'Modifier une MDO propre au tenant' })
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.MEDECIN)
  updateMaladie(
    @Param('id') id: string,
    @Body() dto: UpdateMaladieDto,
    @Request() req,
  ) {
    return this.service.updateMaladie(id, dto, req.user.tenantId);
  }

  // ── Statistiques & alertes ──────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Tableau de bord épidémiologique' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get('alertes')
  @ApiOperation({ summary: 'Déclarations non transmises urgentes / en retard' })
  getAlertes(@Request() req) {
    return this.service.getAlertes(req.user.tenantId);
  }

  // ── Déclarations ────────────────────────────────────────────────────────
  @Get()
  @ApiOperation({ summary: 'Liste filtrable des déclarations sanitaires' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'statut', required: false, enum: StatutDeclaration })
  @ApiQuery({ name: 'maladieId', required: false, type: String })
  @ApiQuery({ name: 'gravite', required: false, enum: GraviteDeclaration })
  @ApiQuery({ name: 'localite', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('statut') statut?: StatutDeclaration,
    @Query('maladieId') maladieId?: string,
    @Query('gravite') gravite?: GraviteDeclaration,
    @Query('localite') localite?: string,
    @Query('search') search?: string,
  ) {
    return this.service.findAll(
      req.user.tenantId,
      { statut, maladieId, gravite, localite, search },
      { page: page ? +page : 1, limit: limit ? +limit : 50 },
    );
  }

  @Post()
  @ApiOperation({ summary: 'Déclarer un cas de MDO' })
  creer(@Body() dto: CreateDeclarationDto, @Request() req) {
    return this.service.creer(dto, req.user.tenantId, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une déclaration' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(id, req.user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une déclaration' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDeclarationDto,
    @Request() req,
  ) {
    return this.service.update(id, dto, req.user.tenantId);
  }

  @Patch(':id/statut')
  @ApiOperation({ summary: 'Changer le statut (workflow)' })
  changerStatut(
    @Param('id') id: string,
    @Body() dto: ChangerStatutDeclarationDto,
    @Request() req,
  ) {
    return this.service.changerStatut(id, dto, req.user.tenantId);
  }

  @Patch(':id/transmettre')
  @ApiOperation({ summary: 'Marquer transmise à l\'autorité sanitaire' })
  transmettre(
    @Param('id') id: string,
    @Body() dto: TransmettreDeclarationDto,
    @Request() req,
  ) {
    return this.service.transmettre(id, dto, req.user.tenantId);
  }
}
