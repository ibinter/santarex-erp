import 'reflect-metadata';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from '../dto/create-user.dto';

/**
 * Le contrôleur impose l'établissement de l'administrateur connecté : le navigateur n'a pas à l'envoyer.
 * Avant ce test, la validation exigeait `tenantId` et la création d'un utilisateur échouait pour tout le monde.
 */
describe('CreateUserDto', () => {
  const base = { email: 'a@x.ci', password: 'Motdepasse1', firstName: 'Awa', lastName: 'Koné', role: 'medecin' };

  it('accepte une création sans tenantId (le serveur le détermine)', async () => {
    const erreurs = await validate(plainToInstance(CreateUserDto, base));
    expect(erreurs).toHaveLength(0);
  });

  it('accepte aussi un tenantId texte (il sera ignoré par le contrôleur)', async () => {
    const erreurs = await validate(plainToInstance(CreateUserDto, { ...base, tenantId: 'autre-clinique' }));
    expect(erreurs).toHaveLength(0);
  });

  it('refuse toujours un e-mail invalide ou un mot de passe trop court', async () => {
    const erreurs = await validate(plainToInstance(CreateUserDto, { ...base, email: 'pas-un-email', password: 'court' }));
    expect(erreurs.map((e) => e.property).sort()).toEqual(['email', 'password']);
  });
});
