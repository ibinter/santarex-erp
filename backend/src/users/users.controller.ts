import {
  Controller, Get, Post, Patch, Body, Param, Request,
  UseGuards, BadRequestException, ForbiddenException, Query,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
import { LicencesService } from '../licences/licences.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entities/user.entity';
import { IsString, IsNotEmpty, IsEnum, IsOptional, MinLength } from 'class-validator';

class UpdateUserDto {
  @IsString() @IsOptional() firstName?: string;
  @IsString() @IsOptional() lastName?: string;
  @IsEnum(UserRole) @IsOptional() role?: UserRole;
}

class ChangePasswordDto {
  @IsString() @IsNotEmpty() @MinLength(8) newPassword: string;
}

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly licencesService: LicencesService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Utilisateurs du tenant (filtres role, q, limit)',
    description:
      "Administrateurs : comptes complets. Autres rôles : annuaire réduit (id, nom, prénom, rôle) "
      + 'des comptes actifs — nécessaire aux sélecteurs de médecin des formulaires cliniques.',
  })
  async findAll(
    @Request() req,
    @Query('role') role?: string,
    @Query('q') q?: string,
    @Query('limit') limit?: string,
  ) {
    const estAdmin = req.user.role === UserRole.ADMIN || req.user.role === UserRole.SUPERADMIN;
    const roleFiltre = Object.values(UserRole).includes(role as UserRole) ? (role as UserRole) : undefined;
    const users = await this.usersService.search(req.user.tenantId, {
      role: roleFiltre,
      q,
      limit: limit ? Number(limit) : undefined,
      // Un annuaire ou une recherche ne propose que des comptes actifs ; la gestion
      // complète (administrateur, sans filtre) garde la liste de tous les comptes.
      actifsSeulement: !estAdmin || !!roleFiltre || !!q,
    });
    // `prenom` / `nom` : alias lus par les formulaires du frontend.
    if (estAdmin) {
      return users.map((u) => Object.assign(u, { prenom: u.firstName, nom: u.lastName }));
    }
    return users.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      prenom: u.firstName,
      nom: u.lastName,
      role: u.role,
    }));
  }

  @Post(':id/2fa/reset')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Retirer la double authentification d un utilisateur (telephone perdu)' })
  async resetTwoFactor(@Request() req, @Param('id') id: string) {
    await this.usersService.resetTwoFactor(id, req.user.tenantId);
    return { message: 'Double authentification reinitialisee' };
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer un utilisateur' })
  async create(@Request() req, @Body() dto: CreateUserDto) {
    // Anti-fuite de licence : on applique le plafond `maxUtilisateurs` de la
    // licence du tenant (le superadmin plateforme est exempté). Empêche un
    // établissement de créer plus d'utilisateurs qu'il n'en a payé.
    if (req.user.role !== UserRole.SUPERADMIN) {
      const quota = await this.licencesService.verifierQuotaUtilisateurs(req.user.tenantId);
      if (!quota.autorise) {
        throw new ForbiddenException(
          quota.message ||
            `Plafond d'utilisateurs atteint (${quota.actuel}/${quota.max}). Mettez à niveau votre licence pour ajouter des utilisateurs.`,
        );
      }
    }
    // Force tenant isolation
    return this.usersService.create(
      { ...dto, tenantId: req.user.tenantId },
      { nom: req.user.email ?? 'Un administrateur' },
    );
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Modifier un utilisateur' })
  async update(@Request() req, @Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, req.user.tenantId, dto);
  }

  @Patch(':id/toggle-active')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Activer / désactiver un utilisateur' })
  async toggleActive(@Request() req, @Param('id') id: string) {
    return this.usersService.toggleActive(id, req.user.tenantId);
  }

  @Patch(':id/reset-password')
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Réinitialiser le mot de passe' })
  async resetPassword(@Request() req, @Param('id') id: string, @Body() dto: ChangePasswordDto) {
    return this.usersService.resetPassword(id, req.user.tenantId, dto.newPassword);
  }
}
