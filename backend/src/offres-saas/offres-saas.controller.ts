import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { OffresSaasService } from './offres-saas.service';
import { CreateOffreSaasDto } from './dto/create-offre-saas.dto';
import { UpdateOffreSaasDto } from './dto/update-offre-saas.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Offres SaaS')
@Controller('offres-saas')
export class OffresSaasController {
  constructor(private readonly offresSaasService: OffresSaasService) {}

  @Get('public')
  @ApiOperation({ summary: 'Lister les offres publiques (page de vente)' })
  findPublic() {
    return this.offresSaasService.findAll(true);
  }

  @Get()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Lister toutes les offres (admin)' })
  findAll() {
    return this.offresSaasService.findAll(false);
  }

  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Détail d\'une offre' })
  findOne(@Param('id') id: string) {
    return this.offresSaasService.findOne(id);
  }

  @Post()
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer une offre' })
  create(@Body() dto: CreateOffreSaasDto) {
    return this.offresSaasService.create(dto);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Modifier une offre' })
  update(@Param('id') id: string, @Body() dto: UpdateOffreSaasDto) {
    return this.offresSaasService.update(id, dto);
  }

  @Patch(':id/desactiver')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Désactiver une offre' })
  desactiver(@Param('id') id: string) {
    return this.offresSaasService.desactiver(id);
  }
}
