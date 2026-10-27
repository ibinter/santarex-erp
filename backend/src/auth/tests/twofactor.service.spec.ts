import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { TwoFactorService } from '../twofactor.service';
import { AuthService } from '../auth.service';
import { totp } from '../totp';
import { decrypt } from '../../payments/util/secret-crypto';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'secret-de-test';
jest.setTimeout(30000); // génération de QR codes + hachage : plus lent sur une machine chargée

/** Faux dépôt : un seul utilisateur en mémoire, avec la même API que TypeORM utilisée par le service. */
function depot(initial: any = {}) {
  const user: any = {
    id: 'u1', email: 'dr@clinique.ci', role: 'admin', isActive: true, tenantId: 'clinique-a',
    password: bcrypt.hashSync('Motdepasse1', 4),
    twoFactorEnabled: false, twoFactorSecret: null, twoFactorRecoveryCodes: null, twoFactorLastStep: null,
    ...initial,
  };
  const qb: any = { addSelect: () => qb, where: () => qb, getOne: async () => ({ ...user }) };
  const repo: any = {
    createQueryBuilder: () => qb,
    save: jest.fn(async (u: any) => { Object.assign(user, u); return user; }),
  };
  return { user, repo, service: new TwoFactorService(repo) };
}

async function activer(d: ReturnType<typeof depot>) {
  await d.service.setup('u1');
  const secret = decrypt(d.user.twoFactorSecret);
  const { recoveryCodes } = await d.service.enable('u1', totp(secret));
  return { secret, recoveryCodes };
}

describe('TwoFactorService', () => {
  it('le secret est stocké chiffré et le QR code est produit', async () => {
    const d = depot();
    const r = await d.service.setup('u1');
    expect(r.qrDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(r.otpauthUrl).toContain(r.secret);
    expect(d.user.twoFactorSecret).not.toContain(r.secret);
    expect(d.user.twoFactorEnabled).toBe(false);
  });

  it('refuse l’activation avec un mauvais code, l’accepte avec le bon et donne 8 codes de secours', async () => {
    const d = depot();
    await d.service.setup('u1');
    await expect(d.service.enable('u1', '000000')).rejects.toThrow(BadRequestException);
    expect(d.user.twoFactorEnabled).toBe(false);
    const { recoveryCodes } = await activer(depot());
    expect(recoveryCodes).toHaveLength(8);
  });

  it('les codes de secours ne sont jamais stockés en clair', async () => {
    const d = depot();
    const { recoveryCodes } = await activer(d);
    for (const c of recoveryCodes) {
      expect(d.user.twoFactorRecoveryCodes).not.toContain(c);
      expect(d.user.twoFactorRecoveryCodes).not.toContain(c.replace('-', ''));
    }
  });

  it('à la connexion : un code valable passe une fois, mais pas deux (anti-rejeu)', async () => {
    const d = depot();
    const { secret } = await activer(d);
    // le pas de l'activation est déjà consommé : on prend le pas suivant (+30 s)
    const suivant = totp(secret, Date.now() + 30_000);
    jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 30_000);
    expect(await d.service.verifierConnexion('u1', suivant)).toBe(true);
    expect(await d.service.verifierConnexion('u1', suivant)).toBe(false);
    jest.restoreAllMocks();
  });

  it('un mauvais code est refusé', async () => {
    const d = depot();
    await activer(d);
    expect(await d.service.verifierConnexion('u1', '123456')).toBe(false);
  });

  it('un code de secours fonctionne une seule fois', async () => {
    const d = depot();
    const { recoveryCodes } = await activer(d);
    expect(await d.service.verifierConnexion('u1', recoveryCodes[0])).toBe(true);
    expect(await d.service.verifierConnexion('u1', recoveryCodes[0])).toBe(false);
    expect((await d.service.status('u1')).recoveryCodesLeft).toBe(7);
  });

  it('désactiver exige le mot de passe ET un code valable', async () => {
    const d = depot();
    const { recoveryCodes } = await activer(d);
    await expect(d.service.disable('u1', 'faux', recoveryCodes[0])).rejects.toThrow(BadRequestException);
    await expect(d.service.disable('u1', 'Motdepasse1', '000000')).rejects.toThrow(BadRequestException);
    expect(d.user.twoFactorEnabled).toBe(true);
    await d.service.disable('u1', 'Motdepasse1', recoveryCodes[1]);
    expect(d.user.twoFactorEnabled).toBe(false);
    expect(d.user.twoFactorSecret).toBeNull();
  });
});

describe('AuthService — connexion en deux étapes', () => {
  function authAvec(user: any, twoFactor: any, reglages: any = { twoFaEnabled: false }) {
    const usersService: any = {
      findByEmail: jest.fn().mockResolvedValue(user),
      findById: jest.fn().mockResolvedValue(user),
      updateRefreshToken: jest.fn(),
    };
    const jwt = new JwtService({ secret: 'secret-d-acces' });
    const config: any = { getOrThrow: () => 'secret-de-test', get: (_k: string, d: any) => d };
    const tenants: any = { getSettings: jest.fn().mockResolvedValue(reglages) };
    return new AuthService(usersService, jwt, config, tenants, {} as any, {} as any, {} as any, twoFactor);
  }
  const base = () => ({
    id: 'u1', email: 'a@x.ci', firstName: 'A', lastName: 'B', role: 'medecin', tenantId: 't', isActive: true,
    password: bcrypt.hashSync('Motdepasse1', 4), twoFactorEnabled: false,
  });

  it('sans double authentification : session ouverte comme avant', async () => {
    const svc = authAvec(base(), {});
    const r: any = await svc.login({ email: 'a@x.ci', password: 'Motdepasse1', tenantId: 't' } as any);
    expect(r.access_token).toBeDefined();
    expect(r.requires2fa).toBeUndefined();
  });

  it('avec double authentification : aucun jeton de session, seulement un jeton de vérification', async () => {
    const svc = authAvec({ ...base(), twoFactorEnabled: true }, { verifierConnexion: jest.fn() });
    const r: any = await svc.login({ email: 'a@x.ci', password: 'Motdepasse1', tenantId: 't' } as any);
    expect(r.requires2fa).toBe(true);
    expect(r.challengeToken).toBeDefined();
    expect(r.access_token).toBeUndefined();
    expect(r.refresh_token).toBeUndefined();
  });

  it('le bon code ouvre la session, un mauvais code la refuse', async () => {
    const verifier = jest.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true);
    const svc = authAvec({ ...base(), twoFactorEnabled: true }, { verifierConnexion: verifier });
    const { challengeToken }: any = await svc.login({ email: 'a@x.ci', password: 'Motdepasse1', tenantId: 't' } as any);
    await expect(svc.verifyTwoFactor(challengeToken, '000000')).rejects.toThrow(UnauthorizedException);
    const ok: any = await svc.verifyTwoFactor(challengeToken, '123456');
    expect(ok.access_token).toBeDefined();
  });

  it('un jeton de vérification falsifié ou un jeton d’accès est refusé', async () => {
    const svc = authAvec({ ...base(), twoFactorEnabled: true }, { verifierConnexion: jest.fn().mockResolvedValue(true) });
    await expect(svc.verifyTwoFactor('pas.un.jeton', '123456')).rejects.toThrow(UnauthorizedException);
    const jetonAcces = await new JwtService({ secret: 'secret-de-test' }).signAsync({ sub: 'u1', type: '2fa' });
    await expect(svc.verifyTwoFactor(jetonAcces, '123456')).rejects.toThrow(UnauthorizedException);
  });

  it('l’établissement qui l’exige : un administrateur sans 2FA est invité à l’activer (sans être bloqué)', async () => {
    const svc = authAvec({ ...base(), role: 'admin' }, {}, { twoFaEnabled: true });
    const r: any = await svc.login({ email: 'a@x.ci', password: 'Motdepasse1', tenantId: 't' } as any);
    expect(r.access_token).toBeDefined();
    expect(r.twoFactorSetupRequired).toBe(true);
    const medecin = authAvec(base(), {}, { twoFaEnabled: true });
    const m: any = await medecin.login({ email: 'a@x.ci', password: 'Motdepasse1', tenantId: 't' } as any);
    expect(m.twoFactorSetupRequired).toBe(false);
  });
});
