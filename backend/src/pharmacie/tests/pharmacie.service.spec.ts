import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { PharmacieService } from '../pharmacie.service';
import { Medicament, MedicamentForme, MedicamentCategorie } from '../entities/medicament.entity';
import { StockMedicament } from '../entities/stock-medicament.entity';
import { MouvementStock } from '../entities/mouvement-stock.entity';

const TENANT = 'clinique-a';

function makeQb(overrides: any = {}) {
  const qb: any = {};
  for (const m of ['where', 'andWhere', 'orderBy', 'addOrderBy', 'skip', 'take', 'select']) {
    qb[m] = jest.fn().mockReturnValue(qb);
  }
  qb.getMany = jest.fn().mockResolvedValue(overrides.getMany ?? []);
  qb.getManyAndCount = jest.fn().mockResolvedValue(overrides.getManyAndCount ?? [[], 0]);
  qb.getCount = jest.fn().mockResolvedValue(overrides.getCount ?? 0);
  qb.getRawOne = jest.fn().mockResolvedValue(overrides.getRawOne ?? { valeur: '0' });
  return qb;
}

describe('PharmacieService', () => {
  let service: PharmacieService;
  let medicamentRepo: Record<string, jest.Mock>;
  let stockRepo: Record<string, jest.Mock>;
  let mouvementRepo: Record<string, jest.Mock>;

  beforeEach(async () => {
    medicamentRepo = {
      findOne: jest.fn(),
      count: jest.fn().mockResolvedValue(0),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'med-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    stockRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'lot-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };
    mouvementRepo = {
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'mvt-1', ...v })),
      createQueryBuilder: jest.fn().mockReturnValue(makeQb()),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PharmacieService,
        { provide: getRepositoryToken(Medicament), useValue: medicamentRepo },
        { provide: getRepositoryToken(StockMedicament), useValue: stockRepo },
        { provide: getRepositoryToken(MouvementStock), useValue: mouvementRepo },
      ],
    }).compile();

    service = module.get<PharmacieService>(PharmacieService);
  });

  describe('createMedicament', () => {
    it('crée un médicament avec le tenantId et un code généré (scoping tenant)', async () => {
      medicamentRepo.count.mockResolvedValue(4); // → code MED-00005
      const dto: any = {
        nom: 'Amoxicilline',
        forme: MedicamentForme.COMPRIME,
        dosage: '500mg',
        unite: 'comprimé',
        categorie: MedicamentCategorie.ANTIBIOTIQUE,
      };
      const result = await service.createMedicament(dto, TENANT);

      expect(medicamentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, code: 'MED-00005', nom: 'Amoxicilline' }),
      );
      // Le comptage pour la génération de code est scopé au tenant
      expect(medicamentRepo.count).toHaveBeenCalledWith({ where: { tenantId: TENANT } });
      expect(result.tenantId).toBe(TENANT);
    });
  });

  describe('findAllMedicaments', () => {
    it('filtre les médicaments par tenantId dans le QueryBuilder', async () => {
      const qb = makeQb({ getManyAndCount: [[{ id: 'med-1', nom: 'Amoxicilline' }], 1] });
      medicamentRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAllMedicaments(TENANT);

      expect(qb.where).toHaveBeenCalledWith('m.tenantId = :tenantId', { tenantId: TENANT });
      expect(result.total).toBe(1);
    });
  });

  describe('findOneMedicament', () => {
    it('retourne le médicament scopé au tenant', async () => {
      medicamentRepo.findOne.mockResolvedValue({ id: 'med-1', tenantId: TENANT });
      const result = await service.findOneMedicament('med-1', TENANT);

      expect(medicamentRepo.findOne).toHaveBeenCalledWith({ where: { id: 'med-1', tenantId: TENANT } });
      expect(result.id).toBe('med-1');
    });

    it('lève NotFoundException si le médicament est introuvable', async () => {
      medicamentRepo.findOne.mockResolvedValue(null);
      await expect(service.findOneMedicament('xxx', TENANT)).rejects.toThrow(NotFoundException);
    });
  });
});
