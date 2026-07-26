import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ChangelogService } from './changelog.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

/**
 * Changelog produit + version courante.
 * Lecture : tout utilisateur authentifié. Écriture : SUPERADMIN / ADMIN.
 */
@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ChangelogController {
  constructor(private readonly changelogService: ChangelogService) {}

  // Version courante de l'app (constante serveur).
  @Get('version')
  getVersion() {
    return this.changelogService.getVersionCourante();
  }

  // Historique public : versions publiées.
  @Get('changelog')
  findPubliees() {
    return this.changelogService.findPubliees();
  }

  // Dernière version publiée (bannière « Quoi de neuf »).
  @Get('changelog/derniere')
  findDerniere() {
    return this.changelogService.findDerniere();
  }

  // ── Administration (SUPERADMIN / ADMIN) ────────────────────────────────
  @Get('changelog/admin/all')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findAll() {
    return this.changelogService.findAll();
  }

  @Get('changelog/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  findOne(@Param('id') id: string) {
    return this.changelogService.findOne(id);
  }

  @Post('changelog')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  create(@Body() dto: CreateVersionDto) {
    return this.changelogService.create(dto);
  }

  @Put('changelog/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateVersionDto) {
    return this.changelogService.update(id, dto);
  }

  @Delete('changelog/:id')
  @Roles(UserRole.SUPERADMIN, UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.changelogService.remove(id);
  }
}
