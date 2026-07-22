import {
  Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { InteractionsService } from './interactions.service';
import { SeveriteInteraction } from './interactions.enums';
import {
  VerifierInteractionsDto, CreateInteractionDto, UpdateInteractionDto,
  CreateContreIndicationDto,
} from './dto/interaction.dto';

/** Utilisateur authentifié tel qu'exposé par la JwtStrategy. */
interface AuthUser { id: string; userId: string; email: string; role: string; tenantId: string | null; }

const ADMIN_ROLES = [UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.SUPERADMIN, UserRole.PHARMACIEN];

/**
 * Vérificateur d'interactions médicamenteuses & contre-indications.
 *
 * LicenceGuard inclus pour cohérence avec les autres modules ; toutefois ce
 * référentiel est un outil de SÉCURITÉ patient : la vérification et la lecture
 * sont ouvertes à tous les soignants authentifiés.
 */
@ApiTags('Interactions médicamenteuses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Controller('interactions')
export class InteractionsController {
  constructor(private readonly service: InteractionsService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  VÉRIFICATEUR — tout soignant authentifié
  // ══════════════════════════════════════════════════════════════════════════

  @Post('verifier')
  @ApiOperation({ summary: 'Vérifier les interactions entre une liste de médicaments/DCI' })
  verifier(@Body() dto: VerifierInteractionsDto, @CurrentUser() user: AuthUser) {
    return this.service.verifierInteractions(dto.medicaments, user.tenantId ?? null);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RÉFÉRENTIEL — lecture (tout utilisateur authentifié)
  // ══════════════════════════════════════════════════════════════════════════

  @Get()
  @ApiOperation({ summary: 'Lister le référentiel des interactions (filtrable)' })
  @ApiQuery({ name: 'severite', required: false, enum: SeveriteInteraction })
  @ApiQuery({ name: 'dci', required: false, type: String })
  lister(
    @CurrentUser() user: AuthUser,
    @Query('severite') severite?: SeveriteInteraction,
    @Query('dci') dci?: string,
  ) {
    return this.service.listerInteractions(user.tenantId ?? null, { severite, dci });
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques du référentiel visible' })
  stats(@CurrentUser() user: AuthUser) {
    return this.service.getStats(user.tenantId ?? null);
  }

  @Get('contre-indications')
  @ApiOperation({ summary: 'Lister les contre-indications (terrain patient), filtrable' })
  @ApiQuery({ name: 'dci', required: false, type: String })
  @ApiQuery({ name: 'condition', required: false, type: String })
  listerContreIndications(
    @CurrentUser() user: AuthUser,
    @Query('dci') dci?: string,
    @Query('condition') condition?: string,
  ) {
    return this.service.listerContreIndications(user.tenantId ?? null, { dci, condition });
  }

  @Get('recherche')
  @ApiOperation({ summary: 'Rechercher les interactions impliquant une DCI' })
  @ApiQuery({ name: 'dci', required: true, type: String })
  rechercher(@Query('dci') dci: string, @CurrentUser() user: AuthUser) {
    return this.service.rechercherParDci(dci ?? '', user.tenantId ?? null);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ADMINISTRATION du référentiel (écriture réservée admin / pharmacien)
  // ══════════════════════════════════════════════════════════════════════════

  @Post()
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Ajouter une interaction au référentiel du tenant' })
  creer(@Body() dto: CreateInteractionDto, @CurrentUser() user: AuthUser) {
    // SUPERADMIN enrichit le référentiel global (tenantId null) ; sinon référentiel tenant.
    const tenantId = user.role === UserRole.SUPERADMIN ? null : (user.tenantId ?? null);
    return this.service.creerInteraction(dto, tenantId);
  }

  @Patch(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Mettre à jour une interaction' })
  maj(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateInteractionDto) {
    return this.service.majInteraction(id, dto);
  }

  @Delete(':id')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Supprimer une interaction du référentiel du tenant' })
  supprimer(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthUser) {
    const tenantId = user.role === UserRole.SUPERADMIN ? null : (user.tenantId ?? null);
    return this.service.supprimerInteraction(id, tenantId);
  }

  @Post('contre-indications')
  @Roles(...ADMIN_ROLES)
  @ApiOperation({ summary: 'Ajouter une contre-indication au référentiel' })
  creerContreIndication(@Body() dto: CreateContreIndicationDto, @CurrentUser() user: AuthUser) {
    const tenantId = user.role === UserRole.SUPERADMIN ? null : (user.tenantId ?? null);
    return this.service.creerContreIndication(dto, tenantId);
  }
}
