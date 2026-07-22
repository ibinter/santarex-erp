import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PatientsService } from '../patients.service';
import { Patient, PatientStatut } from '../entities/patient.entity';

const TENANT = 'clinique-a';

const mockPatient = {
  id: 'pat-uuid-1',
  ipp: '2026-00001',
  nom: 'Kouassi',
  prenom: 'Ama',
  tenantId: TENANT,
  statut: PatientStatut.ACTIF,
};

/**
 * Fabrique un QueryBuilder chaînable dont les terminateurs renvoient `result`.
 */
function makeQb(result: any) {
  const qb: any = {};
  for (const m of ['where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take', 'select']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(result?.getOne ?? null);
  qb.getMany = jest.fn().mockResolvedValue(result?.getMany ?? []);
  qb.getManyAndCount = jest.fn().mockResolvedValue(result?.getManyAndCount ?? [[], 0]);
  qb.getCount = jest.fn().mockResolvedValue(result?.getCount ?? 0);
  return qb;
}

describe('PatientsService', () => {
  let service: PatientsService;
  let repo: Record<string, jest.Mock>;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'pat-uuid-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb({ getOne: null })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PatientsService,
        { provide: getRepositoryToken(Patient), useValue: repo },
      ],
    }).compile();

    service = module.get<PatientsService>(PatientsService);
  });

  describe('create', () => {
    it('crée le patient avec le tenantId et le userId corrects (scoping tenant)', async () => {
      const dto: any = { nom: 'Kouassi', prenom: 'Ama', sexe: 'F' };
      const result = await service.create(dto, TENANT, 'user-1');

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, createdById: 'user-1', nom: 'Kouassi' }),
      );
      expect(repo.save).toHaveBeenCalled();
      expect(result.tenantId).toBe(TENANT);
    });

    it('génère un IPP scopé au tenant (le QueryBuilder filtre sur tenantId)', async () => {
      const qb = makeQb({ getOne: null });
      repo.createQueryBuilder.mockReturnValue(qb);

      await service.create({ nom: 'X', prenom: 'Y' } as any, TENANT, 'user-1');

      expect(qb.where).toHaveBeenCalledWith('patient.tenantId = :tenantId', { tenantId: TENANT });
    });
  });

  describe('findAll', () => {
    it('filtre par tenantId et statut ACTIF', async () => {
      repo.findAndCount.mockResolvedValue([[mockPatient], 1]);
      const result = await service.findAll(TENANT, { page: 1, limit: 20 } as any);

      expect(repo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: TENANT, statut: PatientStatut.ACTIF },
        }),
      );
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('retourne le patient scopé au tenant', async () => {
      repo.findOne.mockResolvedValue(mockPatient);
      const result = await service.findOne('pat-uuid-1', TENANT);

      expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 'pat-uuid-1', tenantId: TENANT } });
      expect(result.id).toBe('pat-uuid-1');
    });

    it('lève NotFoundException si le patient est introuvable (ou hors tenant)', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.findOne('xxx', TENANT)).rejects.toThrow(NotFoundException);
    });
  });
});
