import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { ConsultationsService } from '../consultations.service';
import { Consultation } from '../entities/consultation.entity';
import { Ordonnance } from '../entities/ordonnance.entity';
import { Patient } from '../../patients/entities/patient.entity';
import { User } from '../../users/entities/user.entity';
import { RendezVousService } from '../../rendez-vous/rendez-vous.service';

const TENANT = 'clinique-a';

const mockConsultation = {
  id: 'cons-uuid-1',
  patientId: 'pat-1',
  medecinId: 'med-1',
  dateHeure: new Date('2026-07-22T10:00:00Z'),
  tenantId: TENANT,
};

describe('ConsultationsService', () => {
  let service: ConsultationsService;
  let consultationRepo: Record<string, jest.Mock>;
  let ordonnanceRepo: Record<string, jest.Mock>;
  let patientRepo: Record<string, jest.Mock>;
  let userRepo: Record<string, jest.Mock>;
  let rendezVousService: { update: jest.Mock };

  beforeEach(async () => {
    consultationRepo = {
      findOne: jest.fn(),
      findAndCount: jest.fn().mockResolvedValue([[], 0]),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'cons-uuid-1', ...v })),
    };
    ordonnanceRepo = {
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((v) => v),
      save: jest.fn().mockImplementation((v) => Promise.resolve({ id: 'ord-1', ...v })),
    };
    patientRepo = { find: jest.fn().mockResolvedValue([]) };
    userRepo = { find: jest.fn().mockResolvedValue([]) };
    rendezVousService = { update: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ConsultationsService,
        { provide: getRepositoryToken(Consultation), useValue: consultationRepo },
        { provide: getRepositoryToken(Ordonnance), useValue: ordonnanceRepo },
        { provide: getRepositoryToken(Patient), useValue: patientRepo },
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: RendezVousService, useValue: rendezVousService },
      ],
    }).compile();

    service = module.get<ConsultationsService>(ConsultationsService);
  });

  describe('create', () => {
    it('crée la consultation avec le tenantId (scoping tenant)', async () => {
      const dto: any = {
        patientId: 'pat-1',
        medecinId: 'med-1',
        dateHeure: '2026-07-22T10:00:00Z',
        type: 'consultation_generale',
        motif: 'Fièvre',
      };
      const result = await service.create(dto, TENANT, 'user-1');

      expect(consultationRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId: TENANT, patientId: 'pat-1' }),
      );
      expect(consultationRepo.save).toHaveBeenCalled();
      expect(result.tenantId).toBe(TENANT);
    });
  });

  describe('findAll', () => {
    it('filtre par tenantId dans la clause where', async () => {
      consultationRepo.findAndCount.mockResolvedValue([[mockConsultation], 1]);
      const result = await service.findAll(TENANT, {}, { page: 1, limit: 20 });

      expect(consultationRepo.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: TENANT }) }),
      );
      expect(result.total).toBe(1);
    });

    it('combine les filtres métier avec le tenantId', async () => {
      consultationRepo.findAndCount.mockResolvedValue([[], 0]);
      await service.findAll(TENANT, { medecinId: 'med-1', patientId: 'pat-1' }, {});

      const call = consultationRepo.findAndCount.mock.calls[0][0];
      expect(call.where).toMatchObject({ tenantId: TENANT, medecinId: 'med-1', patientId: 'pat-1' });
    });
  });

  describe('findOne', () => {
    it('retourne la consultation scopée au tenant', async () => {
      consultationRepo.findOne.mockResolvedValue(mockConsultation);
      const result = await service.findOne('cons-uuid-1', TENANT);

      expect(consultationRepo.findOne).toHaveBeenCalledWith({
        where: { id: 'cons-uuid-1', tenantId: TENANT },
      });
      expect(result.id).toBe('cons-uuid-1');
    });

    it('lève NotFoundException si la consultation est introuvable', async () => {
      consultationRepo.findOne.mockResolvedValue(null);
      await expect(service.findOne('xxx', TENANT)).rejects.toThrow(NotFoundException);
    });
  });
});
