import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import { UsersService } from '../../users/users.service';
import * as bcrypt from 'bcryptjs';

const mockUser = {
  id: 'user-uuid-1',
  email: 'dr.test@clinique.ci',
  password: '',
  firstName: 'Test',
  lastName: 'User',
  role: 'medecin',
  tenantId: 'clinique-test',
  isActive: true,
  refreshToken: null,
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Partial<UsersService>>;

  beforeAll(async () => {
    mockUser.password = await bcrypt.hash('Password123!', 10);
  });

  beforeEach(async () => {
    usersService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      updateRefreshToken: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('mock-token'),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockReturnValue('test-secret'),
            get: jest.fn().mockReturnValue('15m'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('retourne le user si les credentials sont corrects', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      const result = await service.validateUser('dr.test@clinique.ci', 'Password123!', 'clinique-test');
      expect(result.email).toBe('dr.test@clinique.ci');
    });

    it('lève UnauthorizedException si le user est introuvable', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      await expect(service.validateUser('inconnu@clinique.ci', 'pass', 'clinique-test'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le mot de passe est incorrect', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      await expect(service.validateUser('dr.test@clinique.ci', 'mauvais-mdp', 'clinique-test'))
        .rejects.toThrow(UnauthorizedException);
    });

    it('lève UnauthorizedException si le compte est désactivé', async () => {
      usersService.findByEmail.mockResolvedValue({ ...mockUser, isActive: false } as any);
      await expect(service.validateUser('dr.test@clinique.ci', 'Password123!', 'clinique-test'))
        .rejects.toThrow(UnauthorizedException);
    });
  });

  describe('login', () => {
    it('retourne access_token, refresh_token et user', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      usersService.updateRefreshToken.mockResolvedValue(undefined);

      const result = await service.login({
        email: 'dr.test@clinique.ci',
        password: 'Password123!',
        tenantId: 'clinique-test',
      });

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result.user.email).toBe('dr.test@clinique.ci');
      expect(result.user).not.toHaveProperty('password');
    });
  });
});
