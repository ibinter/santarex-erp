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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentConfigService } from './payments-config.service';
import { UpsertPaymentConfigDto, TogglePaymentConfigDto } from './dto/config.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Admin · Paiements · Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
@Controller('admin/payments/config')
export class AdminPaymentsController {
  constructor(private readonly configService: PaymentConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les moyens de paiement (secrets masqués).' })
  list() {
    return this.configService.list();
  }

  @Post()
  @ApiOperation({ summary: 'Créer / mettre à jour un moyen de paiement (upsert par clé).' })
  upsert(
    @Body() dto: UpsertPaymentConfigDto,
    @CurrentUser('userId') adminId: string,
  ) {
    return this.configService.upsert(dto, adminId);
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
    return this.configService.seedDefaults();
  }
}
