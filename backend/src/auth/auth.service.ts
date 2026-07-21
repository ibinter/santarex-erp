import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { LicenceLifecycleService } from '../payments/licence-lifecycle.service';
import { MailService } from '../mail/mail.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly frontendUrl: string;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private tenantsService: TenantsService,
    private licenceLifecycle: LicenceLifecycleService,
    private mailService: MailService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    this.frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'https://app.santarex.ci',
    );
  }

  async validateUser(email: string, password: string, tenantId: string): Promise<User> {
    const user = await this.usersService.findByEmail(email, tenantId);

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Compte désactivé. Contactez votre administrateur.');
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    return user;
  }

  async login(dto: LoginDto) {
    const user = await this.validateUser(dto.email, dto.password, dto.tenantId);

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Inscription self-service : crée un établissement (tenant), son compte admin,
   * démarre un essai gratuit (non bloquant), envoie l'email de bienvenue (non
   * bloquant) et retourne les tokens comme le fait `login`.
   */
  async register(dto: RegisterDto) {
    // 1. Refus précoce si l'email est déjà pris (contrainte unique globale sur `users.email`).
    const emailTaken = await this.userRepository.findOne({
      where: { email: dto.adminEmail },
    });
    if (emailTaken) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    // 2. Slug unique dérivé du nom de l'établissement.
    const slug = await this.generateUniqueSlug(dto.nomEtablissement);

    // 3. Création du tenant.
    await this.tenantsService.create({
      slug,
      nom: dto.nomEtablissement,
      email: dto.adminEmail,
      telephone: dto.telephone,
      pays: dto.pays || 'CI',
    });

    // 4. Création du compte administrateur (le mot de passe est haché par UsersService).
    const user = await this.usersService.create({
      email: dto.adminEmail,
      password: dto.password,
      firstName: dto.adminPrenom,
      lastName: dto.adminNom,
      role: UserRole.ADMIN,
      tenantId: slug,
    });

    // 5. Démarrage d'un essai gratuit — non bloquant (le guard licence est fail-open).
    try {
      await this.licenceLifecycle.startTrial(slug, 'cabinet');
    } catch (err) {
      this.logger.warn(`Essai gratuit non démarré pour "${slug}": ${err.message}`);
    }

    // 6. Email de bienvenue — non bloquant.
    try {
      await this.mailService.envoyerBienvenue({
        to: user.email,
        prenom: user.firstName,
        email: user.email,
        nomEtablissement: dto.nomEtablissement,
        tenantSlug: slug,
        role: user.role,
        urlConnexion: `${this.frontendUrl}/login`,
      });
    } catch (err) {
      this.logger.warn(`Email de bienvenue non envoyé à ${user.email}: ${err.message}`);
    }

    // 7. Tokens (comme login).
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        tenantId: user.tenantId,
      },
    };
  }

  /**
   * Mot de passe oublié : génère un token de réinitialisation, en stocke le hash
   * bcrypt + expiration, et envoie l'email. Retourne toujours une réponse
   * générique pour ne pas divulguer l'existence d'un compte.
   */
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const genericMessage = {
      message: 'Si un compte existe, un email de réinitialisation a été envoyé.',
    };

    const qb = this.userRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email: dto.email });
    if (dto.tenantId) {
      qb.andWhere('user.tenantId = :tenantId', { tenantId: dto.tenantId });
    }
    const user = await qb.getOne();

    if (!user || !user.isActive) {
      return genericMessage;
    }

    // Token en clair envoyé par email, hash bcrypt stocké en base.
    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = await bcrypt.hash(rawToken, 10);
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // +1h

    await this.userRepository.update(user.id, {
      resetToken: hashedToken,
      resetTokenExpiry: expiry,
    });

    const urlReset = `${this.frontendUrl}/reinitialiser-mot-de-passe?token=${rawToken}&uid=${user.id}`;

    try {
      await this.mailService.envoyerReinitialisationMdp({
        to: user.email,
        prenom: user.firstName,
        urlReset,
        dureeValidite: '1 heure',
      });
    } catch (err) {
      this.logger.warn(`Email de réinitialisation non envoyé à ${user.email}: ${err.message}`);
    }

    return genericMessage;
  }

  /**
   * Réinitialisation effective du mot de passe à partir du token reçu par email.
   */
  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.resetToken')
      .addSelect('user.resetTokenExpiry')
      .where('user.id = :id', { id: dto.uid })
      .getOne();

    if (
      !user ||
      !user.resetToken ||
      !user.resetTokenExpiry ||
      user.resetTokenExpiry.getTime() < Date.now()
    ) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }

    const tokenMatch = await bcrypt.compare(dto.token, user.resetToken);
    if (!tokenMatch) {
      throw new BadRequestException('Lien de réinitialisation invalide ou expiré');
    }

    const hashedPassword = await this.usersService.hashPassword(dto.password);
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
      refreshToken: null, // invalide les sessions existantes
    });

    return { message: 'Mot de passe réinitialisé avec succès. Vous pouvez vous connecter.' };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const user = await this.usersService.findById(userId);

    if (!user || !user.isActive) {
      throw new ForbiddenException('Accès refusé');
    }

    // Fetch user with refreshToken selected
    const userWithToken = await this.usersService['userRepository']
      ?.createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!userWithToken?.refreshToken) {
      throw new ForbiddenException('Session expirée, veuillez vous reconnecter');
    }

    const tokenMatch = await bcrypt.compare(refreshToken, userWithToken.refreshToken);
    if (!tokenMatch) {
      throw new ForbiddenException('Token de rafraîchissement invalide');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return tokens;
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.updateRefreshToken(userId, null);
  }

  /**
   * Génère un slug unique (minuscule, sans accents, alphanumérique + tirets)
   * à partir d'un libellé. Suffixe -2, -3… en cas de collision.
   */
  private async generateUniqueSlug(source: string): Promise<string> {
    const base =
      source
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '') // supprime les accents
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-') // non alphanumérique → tiret
        .replace(/^-+|-+$/g, '') // trim des tirets
        .replace(/-{2,}/g, '-') || 'etablissement';

    let candidate = base;
    let suffix = 1;
    while (await this.slugExists(candidate)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
      if (suffix > 100) {
        throw new ConflictException(
          'Impossible de générer un identifiant unique pour cet établissement',
        );
      }
    }
    return candidate;
  }

  private async slugExists(slug: string): Promise<boolean> {
    try {
      await this.tenantsService.findBySlug(slug);
      return true;
    } catch {
      return false;
    }
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('JWT_ACCESS_EXPIRY', '15m'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRY', '7d'),
      }),
    ]);

    return { access_token, refresh_token };
  }
}
