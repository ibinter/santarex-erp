import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @Post('initier')
  initier(@Body() dto: InitierPaiementDto, @Req() req: Request) {
    return this.service.initier(dto, (req as any).user?.id);
  }

  @SkipThrottle()
  @Post('webhook/cinetpay')
  webhookCinetPay(@Body() payload: Record<string, unknown>) {
    return this.service.webhookCinetPay(payload);
  }

  @SkipThrottle()
  @Post('webhook/orangemoney')
  webhookOrangeMoney(@Body() payload: Record<string, unknown>) {
    return this.service.webhookOrangeMoney(payload);
  }

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
