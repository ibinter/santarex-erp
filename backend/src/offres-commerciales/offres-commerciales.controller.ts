import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { OffresCommercialesService } from './offres-commerciales.service';
import { CreateOffreCommercialeDto } from './dto/create-offre-commerciale.dto';
import { UpdateOffreCommercialeDto } from './dto/update-offre-commerciale.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SkipLicence } from '../common/decorators/skip-licence.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('offres-commerciales')
export class OffresCommercialesController {
  constructor(private readonly service: OffresCommercialesService) {}

  // ─── Routes SUPERADMIN ─────────────────────────────────────────────────────

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Post()
  create(
    @Body() dto: CreateOffreCommercialeDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateOffreCommercialeDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Post(':id/envoyer')
  envoyer(@Param('id') id: string) {
    return this.service.envoyer(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @Get(':id/pdf')
  async pdf(@Param('id') id: string, @Res() res: Response) {
    const { buffer, numero } = await this.service.genererPdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="devis-${numero}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  // ─── Routes PUBLIQUES (par token, sans authentification) ───────────────────

  @SkipLicence()
  @Get('public/:token')
  findByToken(@Param('token') token: string) {
    return this.service.findByToken(token);
  }

  @SkipLicence()
  @Post('public/:token/accepter')
  accepter(@Param('token') token: string) {
    return this.service.accepterParToken(token);
  }
}
