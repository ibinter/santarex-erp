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
import { LaboratoireService } from './laboratoire.service';
import { CreateDemandeAnalyseDto } from './dto/create-demande-analyse.dto';
import { SaisirTousResultatsDto } from './dto/saisir-resultats.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CategorieAnalyse } from './entities/type-analyse.entity';
import { StatutPrelevement } from './entities/demande-analyse.entity';
import { TypeAnalyse } from './entities/type-analyse.entity';

@ApiTags('Laboratoire')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('laboratoire')
export class LaboratoireController {
  constructor(private readonly laboService: LaboratoireService) {}

  // â”€â”€ Types d'analyse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('types-analyse')
  @ApiOperation({ summary: 'Catalogue des types d\'analyse' })
  @ApiQuery({ name: 'categorie', required: false, enum: CategorieAnalyse })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAllTypes(
    @Request() req,
    @Query('categorie') categorie?: CategorieAnalyse,
    @Query('search') search?: string,
  ) {
    return this.laboService.findAllTypesAnalyse(req.user.tenantId, { categorie, search });
  }

  @Post('types-analyse')
  @ApiOperation({ summary: 'CrÃ©er un type d\'analyse dans le catalogue' })
  createType(@Body() dto: Partial<TypeAnalyse>, @Request() req) {
    return this.laboService.createTypeAnalyse(dto, req.user.tenantId);
  }

  // â”€â”€ Demandes d'analyse â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('demandes')
  @ApiOperation({ summary: 'Liste des demandes d\'analyse avec filtres' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'statut', required: false, enum: StatutPrelevement })
  @ApiQuery({ name: 'urgence', required: false, type: Boolean })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Format YYYY-MM-DD' })
  findAllDemandes(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('patientId') patientId?: string,
    @Query('statut') statut?: StatutPrelevement,
    @Query('urgence') urgence?: string,
    @Query('date') date?: string,
  ) {
    return this.laboService.findAllDemandes(
      req.user.tenantId,
      {
        patientId,
        statut,
        urgence: urgence !== undefined ? urgence === 'true' : undefined,
        date,
      },
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  @Post('demandes')
  @ApiOperation({ summary: 'CrÃ©er une demande d\'analyse' })
  creerDemande(@Body() dto: CreateDemandeAnalyseDto, @Request() req) {
    return this.laboService.creerDemande(dto, req.user.tenantId, req.user.id);
  }

  @Get('demandes/:id')
  @ApiOperation({ summary: 'DÃ©tail d\'une demande d\'analyse' })
  findOneDemande(@Param('id') id: string, @Request() req) {
    return this.laboService.findOneDemande(id, req.user.tenantId);
  }

  @Patch('demandes/:id/prelever')
  @ApiOperation({ summary: 'Marquer une demande comme prÃ©levÃ©e' })
  marquerPreleve(@Param('id') id: string, @Request() req) {
    return this.laboService.marquerPreleve(id, req.user.tenantId, req.user.id);
  }

  @Post('demandes/:id/resultats')
  @ApiOperation({ summary: 'Saisir les rÃ©sultats d\'une demande d\'analyse' })
  saisirResultats(
    @Param('id') id: string,
    @Body() dto: SaisirTousResultatsDto,
    @Request() req,
  ) {
    return this.laboService.saisirResultats(id, dto, req.user.tenantId, req.user.id);
  }

  @Patch('demandes/:id/valider')
  @ApiOperation({ summary: 'Valider et clÃ´turer les rÃ©sultats d\'une demande' })
  validerResultats(@Param('id') id: string, @Request() req) {
    return this.laboService.validerResultats(id, req.user.tenantId, req.user.id);
  }

  // â”€â”€ RÃ©sultats par patient â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('patients/:patientId/resultats')
  @ApiOperation({ summary: 'Historique des rÃ©sultats validÃ©s d\'un patient' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  getResultatsPatient(
    @Param('patientId') patientId: string,
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.laboService.getResultatsPatient(
      patientId,
      req.user.tenantId,
      { page: page ? +page : 1, limit: limit ? +limit : 20 },
    );
  }

  // â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  @Get('stats/jour')
  @ApiOperation({ summary: 'Statistiques laboratoire du jour' })
  getStats(@Request() req) {
    return this.laboService.getStatsDuJour(req.user.tenantId);
  }
}

