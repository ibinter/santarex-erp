import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, ConflictException } from '@nestjs/common';

import { ManualPaymentService } from '../manual-payment.service';
import { ProofStorageService } from '../proof-storage.service';
import { LicenceLifecycleService } from '../licence-lifecycle.service';
import { OffresSaasService } from '../../offres-saas/offres-saas.service';
import { PaymentTransaction } from '../entities/payment-transaction.entity';
import { PaymentProof } from '../entities/payment-proof.entity';
import { PaymentMethodConfig } from '../entities/payment-method-config.entity';
import { PaymentStatus, PaymentMethodType } from '../payments.enums';

/**
 * ManualPaymentService — flux manuel (preuve + validation admin).
 * Scénarios : preuve dédupliquée refusée ; montant incorrect refusé à la
 * validation ; validation nominale → activation licence.
 */
describe('ManualPaymentService', () => {
  let service: ManualPaymentService;
  let txRepo: Record<string, jest.Mock>;
  let proofRepo: Record<string, jest.Mock>;
  let methodRepo: Record<string, jest.Mock>;
  let proofStorage: { computeSha256: jest.Mock; store: jest.Mock };
  let lifecycle: { activateFromTransaction: jest.Mock };

  const futureExpiry = new Date(Date.now() + 24 * 3_600_000);

  const baseTx = (): Partial<PaymentTransaction> => ({
    id: 'tx-1',
    reference: 'PAY-2026-000001',
    tenantId: 'clinique-a',
    tenantSlug: 'clinique-a',
    offreCode: 'PRO',
    methodType: PaymentMethodType.MOBILE_MONEY,
    methodKey: 'mobile_money.orange',
    status: PaymentStatus.AWAITING_PROOF,
    amountExpected: 5_000_000,
    amountReceived: null,
    expiresAt: futureExpiry,
  });

  beforeEach(async () => {
    txRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation(async (x) => x),
    };
    proofRepo = {
      findOne: jest.fn(),
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation(async (x) => x),
    };
    methodRepo = { findOne: jest.fn() };
    proofStorage = {
      computeSha256: jest.fn().mockReturnValue('a'.repeat(64)),
      store: jest.fn(),
    };
    lifecycle = { activateFromTransaction: jest.fn().mockResolvedValue({ id: 'lic-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManualPaymentService,
        { provide: getRepositoryToken(PaymentTransaction), useValue: txRepo },
        { provide: getRepositoryToken(PaymentProof), useValue: proofRepo },
        { provide: getRepositoryToken(PaymentMethodConfig), useValue: methodRepo },
        { provide: OffresSaasService, useValue: { findByCode: jest.fn() } },
        { provide: ProofStorageService, useValue: proofStorage },
        { provide: LicenceLifecycleService, useValue: lifecycle },
        { provide: ConfigService, useValue: { get: (_k: string, d?: unknown) => d } },
      ],
    }).compile();

    service = module.get(ManualPaymentService);
  });

  describe('submitProof — déduplication', () => {
    it('refuse une preuve dont le SHA256 existe déjà (ConflictException) sans écrire le fichier', async () => {
      txRepo.findOne.mockResolvedValue(baseTx());
      proofRepo.findOne.mockResolvedValue({ id: 'proof-existing', sha256: 'a'.repeat(64) });

      const file = { buffer: Buffer.from('img'), originalname: 'recu.png', mimetype: 'image/png', size: 3 };

      await expect(service.submitProof('PAY-2026-000001', file)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(proofStorage.store).not.toHaveBeenCalled();
      expect(proofRepo.save).not.toHaveBeenCalled();
    });

    it('accepte une preuve inédite et passe la transaction en UNDER_REVIEW', async () => {
      txRepo.findOne.mockResolvedValue(baseTx());
      proofRepo.findOne.mockResolvedValue(null); // aucune empreinte connue
      proofStorage.store.mockResolvedValue({
        storagePath: 'clinique-a/uuid.png',
        sha256: 'a'.repeat(64),
        mimeType: 'image/png',
        sizeBytes: 3,
        originalName: 'recu.png',
      });

      const file = { buffer: Buffer.from('img'), originalname: 'recu.png', mimetype: 'image/png', size: 3 };
      const saved = await service.submitProof('PAY-2026-000001', file, 'user-9');

      expect(proofStorage.store).toHaveBeenCalledTimes(1);
      expect(proofRepo.save).toHaveBeenCalledTimes(1);
      expect(saved.status).toBe(PaymentStatus.UNDER_REVIEW);
    });
  });

  describe('adminValidate — contrôle du montant', () => {
    it("refuse la validation si le montant reçu diffère de l'attendu (BadRequestException)", async () => {
      txRepo.findOne.mockResolvedValue({
        ...baseTx(),
        status: PaymentStatus.UNDER_REVIEW,
        amountReceived: 4_000_000, // 1 000 000 de moins qu'attendu
      });

      await expect(service.adminValidate('PAY-2026-000001', 'admin-1')).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(lifecycle.activateFromTransaction).not.toHaveBeenCalled();
    });

    it('valide, passe la transaction en SUCCEEDED et active la licence quand le montant concorde', async () => {
      txRepo.findOne.mockResolvedValue({
        ...baseTx(),
        status: PaymentStatus.UNDER_REVIEW,
        amountReceived: null, // aligné sur l'attendu par le service
      });

      const result = await service.adminValidate('PAY-2026-000001', 'admin-1', 'OK caisse');

      expect(result.status).toBe(PaymentStatus.SUCCEEDED);
      expect(result.reviewedById).toBe('admin-1');
      expect(lifecycle.activateFromTransaction).toHaveBeenCalledTimes(1);
      expect(result.licenceId).toBe('lic-1');
    });
  });
});
