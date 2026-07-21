import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from './entities/user.entity';
import { Tenant } from '../tenants/entities/tenant.entity';
import { MailService } from '../mail/mail.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  async findByEmail(email: string, tenantId: string): Promise<User | null> {
    return this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email AND user.tenantId = :tenantId', { email, tenantId })
      .getOne();
  }

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(
    dto: CreateUserDto,
    createur?: { nom?: string },
  ): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email, tenantId: dto.tenantId },
    });

    if (existing) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà dans cet établissement');
    }

    const hashedPassword = await this.hashPassword(dto.password);
    const user = this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });

    const saved = await this.userRepository.save(user);

    // Notification best-effort aux administrateurs du tenant (n'altère pas le flux).
    void this.notifierAdminsNouvelUtilisateur(saved, createur);

    return saved;
  }

  /**
   * Prévient les administrateurs du tenant qu'un nouveau compte a été créé.
   * Best-effort : toute erreur est avalée. Câble le template
   * `nouveau-utilisateur-admin` via MailService.
   */
  private async notifierAdminsNouvelUtilisateur(
    nouvel: User,
    createur?: { nom?: string },
  ): Promise<void> {
    try {
      const [admins, tenant] = await Promise.all([
        this.userRepository.find({
          where: {
            tenantId: nouvel.tenantId,
            role: In([UserRole.ADMIN, UserRole.DIRECTEUR]),
            isActive: true,
            id: Not(nouvel.id),
          },
        }),
        this.tenantRepository.findOne({ where: { slug: nouvel.tenantId } }),
      ]);
      if (admins.length === 0) return;

      const front = this.config
        .get<string>('FRONTEND_URL', 'https://santarex.ibigsoft.com')
        .replace(/\/$/, '');

      const commun = {
        nomEtablissement: tenant?.nom ?? nouvel.tenantId,
        nomUtilisateur: `${nouvel.firstName} ${nouvel.lastName}`,
        emailUtilisateur: nouvel.email,
        roleUtilisateur: nouvel.role,
        creePar: createur?.nom ?? 'Un administrateur',
        dateCreation: new Date(nouvel.createdAt ?? Date.now()).toLocaleDateString('fr-FR'),
        urlGestionUtilisateurs: `${front}/parametres/utilisateurs`,
      };

      for (const admin of admins) {
        await this.mailService.envoyerNouvelUtilisateurAdmin({
          to: admin.email,
          prenomAdmin: admin.firstName,
          ...commun,
        });
      }
    } catch (e) {
      this.logger.error(
        `Échec notification admins nouvel utilisateur ${nouvel.id}: ${(e as Error).message}`,
      );
    }
  }

  async updateRefreshToken(id: string, token: string | null): Promise<void> {
    let hashedToken: string | null = null;
    if (token) {
      hashedToken = await bcrypt.hash(token, 10);
    }
    await this.userRepository.update(id, { refreshToken: hashedToken });
  }

  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  async findAll(tenantId: string): Promise<User[]> {
    return this.userRepository.find({
      where: { tenantId },
      order: { lastName: 'ASC', firstName: 'ASC' },
    });
  }

  async updateUser(id: string, tenantId: string, dto: Partial<Pick<User, 'firstName' | 'lastName' | 'role'>>): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    Object.assign(user, dto);
    return this.userRepository.save(user);
  }

  async toggleActive(id: string, tenantId: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.isActive = !user.isActive;
    return this.userRepository.save(user);
  }

  async resetPassword(id: string, tenantId: string, newPassword: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id, tenantId } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    user.password = await this.hashPassword(newPassword);
    await this.userRepository.save(user);
    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}
