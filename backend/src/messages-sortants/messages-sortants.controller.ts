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
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MessagesSortantsService } from './messages-sortants.service';
import { CreateModeleMessageDto, UpdateModeleMessageDto } from './dto/modele-message.dto';
import { EnvoiMessageDto } from './dto/envoi-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { StatutMessageSortant } from './entities/message-sortant.entity';
import { CanalMessage } from './entities/modele-message.entity';

@ApiTags('Messages sortants (SMS / WhatsApp)')
@ApiBearerAuth()
@Controller('messages-sortants')
@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard)
@Roles(
  UserRole.ADMIN,
  UserRole.DIRECTEUR,
  UserRole.MEDECIN,
  UserRole.INFIRMIER,
  UserRole.CAISSIER,
)
export class MessagesSortantsController {
  constructor(private readonly service: MessagesSortantsService) {}

  // ─── Modèles ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Lister les modèles de messages' })
  @Get('modeles')
  findModeles(@Request() req) {
    return this.service.findModeles(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Créer un modèle de message' })
  @Post('modeles')
  createModele(@Body() dto: CreateModeleMessageDto, @Request() req) {
    return this.service.createModele(dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Modifier un modèle de message' })
  @Patch('modeles/:id')
  updateModele(@Param('id') id: string, @Body() dto: UpdateModeleMessageDto, @Request() req) {
    return this.service.updateModele(id, dto, req.user.tenantId);
  }

  @ApiOperation({ summary: 'Supprimer un modèle de message' })
  @Delete('modeles/:id')
  deleteModele(@Param('id') id: string, @Request() req) {
    return this.service.deleteModele(id, req.user.tenantId);
  }

  // ─── Stats & rappels (avant :id pour éviter les collisions) ────────────────

  @ApiOperation({ summary: 'Statistiques des messages (jour + global)' })
  @Get('stats')
  getStats(@Request() req) {
    return this.service.getStats(req.user.tenantId);
  }

  @ApiOperation({ summary: 'Générer manuellement les rappels de RDV du lendemain' })
  @Post('generer-rappels')
  genererRappels(@Request() req) {
    return this.service
      .genererRappelsRdv(req.user.tenantId)
      .then((crees) => ({ crees }));
  }

  // ─── Messages ───────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Historique des messages sortants' })
  @Get()
  findMessages(
    @Request() req,
    @Query('statut') statut?: StatutMessageSortant,
    @Query('canal') canal?: CanalMessage,
    @Query('patientId') patientId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.service.findMessages(
      req.user.tenantId,
      { statut, canal, patientId },
      { page: page ? +page : undefined, limit: limit ? +limit : undefined },
    );
  }

  @ApiOperation({ summary: 'Envoyer un message (unitaire, modèle ou texte libre)' })
  @Post()
  envoyer(@Body() dto: EnvoiMessageDto, @Request() req) {
    return this.service.envoyer(dto, req.user.tenantId, req.user.id);
  }
}
