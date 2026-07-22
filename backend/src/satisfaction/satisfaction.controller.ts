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
import { SatisfactionService } from './satisfaction.service';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  CreateReponseDto,
} from './dto/satisfaction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Satisfaction Patient')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
// Ouvert au personnel soignant/administratif : la collecte est réalisée au chevet
// du patient (infirmiers, médecins) et l'analyse consultée par l'administration.
@Roles(
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.PHARMACIEN,
  UserRole.LABORANTIN,
  UserRole.CAISSIER,
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
)
@Controller('satisfaction')
export class SatisfactionController {
  constructor(private readonly service: SatisfactionService) {}

  // ── Analyse / stats ────────────────────────────────────────────
  @Get('stats')
  @ApiOperation({ summary: 'Statistiques synthétiques (KPI en-tête)' })
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @Get('analyse')
  @ApiOperation({ summary: 'Tableau de bord d\'analyse (score, NPS, par question/service, évolution)' })
  @ApiQuery({ name: 'questionnaireId', required: false, type: String })
  @ApiQuery({ name: 'serviceConcerne', required: false, type: String })
  getAnalyse(
    @Request() req,
    @Query('questionnaireId') questionnaireId?: string,
    @Query('serviceConcerne') serviceConcerne?: string,
  ) {
    return this.service.getAnalyse(req.user.tenantId, { questionnaireId, serviceConcerne });
  }

  // ── Questionnaires (CRUD) ──────────────────────────────────────
  @Get('questionnaires')
  @ApiOperation({ summary: 'Liste des questionnaires' })
  @ApiQuery({ name: 'actif', required: false, type: Boolean })
  listerQuestionnaires(@Request() req, @Query('actif') actif?: string) {
    const flag = actif === undefined ? undefined : actif === 'true';
    return this.service.listerQuestionnaires(req.user.tenantId, flag);
  }

  @Post('questionnaires')
  @ApiOperation({ summary: 'Créer un questionnaire' })
  creerQuestionnaire(@Body() dto: CreateQuestionnaireDto, @Request() req) {
    return this.service.creerQuestionnaire(dto, req.user.tenantId);
  }

  @Get('questionnaires/:id')
  @ApiOperation({ summary: 'Détail d\'un questionnaire' })
  getQuestionnaire(@Param('id') id: string, @Request() req) {
    return this.service.getQuestionnaire(id, req.user.tenantId);
  }

  @Patch('questionnaires/:id')
  @ApiOperation({ summary: 'Mettre à jour un questionnaire' })
  majQuestionnaire(
    @Param('id') id: string,
    @Body() dto: UpdateQuestionnaireDto,
    @Request() req,
  ) {
    return this.service.majQuestionnaire(id, dto, req.user.tenantId);
  }

  @Delete('questionnaires/:id')
  @ApiOperation({ summary: 'Supprimer un questionnaire' })
  supprimerQuestionnaire(@Param('id') id: string, @Request() req) {
    return this.service.supprimerQuestionnaire(id, req.user.tenantId);
  }

  // ── Réponses (collecte) ────────────────────────────────────────
  @Get('reponses')
  @ApiOperation({ summary: 'Liste filtrable des réponses collectées' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'questionnaireId', required: false, type: String })
  @ApiQuery({ name: 'serviceConcerne', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  listerReponses(
    @Request() req,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('questionnaireId') questionnaireId?: string,
    @Query('serviceConcerne') serviceConcerne?: string,
    @Query('patientId') patientId?: string,
  ) {
    return this.service.listerReponses(
      req.user.tenantId,
      { questionnaireId, serviceConcerne, patientId },
      { page: page ? +page : 1, limit: limit ? +limit : 50 },
    );
  }

  @Post('reponses')
  @ApiOperation({ summary: 'Enregistrer une réponse (calcul du score & NPS)' })
  creerReponse(@Body() dto: CreateReponseDto, @Request() req) {
    return this.service.creerReponse(dto, req.user.tenantId);
  }
}
