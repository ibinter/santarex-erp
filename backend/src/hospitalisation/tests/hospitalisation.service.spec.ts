import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { HospitalisationService } from '../hospitalisation.service';
import { Lit, ServiceHospitalisation, StatutLit } from '../entities/lit.entity';
import { Sejour } from '../entities/sejour.entity';
import { NoteEvolution } from '../entities/note-evolution.entity';
import { SoinInfirmier } from '../entities/soin-infirmier.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

const TENANT = 'clinique-a';

function makeQb(overrides: any = {}) {
  const qb: any = {};
  for (const m of ['where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? []);
  qb.getManyAndCount = jest.fn().mockResolvedValue(overrides.getManyAndCount ?? [[], 0]);
  qb.getCount = jest.fn().mockResolvedValue(overrides.getCount ?? 0);
  return qb;
}

describe('HospitalisationService', () => {
  let service: HospitalisationService;
  let litRepo: Record<string, jest.Mock>;
  let sejourRepo: Record<string, jest.Mock>;
  let noteRepo: Record<string, jest.Mock>;
  let soinRepo: Record<string, jest.Mock>;
  let patientRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    litRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'lit-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    sejourRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'sej-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    noteRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'note-1', ...v })),
    };
    soinRepo = {};
    patientRepo = { find: jest.fn().mockResolvedValue([]) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HospitalisationService,
        { provide: getRepositoryToken(Lit), useValue: litRepo },
        { provide: getRepositoryToken(Sejour), useValue: sejourRepo },
        { provide: getRepositoryToken(NoteEvolution), useValue: noteRepo },
        { provide: getRepositoryToken(SoinInfirmier), useValue: soinRepo },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<HospitalisationService>(HospitalisationService);
  });

  describe('createLit', () => {
    it('crée un lit avec le tenantId (scoping tenant)', async () => {
      litRepo.findOne.mockResolvedValue(null); // pas de doublon
      const dto: any = { numero: 'CH-101', service: ServiceHospitalisation.MEDECINE_GENERALE };
      const result = await service.createLit(dto, TENANT);

      expect(litRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, numero: 'CH-101' }),
      );
      // La vérification de doublon est elle-même scopée au tenant
      expect(litRepo.findOne).toHaveBeenCalledWith({
        where: { numero: 'CH-101', tenantId: TENANT },
      });
      expect(result.tenantId).toBe(TENANT);
    });

    it('lève BadRequestException si un lit avec le même numéro existe dans le tenant', async () => {
      litRepo.findOne.mockResolvedValue({ id: 'lit-x', numero: 'CH-101' });
      await expect(
        service.createLit({ numero: 'CH-101', service: ServiceHospitalisation.CHIRURGIE } as any, TENANT),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAllLits', () => {
    it('filtre les lits par tenantId dans le QueryBuilder', async () => {
      const qb = makeQb({ getMany: [{ id: 'lit-1', numero: 'CH-101' }] });
      litRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllLits(TENANT);

      expect(qb.where).toHaveBeenCalledWith('l.tenantId = :tenantId', { tenantId: TENANT });
      expect(result).toHaveLength(1);
    });
  });

  describe('findAllSejours', () => {
    it('filtre les séjours par tenantId dans le QueryBuilder', async () => {
      const qb = makeQb({ getManyAndCount: [[{ id: 'sej-1', patientId: 'pat-1' }], 1] });
      sejourRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllSejours(TENANT);

      expect(qb.where).toHaveBeenCalledWith('s.tenantId = :tenantId', { tenantId: TENANT });
      expect(result.total).toBe(1);
    });
  });

  describe('findOne', () => {
    it('retourne le séjour scopé au tenant', async () => {
      const sejour = { id: 'sej-1', tenantId: TENANT };
      sejourRepo.findOne.mockResolvedValue(sejour);
      const result = await service.findOne('sej-1', TENANT);

      expect(sejourRepo.findOne).toHaveBeenCalledWith({ where: { id: 'sej-1', tenantId: TENANT } });
      expect(result.id).toBe('sej-1');
    });

    it('lève NotFoundException si le séjour est introuvable', async () => {
      sejourRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('xxx', TENANT)).rejects.toThrow(NotFoundException);
    });
  });
});
