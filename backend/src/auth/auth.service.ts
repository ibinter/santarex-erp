import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
  Optional,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { UsersService } from '../users/users.service';
import { TenantsService } from '../tenants/tenants.service';
import { TwoFactorService } from './twofactor.service';
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
    @Optional() private readonly twoFactor?: TwoFactorService,
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

    // Double authentification activee : pas de session tant que le code n est pas valide.
    if (user.twoFactorEnabled && this.twoFactor) {
      const challengeToken = await this.jwtService.signAsync(
        { sub: user.id, tenantId: user.tenantId, type: '2fa' },
        { secret: this.challengeSecret(), expiresIn: '5m' },
      );
      return { requires2fa: true as const, challengeToken };
    }

    return this.emettreSession(user);
  }

  /** Seconde etape de connexion : verifie le code (ou code de secours) puis ouvre la session. */
  async verifyTwoFactor(challengeToken: string, code: string) {
    let payload: { sub?: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(challengeToken, { secret: this.challengeSecret() });
    } catch {
      throw new UnauthorizedException('Verification expiree : reconnectez-vous.');
    }
    if (payload?.type !== '2fa' || !payload.sub || !this.twoFactor) {
      throw new UnauthorizedException('Verification invalide');
    }
    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.isActive) throw new UnauthorizedException('Compte indisponible');
    const ok = await this.twoFactor.verifierConnexion(user.id, code);
    if (!ok) throw new UnauthorizedException('Code incorrect');
    return this.emettreSession(user);
  }

  /** Cle distincte : un jeton de verification ne peut jamais servir de jeton d acces. */
  private challengeSecret(): string {
    return `${this.configService.getOrThrow<string>('JWT_SECRET')}:2fa`;
  }

  /** L etablissement exige-t-il la double authentification de ses administrateurs ? */
  private async doubleAuthExigee(user: User): Promise<boolean> {
    if (user.twoFactorEnabled) return false;
    // Démo publique : la connexion en un clic ne doit jamais renvoyer le visiteur vers la configuration de la 2FA.
    if (process.env.DEMO_MODE === 'true') return false;
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.DIRECTEUR) return false;
    try {
      const reglages = await this.tenantsService.getSettings(user.tenantId);
      return reglages.twoFaEnabled === true;
    } catch {
      return false;
    }
  }

  private async emettreSession(user: User) {
    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refresh_token);

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      // true : l etablissement l exige et ce compte ne l a pas encore activee.
      twoFactorSetupRequired: await this.doubleAuthExigee(user),
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
    // 0. E-mail normalisé (espaces, casse) : « Jean@X.com » et « jean@x.com » sont le même compte.
    const adminEmail = dto.adminEmail.trim().toLowerCase();
    dto.adminEmail = adminEmail;

    // 1. Refus précoce si l'email est déjà pris (contrainte unique globale sur `users.email`).
    const emailTaken = await this.userRepository
      .createQueryBuilder('u')
      .where('LOWER(u.email) = :email', { email: adminEmail })
      .getOne();
    if (emailTaken) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    // 2. Slug unique dérivé du nom de l'établissement.
    const slug = await this.generateUniqueSlug(dto.nomEtablissement);

    // 3. Création du tenant.
    await this.tenantsService.create({
      slug,
      nom: dto.nomEtablissement.trim(),
      email: adminEmail,
      telephone: dto.telephone,
      pays: dto.pays || 'CI',
    });

    // 4. Création du compte administrateur (le mot de passe est haché par UsersService).
    //    Si elle échoue (ex. deux inscriptions simultanées avec le même e-mail), on retire
    //    l'établissement créé à l'étape 3 : jamais d'établissement orphelin sans administrateur.
    let user: User;
    try {
      user = await this.usersService.create({
        email: adminEmail,
        password: dto.password,
        firstName: dto.adminPrenom.trim(),
        lastName: dto.adminNom.trim(),
        role: UserRole.ADMIN,
        tenantId: slug,
      });
    } catch (err: any) {
      await this.tenantsService.removeBySlug(slug).catch((e) =>
        this.logger.error(`Nettoyage de l'établissement "${slug}" impossible: ${e.message}`),
      );
      if (err?.code === '23505' || /duplicate key/i.test(err?.message ?? '')) {
        throw new ConflictException('Un compte avec cet email existe déjà');
      }
      throw err;
    }

    // 5. Attribution de la licence — non bloquant (le guard licence est fail-open).
    //    palier='gratuit' → espace Découverte direct (§3) ; sinon essai 30j.
    try {
      if (dto.palier === 'gratuit') {
        await this.licenceLifecycle.demarrerDecouverte(slug);
      } else {
        await this.licenceLifecycle.startTrial(slug, 'cabinet');
      }
    } catch (err) {
      this.logger.error(`Licence non attribuée pour "${slug}" (palier=${dto.palier ?? 'essai'}): ${err.message}`);
    }

    // 5bis + 6. Notification interne et e-mail de bienvenue — en arrière-plan : un serveur
    //    SMTP lent ou en panne ne doit jamais retarder ni faire échouer l'inscription.
    const gratuit = dto.palier === 'gratuit';
    void (async () => {
      try {
        await this.mailService.envoyerNotificationInscription({
          nomEtablissement: dto.nomEtablissement,
          nom: dto.adminNom,
          prenom: dto.adminPrenom,
          email: adminEmail,
          whatsapp: dto.telephone,
          telephone: dto.telephone,
          statut: gratuit ? 'Découverte (gratuit)' : 'Essai',
          offre: gratuit ? 'Découverte' : 'Cabinet (essai 30 jours)',
          dateInscription: new Date(),
          clientId: slug,
        });
      } catch (err: any) {
        this.logger.warn(`Notification d'inscription non envoyée pour "${slug}": ${err.message}`);
      }
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
      } catch (err: any) {
        this.logger.warn(`Email de bienvenue non envoyé à ${user.email}: ${err.message}`);
      }
    })();

    // 6bis. Lien de confirmation de l'adresse e-mail (en arrière-plan, non bloquant).
    void this.envoyerConfirmationEmail(user).catch((err: any) =>
      this.logger.warn(`Confirmation d'e-mail non envoyée à ${user.email}: ${err.message}`),
    );

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

  // ── Confirmation de l'adresse e-mail ───────────────────────────────────────
  // Non bloquante : le compte reste utilisable, un bandeau invite à confirmer.

  /** Clé distincte : un jeton de confirmation ne peut jamais servir de jeton d'accès. */
  private verifyEmailSecret(): string {
    return `${this.configService.getOrThrow<string>('JWT_SECRET')}:verify-email`;
  }

  async envoyerConfirmationEmail(user: Pick<User, 'id' | 'email' | 'firstName'>): Promise<void> {
    const token = await this.jwtService.signAsync(
      { sub: user.id, email: user.email, type: 'verify-email' },
      { secret: this.verifyEmailSecret(), expiresIn: '3d' },
    );
    await this.mailService.envoyerConfirmationEmail({
      to: user.email,
      prenom: user.firstName,
      urlConfirmation: `${this.frontendUrl}/confirmer-email?token=${token}`,
    });
  }

  /** Valide le lien reçu par e-mail. Idempotent : un second clic réussit aussi. */
  async verifierEmail(token: string): Promise<{ message: string }> {
    let payload: { sub?: string; email?: string; type?: string };
    try {
      payload = await this.jwtService.verifyAsync(token, { secret: this.verifyEmailSecret() });
    } catch {
      throw new BadRequestException('Lien de confirmation invalide ou expiré');
    }
    if (payload?.type !== 'verify-email' || !payload.sub) {
      throw new BadRequestException('Lien de confirmation invalide ou expiré');
    }
    const user = await this.usersService.findById(payload.sub);
    // Le lien est lié à l'adresse : si l'e-mail a changé depuis, il ne vaut plus rien.
    if (!user || user.email.toLowerCase() !== String(payload.email ?? '').toLowerCase()) {
      throw new BadRequestException('Lien de confirmation invalide ou expiré');
    }
    if (!user.emailVerifiedAt) {
      await this.userRepository.update(user.id, { emailVerifiedAt: new Date() });
    }
    return { message: 'Adresse e-mail confirmée' };
  }

  async statutEmail(userId: string): Promise<{ verified: boolean }> {
    const user = await this.usersService.findById(userId);
    return { verified: !!user?.emailVerifiedAt };
  }

  async renvoyerConfirmation(userId: string): Promise<{ message: string }> {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('Compte indisponible');
    if (user.emailVerifiedAt) return { message: 'Adresse e-mail déjà confirmée' };
    await this.envoyerConfirmationEmail(user);
    return { message: 'E-mail de confirmation envoyé' };
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

  async updateProfile(userId: string, tenantId: string, dto: { firstName?: string; lastName?: string }) {
    const patch: { firstName?: string; lastName?: string } = {};
    if (dto.firstName?.trim()) patch.firstName = dto.firstName.trim();
    if (dto.lastName?.trim()) patch.lastName = dto.lastName.trim();
    const u = await this.usersService.updateUser(userId, tenantId, patch);
    return { id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName, role: u.role };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    await this.usersService.changePassword(userId, currentPassword, newPassword);
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
