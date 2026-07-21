import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LicencesService } from './licences.service';
import { CreateLicenceDto } from './dto/create-licence.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Licences')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('superadmin/licences')
export class LicencesController {
  constructor(private readonly licencesService: LicencesService) {}

  @Post()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer une licence pour un tenant' })
  creer(@Body() dto: CreateLicenceDto, @CurrentUser('userId') userId: string) {
    return this.licencesService.creer(dto, userId);
  }

  @Get()
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Lister toutes les licences' })
  findAll(@Query() pagination: PaginationDto) {
    return this.licencesService.findAll(pagination);
  }

  @Get('stats')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Statistiques licences' })
  stats() {
    return this.licencesService.stats();
  }

  @Get('tenant/:slug')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Licences d\'un tenant' })
  findByTenant(@Param('slug') slug: string) {
    return this.licencesService.findByTenant(slug);
  }

  @Get('tenant/:slug/verifier')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN, UserRole.DIRECTEUR)
  @ApiOperation({ summary: 'Vérifier la licence active d\'un tenant' })
  verifier(@Param('slug') slug: string) {
    return this.licencesService.verifier(slug);
  }

  @Get(':id')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Détail d\'une licence' })
  findOne(@Param('id') id: string) {
    return this.licencesService.findOne(id);
  }

  @Patch(':id/suspendre')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Suspendre une licence' })
  suspendre(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.licencesService.suspendre(id, userId);
  }

  @Patch(':id/renouveler')
  @Roles(UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Renouveler une licence (1 mois par défaut)' })
  renouveler(
    @Param('id') id: string,
    @Query('mois') mois: number,
    @CurrentUser('userId') userId: string,
  ) {
    return this.licencesService.renouveler(id, mois || 1, userId);
  }
}
