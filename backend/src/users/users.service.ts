import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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

  async create(dto: CreateUserDto): Promise<User> {
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

    return this.userRepository.save(user);
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
