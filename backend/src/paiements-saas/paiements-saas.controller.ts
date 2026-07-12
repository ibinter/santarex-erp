import { Controller, Post, Get, Body, Param, UseGuards, Req, Headers } from '@nestjs/common';
import { PaiementsSaasService } from './paiements-saas.service';
import { InitierPaiementDto, ValiderPaiementManuelDto } from './dto/initier-paiement.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SkipThrottle } from '@nestjs/throttler';
import { Request } from 'express';

@Controller('paiements-saas')
export class PaiementsSaasController {
  constructor(private readonly service: PaiementsSaasService) {}

  /** Initier un paiement Moneroo — retourne une checkoutUrl */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post('initier')
  initier(@Body() dto: InitierPaiementDto, @Req() req: Request) {
    return this.service.initier(dto, (req as any).user?.id);
  }

  /** Webhook Moneroo — endpoint public, vérification HMAC interne */
  @SkipThrottle()
  @Post('webhook')
  webhook(
    @Body() payload: Record<string, unknown>,
    @Headers('x-moneroo-signature') signature: string,
  ) {
    return this.service.webhook(payload, signature ?? '');
  }

  /** Vérifier le statut d'une transaction Moneroo (polling depuis le frontend) */
  @UseGuards(JwtAuthGuard)
  @Get('statut/:transactionId')
  verifierStatut(@Param('transactionId') transactionId: string) {
    return this.service.verifierStatut(transactionId);
  }

  /** Valider manuellement un paiement (virement, chèque) — SUPERADMIN only */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Post('valider-manuel')
  validerManuel(@Body() dto: ValiderPaiementManuelDto, @Req() req: Request) {
    return this.service.validerManuel(dto, (req as any).user?.id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
}
