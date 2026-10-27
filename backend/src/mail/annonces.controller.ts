import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DemoModeGuard } from '../common/guards/demo-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { AnnoncesService } from './annonces.service';
import { AnnonceEnvoiDto, AnnonceTestDto } from './annonces.dto';

@ApiTags('SuperAdmin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, DemoModeGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('superadmin/annonces')
export class AnnoncesController {
  constructor(private readonly annonces: AnnoncesService) {}

  @Get('destinataires')
  @ApiOperation({ summary: 'Qui recevrait une annonce (administrateurs des établissements abonnés)' })
  destinataires() {
    return this.annonces.destinataires();
  }

  @Post('test')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @ApiOperation({ summary: "Envoie l'annonce à UNE adresse (la vôtre) pour la relire" })
  test(@Body() dto: AnnonceTestDto) {
    return this.annonces.envoyerTest(dto.sujet, dto.message, dto.testA);
  }

  @Post('envoyer')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { ttl: 3600000, limit: 3 } })
  @ApiOperation({ summary: 'Envoie l\'annonce à tous les abonnés (confirmation « ENVOYER » exigée)' })
  envoyer(@Body() dto: AnnonceEnvoiDto) {
    return this.annonces.envoyerATous(dto.sujet, dto.message);
  }
}
