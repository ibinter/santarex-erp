import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users.service';

async function build() {
  const user: any = { id: 'u1', password: await bcrypt.hash('Ancien123', 4) };
  const qb: any = { addSelect: () => qb, where: () => qb, getOne: async () => user };
  const userRepo: any = { createQueryBuilder: () => qb, save: jest.fn(async (u) => u) };
  const service = new UsersService(userRepo, {} as any, {} as any, { get: () => '4' } as any);
  return { service, user, userRepo };
}

describe('UsersService.changePassword', () => {
  it('refuse un mauvais mot de passe actuel', async () => {
    const { service, userRepo } = await build();
    await expect(service.changePassword('u1', 'Faux123', 'Nouveau123')).rejects.toThrow(BadRequestException);
    expect(userRepo.save).not.toHaveBeenCalled();
  });

  it('refuse un nouveau mot de passe identique à l’ancien', async () => {
    const { service } = await build();
    await expect(service.changePassword('u1', 'Ancien123', 'Ancien123')).rejects.toThrow(BadRequestException);
  });

  it('enregistre le nouveau mot de passe haché', async () => {
    const { service, user, userRepo } = await build();
    await service.changePassword('u1', 'Ancien123', 'Nouveau123');
    expect(userRepo.save).toHaveBeenCalled();
    expect(await bcrypt.compare('Nouveau123', user.password)).toBe(true);
  });
});
