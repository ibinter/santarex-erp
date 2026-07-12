import {
  Controller, Get, Post, Patch, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
@Controller('superadmin/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @ApiOperation({ summary: 'Créer un tenant' })
  create(@Body() dto: CreateTenantDto) {
    return this.tenantsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Lister tous les tenants' })
  findAll(@Query() pagination: PaginationDto) {
    return this.tenantsService.findAll(pagination);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Statistiques tenants' })
  stats() {
    return this.tenantsService.stats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un tenant par ID' })
  findOne(@Param('id') id: string) {
    return this.tenantsService.findOne(id);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Détail d\'un tenant par slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.tenantsService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un tenant' })
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantsService.update(id, dto);
  }

  @Patch(':id/suspendre')
  @ApiOperation({ summary: 'Suspendre un tenant' })
  suspendre(@Param('id') id: string) {
    return this.tenantsService.suspendre(id);
  }

  @Patch(':id/activer')
  @ApiOperation({ summary: 'Activer un tenant' })
  activer(@Param('id') id: string) {
    return this.tenantsService.activer(id);
  }
}
