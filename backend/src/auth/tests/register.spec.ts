import { ConflictException } from '@nestjs/common';
import { AuthService } from '../auth.service';

function build(opts: { emailTaken?: boolean; userCreate?: jest.Mock } = {}) {
  const qb: any = { where: () => qb, getOne: async () => (opts.emailTaken ? { id: 'x' } : null) };
  const usersService: any = {
    create: opts.userCreate ?? jest.fn(async (d: any) => ({ id: 'u1', role: 'admin', ...d })),
    updateRefreshToken: jest.fn(),
  };
  const tenantsService: any = {
    create: jest.fn(),
    findBySlug: jest.fn().mockRejectedValue(new Error('absent')),
    removeBySlug: jest.fn().mockResolvedValue(undefined),
  };
  const licence: any = { startTrial: jest.fn(), demarrerDecouverte: jest.fn() };
  const mail: any = {
    envoyerNotificationInscription: jest.fn().mockResolvedValue(undefined),
    envoyerBienvenue: jest.fn().mockResolvedValue(undefined),
  };
  const jwt: any = { signAsync: jest.fn().mockResolvedValue('tok') };
  const config: any = { getOrThrow: () => 's', get: () => '15m' };
  const userRepo: any = { createQueryBuilder: () => qb };
  const service = new AuthService(usersService, jwt, config, tenantsService, licence, mail, userRepo);
  return { service, usersService, tenantsService, licence };
}

const dto = (over: any = {}) => ({
  nomEtablissement: 'Clinique Test',
  adminNom: 'Kouassi',
  adminPrenom: 'Jean',
  adminEmail: '  Jean@Clinique.CI ',
  password: 'Motdepasse1',
  ...over,
});

describe('AuthService.register', () => {
  it('normalise l’e-mail (espaces, casse) avant création', async () => {
    const { service, usersService, tenantsService } = build();
    await service.register(dto() as any);
    expect(usersService.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'jean@clinique.ci' }));
    expect(tenantsService.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'jean@clinique.ci' }));
  });

  it('refuse un e-mail déjà utilisé sans créer d’établissement', async () => {
    const { service, tenantsService } = build({ emailTaken: true });
    await expect(service.register(dto() as any)).rejects.toThrow(ConflictException);
    expect(tenantsService.create).not.toHaveBeenCalled();
  });

  it('supprime l’établissement si la création de l’administrateur échoue', async () => {
    const userCreate = jest.fn().mockRejectedValue(Object.assign(new Error('duplicate key'), { code: '23505' }));
    const { service, tenantsService } = build({ userCreate });
    await expect(service.register(dto() as any)).rejects.toThrow(ConflictException);
    expect(tenantsService.removeBySlug).toHaveBeenCalledWith('clinique-test');
  });

  it('démarre l’essai de 30 jours par défaut, Découverte si palier gratuit', async () => {
    const a = build();
    await a.service.register(dto() as any);
    expect(a.licence.startTrial).toHaveBeenCalledWith('clinique-test', 'cabinet');
    const b = build();
    await b.service.register(dto({ palier: 'gratuit' }) as any);
    expect(b.licence.demarrerDecouverte).toHaveBeenCalledWith('clinique-test');
  });

  it('réussit même si la licence échoue (inscription non bloquée)', async () => {
    const a = build();
    a.licence.startTrial.mockRejectedValue(new Error('boom'));
    const res: any = await a.service.register(dto() as any);
    expect(res.access_token).toBe('tok');
  });
});
