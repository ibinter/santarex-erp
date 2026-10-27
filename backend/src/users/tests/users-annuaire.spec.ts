import { UsersController } from '../users.controller';
import { UserRole } from '../entities/user.entity';

const dr = { id: 'u1', firstName: 'Amara', lastName: 'Diallo', role: UserRole.MEDECIN, email: 'a@x.ci', isActive: true };

function build() {
  const usersService: any = { search: jest.fn().mockResolvedValue([{ ...dr }]) };
  const controller = new UsersController(usersService, {} as any);
  return { controller, usersService };
}

describe('GET /users (annuaire)', () => {
  it('médecin connecté : annuaire réduit, sans e-mail, avec alias prenom/nom', async () => {
    const { controller, usersService } = build();
    const res: any[] = await controller.findAll({ user: { role: UserRole.MEDECIN, tenantId: 't1' } }, 'medecin', 'am', '8');
    expect(res[0]).toEqual({ id: 'u1', firstName: 'Amara', lastName: 'Diallo', prenom: 'Amara', nom: 'Diallo', role: 'medecin' });
    expect(res[0].email).toBeUndefined();
    expect(usersService.search).toHaveBeenCalledWith('t1', { role: 'medecin', q: 'am', limit: 8, actifsSeulement: true });
  });

  it('administrateur : comptes complets + alias, tous les comptes sans filtre', async () => {
    const { controller, usersService } = build();
    const res: any[] = await controller.findAll({ user: { role: UserRole.ADMIN, tenantId: 't1' } });
    expect(res[0].email).toBe('a@x.ci');
    expect(res[0].prenom).toBe('Amara');
    expect(usersService.search).toHaveBeenCalledWith('t1', { role: undefined, q: undefined, limit: undefined, actifsSeulement: false });
  });

  it('ignore un rôle inconnu au lieu de planter', async () => {
    const { controller, usersService } = build();
    await controller.findAll({ user: { role: UserRole.ADMIN, tenantId: 't1' } }, 'hacker');
    expect(usersService.search).toHaveBeenCalledWith('t1', expect.objectContaining({ role: undefined }));
  });
});
