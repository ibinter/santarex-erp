import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';
import { Request } from 'express';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  @Post('login')
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Connexion utilisateur', description: 'Authentifie un utilisateur et retourne les tokens JWT' })
  @ApiResponse({ status: 200, description: 'Connexion réussie' })
  @ApiResponse({ status: 401, description: 'Identifiants invalides' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    try {
      const result = await this.authService.login(loginDto);
      this.auditLogsService.log({
        action: AuditAction.LOGIN,
        ressource: 'auth',
        userId: result.user.id,
        userEmail: result.user.email,
        userRole: result.user.role,
        tenantId: loginDto.tenantId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return result;
    } catch (err) {
      this.auditLogsService.log({
        action: AuditAction.LOGIN_FAILED,
        ressource: 'auth',
        userEmail: loginDto.email,
        tenantId: loginDto.tenantId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        contexte: { reason: err.message },
      });
      throw err;
    }
  }

  @Post('register')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Inscription self-service',
    description:
      'Crée un établissement, son compte administrateur, démarre un essai gratuit et retourne les tokens JWT',
  })
  @ApiResponse({ status: 201, description: 'Inscription réussie' })
  @ApiResponse({ status: 409, description: 'Email ou établissement déjà existant' })
  async register(@Body() registerDto: RegisterDto, @Req() req: Request) {
    const result = await this.authService.register(registerDto);
    this.auditLogsService.log({
      action: AuditAction.CREATE,
      ressource: 'auth',
      userId: result.user.id,
      userEmail: result.user.email,
      userRole: result.user.role,
      tenantId: result.user.tenantId,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      contexte: { operation: 'register' },
    });
    return result;
  }

  @Post('forgot-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mot de passe oublié',
    description:
      'Envoie un email de réinitialisation si un compte correspond. Réponse toujours générique.',
  })
  @ApiResponse({ status: 200, description: 'Réponse générique (compte non divulgué)' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('reset-password')
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Réinitialisation du mot de passe',
    description: 'Définit un nouveau mot de passe à partir du token reçu par email',
  })
  @ApiResponse({ status: 200, description: 'Mot de passe réinitialisé' })
  @ApiResponse({ status: 400, description: 'Lien invalide ou expiré' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rafraîchir les tokens', description: 'Génère un nouveau pair de tokens à partir du refresh token' })
  @ApiResponse({ status: 200, description: 'Tokens renouvelés' })
  @ApiResponse({ status: 403, description: 'Token de rafraîchissement invalide ou expiré' })
  async refresh(@Body() dto: RefreshTokenDto) {
    // Decode the refresh token to get userId
    const decoded = JSON.parse(
      Buffer.from(dto.refreshToken.split('.')[1], 'base64').toString(),
    );
    return this.authService.refreshTokens(decoded.sub, dto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Déconnexion', description: 'Invalide le refresh token de l\'utilisateur courant' })
  @ApiResponse({ status: 200, description: 'Déconnexion réussie' })
  async logout(@CurrentUser('userId') userId: string) {
    await this.authService.logout(userId);
    return { message: 'Déconnexion réussie' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Profil utilisateur courant', description: 'Retourne les informations de l\'utilisateur authentifié' })
  @ApiResponse({ status: 200, description: 'Profil utilisateur' })
  @ApiResponse({ status: 401, description: 'Non authentifié' })
  async getMe(@CurrentUser() user: any) {
    return user;
  }
}
