import { Body, Controller, Get, Patch, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  IsBoolean, IsEmail, IsInt, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TenantsService } from './tenants.service';

export class UpdateSettingsDto {
  @IsOptional() @IsString() @MaxLength(150) nomEtablissement?: string;
  @IsOptional() @IsString() @MaxLength(100) ville?: string;
  @IsOptional() @IsString() @MaxLength(100) pays?: string;
  @IsOptional() @IsString() @MaxLength(40) telephone?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsBoolean() twoFaEnabled?: boolean;
  @IsOptional() @IsInt() @Min(5) @Max(1440) sessionTimeoutMinutes?: number;
  @IsOptional() @IsBoolean() notifStock?: boolean;
  @IsOptional() @IsBoolean() notifRdv?: boolean;
  @IsOptional() @IsBoolean() notifLabo?: boolean;
  @IsOptional() @IsBoolean() notifFacture?: boolean;
}

@ApiTags('Paramètres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: "Paramètres de l'établissement courant" })
  get(@Request() req) {
    return this.tenantsService.getSettings(req.user.tenantId);
  }

  @Patch()
  @Roles(UserRole.ADMIN, UserRole.DIRECTEUR, UserRole.SUPERADMIN)
  @ApiOperation({ summary: "Modifier les paramètres de l'établissement (administrateur)" })
  update(@Request() req, @Body() dto: UpdateSettingsDto) {
    return this.tenantsService.updateSettings(req.user.tenantId, dto);
  }
}
