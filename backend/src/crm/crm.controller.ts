import {
  Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CrmService } from './crm.service';
import { ProspectStatut, ProspectOrigine, DemandeDemoStatut } from './crm.enums';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto, UpdateStatutDto } from './dto/update-prospect.dto';
import {
  DemandeDemoPubliqueDto, CreateDemandeDemoDto, UpdateDemandeDemoDto,
} from './dto/demande-demo.dto';

// Guards réservés aux routes superadmin (appliqués au niveau méthode pour
// laisser la route publique de la landing totalement ouverte).
const SUPERADMIN_GUARDS = [JwtAuthGuard, RolesGuard];

@ApiTags('CRM')
@Controller('crm')
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  // ══════════════════════════════════════════════════════════════════════════
  //  ROUTE PUBLIQUE — formulaire de démo de la landing (AUCUN guard)
  // ══════════════════════════════════════════════════════════════════════════

  @Post('demande-demo')
  @ApiOperation({ summary: 'Formulaire public de demande de démonstration (landing)' })
  demandePublique(@Body() dto: DemandeDemoPubliqueDto) {
    return this.crmService.traiterDemandePublique(dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PROSPECTS (superadmin)
  // ══════════════════════════════════════════════════════════════════════════

  @Get('prospects')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Liste des prospects (filtrable)' })
  listerProspects(
    @Query('statut') statut?: ProspectStatut,
    @Query('origine') origine?: ProspectOrigine,
    @Query('q') q?: string,
  ) {
    return this.crmService.listerProspects({ statut, origine, q });
  }

  @Get('prospects/:id')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Fiche prospect' })
  getProspect(@Param('id', ParseUUIDPipe) id: string) {
    return this.crmService.getProspect(id);
  }

  @Post('prospects')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer un prospect' })
  creerProspect(@Body() dto: CreateProspectDto) {
    return this.crmService.creerProspect(dto);
  }

  @Patch('prospects/:id')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Mettre à jour un prospect' })
  majProspect(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateProspectDto) {
    return this.crmService.majProspect(id, dto);
  }

  @Patch('prospects/:id/statut')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Changer le statut pipeline d\'un prospect' })
  changerStatut(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateStatutDto) {
    return this.crmService.changerStatut(id, dto.statut);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DEMANDES DE DÉMO (superadmin)
  // ══════════════════════════════════════════════════════════════════════════

  @Get('demandes-demo')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Liste des demandes de démonstration' })
  listerDemandes(@Query('statut') statut?: DemandeDemoStatut) {
    return this.crmService.listerDemandes(statut);
  }

  @Post('demandes-demo')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer une demande de démonstration' })
  creerDemande(@Body() dto: CreateDemandeDemoDto) {
    return this.crmService.creerDemande(dto);
  }

  @Patch('demandes-demo/:id')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Mettre à jour une demande (planifier, réaliser…)' })
  majDemande(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDemandeDemoDto) {
    return this.crmService.majDemande(id, dto);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STATS — funnel
  // ══════════════════════════════════════════════════════════════════════════

  @Get('stats')
  @ApiBearerAuth()
  @UseGuards(...SUPERADMIN_GUARDS)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistiques du pipeline (funnel)' })
  getStats() {
    return this.crmService.getStats();
  }
}
