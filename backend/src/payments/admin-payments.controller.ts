// ════════════════════════════════════════════════════════════════════════════
//  Contrôleur admin — configuration des moyens de paiement.
//  Protégé JwtAuthGuard + RolesGuard (@Roles admin / superadmin).
//  Les secrets renvoyés sont TOUJOURS masqués (voir PaymentConfigService).
// ════════════════════════════════════════════════════════════════════════════

import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Logger,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentConfigService } from './payments-config.service';
import { UpsertPaymentConfigDto, TogglePaymentConfigDto } from './dto/config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { DemoModeGuard } from '../common/guards/demo-mode.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin · Paiements · Configuration')
@ApiBearerAuth()
// DemoModeGuard : la configuration des moyens de paiement est fermée en
// démonstration publique (§4.5) — le paiement est désactivé en démo.
@UseGuards(JwtAuthGuard, RolesGuard, DemoModeGuard)
// SUPERADMIN uniquement : cette configuration est GLOBALE (clés de la passerelle qui encaisse les
// licences). Un administrateur d'établissement ne doit jamais pouvoir la lire ni la modifier.
@Roles(UserRole.SUPERADMIN)
@Controller('admin/payments/config')
export class AdminPaymentsController {
  private readonly logger = new Logger(AdminPaymentsController.name);

  constructor(private readonly configService: PaymentConfigService) {}

  /**
   * Cet écran est réservé au superadministrateur : en cas d'erreur inattendue, on renvoie la VRAIE
   * raison (au lieu de « Internal server error ») et on l'écrit dans le journal du serveur.
   */
  private async expliquer<T>(action: string, travail: () => Promise<T>): Promise<T> {
    try {
      return await travail();
    } catch (err) {
      if (err instanceof HttpException) throw err;
      const raison = (err as Error)?.message ?? String(err);
      this.logger.error(`Paiements (${action}) : ${raison}`, (err as Error)?.stack);
      throw new InternalServerErrorException(`Paiements (${action}) : ${raison}`.slice(0, 400));
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lister les moyens de paiement (secrets masqués).' })
  list() {
    return this.expliquer('lecture', () => this.configService.list());
  }

  @Post()
  @ApiOperation({ summary: 'Créer / mettre à jour un moyen de paiement (upsert par clé).' })
  upsert(
    @Body() dto: UpsertPaymentConfigDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.expliquer('enregistrement', () => this.configService.upsert(dto, adminId));
  }

  @Patch(':key/toggle')
  @ApiOperation({ summary: 'Activer / désactiver un moyen de paiement.' })
  toggle(
    @Param('key') key: string,
    @Body() dto: TogglePaymentConfigDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.configService.toggle(key, dto.enabled, adminId);
  }

  @Delete(':key')
  @ApiOperation({ summary: 'Supprimer un moyen de paiement.' })
  remove(
    @Param('key') key: string,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.configService.remove(key, adminId);
  }

  @Post('seed-defaults')
  @ApiOperation({ summary: 'Amorcer les moyens de paiement par défaut (désactivés).' })
  seedDefaults() {
    return this.expliquer('création', () => this.configService.seedDefaults());
  }
}
