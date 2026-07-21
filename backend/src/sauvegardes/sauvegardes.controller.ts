import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SauvegardesService } from './sauvegardes.service';
import { CreerSauvegardeDto } from './dto/creer-sauvegarde.dto';
import { RestaurerSauvegardeDto } from './dto/restaurer-sauvegarde.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

/**
 * Gestion des sauvegardes / restaurations de la base — STRICTEMENT réservé au
 * SUPERADMIN. La création (dump) est une opération de lecture, sûre. La
 * restauration est destructrice et protégée par un jeton de confirmation fort.
 */
@ApiTags('Sauvegardes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('sauvegardes')
export class SauvegardesController {
  constructor(private readonly service: SauvegardesService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les sauvegardes' })
  lister() {
    return this.service.lister();
  }

  @Post()
  @ApiOperation({ summary: 'Créer une sauvegarde (pg_dump)' })
  creer(@Body() dto: CreerSauvegardeDto, @CurrentUser() user: any) {
    return this.service.creerSauvegarde(user?.id ?? null, dto.nom);
  }

  @Get(':id/telecharger')
  @ApiOperation({ summary: 'Télécharger le fichier dump (stream sécurisé)' })
  async telecharger(
    @Param('id') id: string,
    @Res({ passthrough: false }) res: Response,
  ) {
    const { stream, nomFichier, taille } =
      await this.service.ouvrirFluxTelechargement(id);
    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${nomFichier}"`,
      'Content-Length': String(taille),
    });
    stream.on('error', () => {
      if (!res.headersSent) res.status(500);
      res.end();
    });
    stream.pipe(res);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une sauvegarde (ligne + fichier dump)' })
  supprimer(@Param('id') id: string) {
    return this.service.supprimer(id);
  }

  @Post(':id/restaurer')
  @ApiOperation({
    summary:
      'Restaurer la base depuis une sauvegarde (DESTRUCTEUR — confirmation forte requise)',
  })
  restaurer(
    @Param('id') id: string,
    @Body() dto: RestaurerSauvegardeDto,
    @CurrentUser() user: any,
  ) {
    return this.service.restaurer(id, dto.confirmationText, user?.id ?? null);
  }
}
