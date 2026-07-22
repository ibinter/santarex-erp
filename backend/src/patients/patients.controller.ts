import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { SearchDto } from '../common/dto/search.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, LicenceGuard, ModuleGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des patients', description: 'Retourne la liste paginée des patients actifs de l\'établissement' })
  @ApiResponse({ status: 200, description: 'Liste récupérée avec succès' })
  async findAll(
    @CurrentUser('tenantId') tenantId: string,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.patientsService.findAll(tenantId, paginationDto);
  }

  @Get('search')
  @ApiOperation({ summary: 'Recherche de patients', description: 'Recherche par nom, prénom, téléphone ou IPP' })
  @ApiQuery({ name: 'q', description: 'Terme de recherche', required: true })
  @ApiResponse({ status: 200, description: 'Résultats de recherche' })
  async search(
    @CurrentUser('tenantId') tenantId: string,
    @Query() searchDto: SearchDto,
  ) {
    return this.patientsService.search(searchDto.q || '', tenantId, searchDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un patient', description: 'Retourne le dossier complet d\'un patient par son UUID' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  @ApiResponse({ status: 200, description: 'Patient trouvé' })
  @ApiResponse({ status: 404, description: 'Patient introuvable' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.patientsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un patient', description: 'Crée un nouveau dossier patient avec génération automatique de l\'IPP' })
  @ApiResponse({ status: 201, description: 'Patient créé avec succès' })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  async create(
    @Body() dto: CreatePatientDto,
    @CurrentUser('tenantId') tenantId: string,
    @CurrentUser('userId') userId: string,
  ) {
    return this.patientsService.create(dto, tenantId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Modifier un patient', description: 'Met à jour les informations du dossier patient' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  @ApiResponse({ status: 200, description: 'Patient mis à jour' })
  @ApiResponse({ status: 404, description: 'Patient introuvable' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePatientDto,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.patientsService.update(id, dto, tenantId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MEDECIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Désactiver un patient', description: 'Désactive le dossier patient (soft delete — statut: inactif). Réservé aux ADMIN et MEDECIN.' })
  @ApiParam({ name: 'id', description: 'UUID du patient' })
  @ApiResponse({ status: 200, description: 'Patient désactivé' })
  @ApiResponse({ status: 403, description: 'Permissions insuffisantes' })
  @ApiResponse({ status: 404, description: 'Patient introuvable' })
  async softDelete(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('tenantId') tenantId: string,
  ) {
    return this.patientsService.softDelete(id, tenantId);
  }
}
