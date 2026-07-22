import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { LaboratoireService } from '../laboratoire.service';
import { TypeAnalyse } from '../entities/type-analyse.entity';
import { DemandeAnalyse } from '../entities/demande-analyse.entity';
import { ResultatAnalyse } from '../entities/resultat-analyse.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';

const TENANT = 'clinique-a';

function makeQb(overrides: any = {}) {
  const qb: any = {};
  for (const m of ['where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take', 'select']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? []);
  qb.getManyAndCount = jest.fn().mockResolvedValue(overrides.getManyAndCount ?? [[], 0]);
  qb.getCount = jest.fn().mockResolvedValue(overrides.getCount ?? 0);
  return qb;
}

describe('LaboratoireService', () => {
  let service: LaboratoireService;
  let typeAnalyseRepo: Record<string, jest.Mock>;
  let demandeRepo: Record<string, jest.Mock>;
  let resultatRepo: Record<string, jest.Mock>;
  let patientRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    typeAnalyseRepo = {
      find: jest.fn().mockResolvedValue([]),
      findByIds: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'type-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    demandeRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'dem-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    resultatRepo = {
      findOne: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'res-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    patientRepo = { find: jest.fn().mockResolvedValue([]) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LaboratoireService,
        { provide: getRepositoryToken(TypeAnalyse), useValue: typeAnalyseRepo },
        { provide: getRepositoryToken(DemandeAnalyse), useValue: demandeRepo },
        { provide: getRepositoryToken(ResultatAnalyse), useValue: resultatRepo },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
      ],
    }).compile();

    service = module.get<LaboratoireService>(LaboratoireService);
  });

  describe('creerDemande', () => {
    it('crée la demande avec le tenantId et un numéro généré (scoping tenant)', async () => {
      demandeRepo.count.mockResolvedValue(0); // → numéro LAB-<annee>-00001
      const dto: any = { patientId: 'pat-1', medecinId: 'med-1', analyses: [] };
      const result = await service.creerDemande(dto, TENANT, 'user-1');

      expect(demandeRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, createdById: 'user-1', patientId: 'pat-1' }),
      );
      // Le comptage pour la génération de numéro est scopé au tenant
      expect(demandeRepo.count).toHaveBeenCalledWith({ where: { tenantId: TENANT } });
      const numero = demandeRepo.create.mock.calls[0][0].numero;
      expect(numero).toMatch(/^LAB-\d{4}-00001$/);
      expect(result.tenantId).toBe(TENANT);
    });
  });

  describe('findAllDemandes', () => {
    it('filtre les demandes par tenantId dans le QueryBuilder', async () => {
      const qb = makeQb({ getManyAndCount: [[{ id: 'dem-1', patientId: 'pat-1' }], 1] });
      demandeRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllDemandes(TENANT);

      expect(qb.where).toHaveBeenCalledWith('d.tenantId = :tenantId', { tenantId: TENANT });
      expect(result.total).toBe(1);
    });
  });

  describe('findOneDemande', () => {
    it('retourne la demande scopée au tenant', async () => {
      demandeRepo.findOne.mockResolvedValue({ id: 'dem-1', tenantId: TENANT });
      const result = await service.findOneDemande('dem-1', TENANT);

      expect(demandeRepo.findOne).toHaveBeenCalledWith({ where: { id: 'dem-1', tenantId: TENANT } });
      expect(result.id).toBe('dem-1');
    });

    it('lève NotFoundException si la demande est introuvable', async () => {
      demandeRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneDemande('xxx', TENANT)).rejects.toThrow(NotFoundException);
    });
  });
});
