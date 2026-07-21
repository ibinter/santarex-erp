import {
  Controller, Get, Post, Patch, Body, Param, Request,
  UseGuards, BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsersService } from './users.service';
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
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Liste des utilisateurs du tenant' })
  findAll(@Request() req) {
    return this.usersService.findAll(req.user.tenantId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
  @ApiOperation({ summary: 'Créer un utilisateur' })
  create(@Request() req, @Body() dto: CreateUserDto) {
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
