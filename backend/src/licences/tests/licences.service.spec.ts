import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { LicencesService } from '../licences.service';
import { Licence, LicenceStatut } from '../entities/licence.entity';
import { OffresSaasService } from '../../offres-saas/offres-saas.service';
import { TenantsService } from '../../tenants/tenants.service';

const mockLicence = {
  id: 'lic-uuid-1',
  cle: 'SRX-AAAAA-BBBBB-CCCCC',
  tenantId: 'clinique-a',
  offreId: 'offre-starter',
  statut: LicenceStatut.ACTIVE,
  dateDebut: new Date('2026-01-01'),
  dateFin: new Date('2026-12-31'),
  maxUtilisateurs: 10,
};

const mockOffre = {
  id: 'offre-starter',
  nom: 'Starter',
  prix: 49000,
  maxUtilisateurs: 10,
  estActif: true,
};

describe('LicencesService', () => {
  let service: LicencesService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      find: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn().mockReturnValue(mockLicence),
      save: jest.fn().mockResolvedValue(mockLicence),
      update: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicencesService,
        { provide: getRepositoryToken(Licence), useValue: repo },
        {
          provide: OffresSaasService,
          useValue: { findOne: jest.fn().mockResolvedValue(mockOffre) },
        },
        {
          provide: TenantsService,
          useValue: { findOne: jest.fn().mockResolvedValue({ id: 'clinique-a', slug: 'clinique-a' }) },
        },
      ],
    }).compile();

    service = module.get<LicencesService>(LicencesService);
  });

  describe('findOne', () => {
    it('retourne la licence si elle existe', async () => {
      repo.findOne.mockResolvedValue(mockLicence);
      const result = await service.findOne('lic-uuid-1');
      expect(result.id).toBe('lic-uuid-1');
    });

    it('lève NotFoundException si la licence est introuvable', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('xxx')).rejects.toThrow(NotFoundException);
    });
  });

  describe('renouveler', () => {
    it('met à jour dateExpiration et statut à ACTIVE via save', async () => {
      const expiredLicence = { ...mockLicence, statut: LicenceStatut.EXPIREE, dateExpiration: new Date('2025-01-01'), dateDernierRenouvellement: null };
      repo.findOne.mockResolvedValue(expiredLicence);
      repo.save.mockResolvedValue({ ...expiredLicence, statut: LicenceStatut.ACTIVE });

      const result = await service.renouveler('lic-uuid-1', 12);

      expect(repo.save).toHaveBeenCalled();
      const saved = repo.save.mock.calls[0][0];
      expect(saved.statut).toBe(LicenceStatut.ACTIVE);
      expect(saved.dateExpiration.getTime()).toBeGreaterThan(new Date().getTime());
    });

    it('lève NotFoundException si licence introuvable', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.renouveler('xxx', 12)).rejects.toThrow(NotFoundException);
    });
  });

  describe('isolation tenant', () => {
    it('findAll utilise findAndCount sans filtre cross-tenant (le tenantId est dans le JWT)', async () => {
      repo.findAndCount.mockResolvedValue([[{ ...mockLicence }], 1]);
      const result = await service.findAll({ page: 1, limit: 10 } as any);
      expect((result as any).data).toHaveLength(1);
      expect(repo.findAndCount).toHaveBeenCalled();
    });
  });
});
