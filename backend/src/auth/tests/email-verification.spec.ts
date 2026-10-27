import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../auth.service';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'secret-de-test';

function creerService(user: any) {
  const usersService: any = { findById: jest.fn().mockResolvedValue(user) };
  const userRepository: any = { update: jest.fn() };
  const mail: any = { envoyerConfirmationEmail: jest.fn() };
  const jwt = new JwtService({ secret: 'secret-d-acces' });
  const config: any = { getOrThrow: () => 'secret-de-test', get: (_k: string, d: any) => d };
  const svc = new AuthService(usersService, jwt, config, {} as any, {} as any, mail, userRepository);
  return { svc, mail, userRepository, jwt };
}

const base = () => ({ id: 'u1', email: 'dr@clinique.ci', firstName: 'Awa', emailVerifiedAt: null });

/** Récupère le jeton envoyé dans le lien de l'e-mail. */
async function jetonEnvoye(svc: AuthService, mail: any, user: any): Promise<string> {
  await svc.envoyerConfirmationEmail(user);
  const url: string = mail.envoyerConfirmationEmail.mock.calls[0][0].urlConfirmation;
  return new URL(url).searchParams.get('token') as string;
}

describe('Confirmation de l’adresse e-mail', () => {
  it('le lien envoyé confirme l’adresse', async () => {
    const user = base();
    const { svc, mail, userRepository } = creerService(user);
    const token = await jetonEnvoye(svc, mail, user);
    await svc.verifierEmail(token);
    expect(userRepository.update).toHaveBeenCalledWith('u1', { emailVerifiedAt: expect.any(Date) });
  });

  it('un second clic réussit sans réécrire la date', async () => {
    const user = { ...base(), emailVerifiedAt: new Date() };
    const { svc, mail, userRepository } = creerService(user);
    const token = await jetonEnvoye(svc, mail, user);
    await expect(svc.verifierEmail(token)).resolves.toBeDefined();
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('un jeton falsifié est refusé', async () => {
    const { svc } = creerService(base());
    await expect(svc.verifierEmail('pas.un.jeton')).rejects.toThrow(BadRequestException);
  });

  it('un jeton signé avec une autre clé (ex. jeton d’accès) ne confirme rien', async () => {
    const { svc, userRepository } = creerService(base());
    const autre = await new JwtService({}).signAsync(
      { sub: 'u1', email: 'dr@clinique.ci', type: 'verify-email' },
      { secret: 'secret-de-test' }, // pas le secret dédié à la confirmation
    );
    await expect(svc.verifierEmail(autre)).rejects.toThrow(BadRequestException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('un lien lié à l’ancienne adresse ne vaut plus rien après un changement d’e-mail', async () => {
    const ancien = base();
    const { svc, mail } = creerService(ancien);
    const token = await jetonEnvoye(svc, mail, ancien);
    const { svc: apres, userRepository } = creerService({ ...base(), email: 'nouveau@clinique.ci' });
    await expect(apres.verifierEmail(token)).rejects.toThrow(BadRequestException);
    expect(userRepository.update).not.toHaveBeenCalled();
  });

  it('renvoyer : rien n’est envoyé si l’adresse est déjà confirmée', async () => {
    const { svc, mail } = creerService({ ...base(), emailVerifiedAt: new Date() });
    await svc.renvoyerConfirmation('u1');
    expect(mail.envoyerConfirmationEmail).not.toHaveBeenCalled();
  });
});
