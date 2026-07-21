import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

import { LicenceLifecycleService } from '../licence-lifecycle.service';
import { OffresSaasService } from '../../offres-saas/offres-saas.service';
import { TenantsService } from '../../tenants/tenants.service';
import { MailService } from '../../mail/mail.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { Licence, LicenceStatut } from '../../licences/entities/licence.entity';
import { OffreCycle } from '../../offres-saas/entities/offre-saas.entity';
import { PaymentStatus } from '../payments.enums';
import { PaymentTransaction } from '../entities/payment-transaction.entity';

/**
 * LicenceLifecycleService — activation / renouvellement.
 * Scénarios : le renouvellement anticipé étend DEPUIS la date de fin courante
 * (pas depuis aujourd'hui) ; l'activation est idempotente (une même référence de
 * transaction n'est jamais appliquée deux fois).
 */
describe('LicenceLifecycleService', () => {
  let service: LicenceLifecycleService;
  let stored: Partial<Licence>;
  let licenceRepo: Record<string, jest.Mock>;

  const CURRENT_END = new Date('2026-10-01T00:00:00.000Z'); // futur (today = 2026-07-21)

  const offre = {
    id: 'off-pro',
    code: 'PRO',
    nom: 'Pro',
    cycle: OffreCycle.MENSUEL,
    prix: 50000,
    maxUtilisateurs: 20,
    modulesInclus: ['dme', 'facturation'],
  };

  const tx = (): Partial<PaymentTransaction> => ({
    reference: 'PAY-2026-000042',
    tenantSlug: 'clinique-a',
    offreCode: 'PRO',
    status: PaymentStatus.SUCCEEDED,
    amountExpected: 5_000_000,
    amountReceived: 5_000_000,
  });

  /** Mail : toutes les méthodes d'envoi utilisées sont des no-op résolus. */
  const mailMock = () => ({
    envoyerLicenceActivee: jest.fn().mockResolvedValue(undefined),
    envoyerLicenceRenouvelee: jest.fn().mockResolvedValue(undefined),
    envoyerLicenceEssai: jest.fn().mockResolvedValue(undefined),
    envoyerExpirationProche: jest.fn().mockResolvedValue(undefined),
    envoyerLicenceExpiree: jest.fn().mockResolvedValue(undefined),
    envoyerCompteSuspendu: jest.fn().mockResolvedValue(undefined),
  });
  const notifMock = () => ({ creer: jest.fn().mockResolvedValue(undefined) });

  beforeEach(async () => {
    stored = {
      id: 'lic-1',
      cle: 'SRX-AAAAA-BBBBB-CCCCC',
      tenantSlug: 'clinique-a',
      offreId: 'off-pro',
      offreCode: 'PRO',
      statut: LicenceStatut.ACTIVE,
      dateDebut: new Date('2026-01-01T00:00:00.000Z'),
      dateExpiration: new Date(CURRENT_END),
      maxUtilisateurs: 20,
      montantPaye: 5_000_000,
      notes: null,
    };

    licenceRepo = {
      findOne: jest.fn().mockImplementation(async () => stored),
      find: jest.fn().mockResolvedValue([]),
      create: jest.fn().mockImplementation((x) => x),
      save: jest.fn().mockImplementation(async (l) => {
        stored = l; // persistance simulée : la ref suivante lira l'état à jour
        return l;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LicenceLifecycleService,
        { provide: getRepositoryToken(Licence), useValue: licenceRepo },
        { provide: OffresSaasService, useValue: { findByCode: jest.fn().mockResolvedValue(offre) } },
        { provide: TenantsService, useValue: { findBySlug: jest.fn().mockResolvedValue({ id: 't1', slug: 'clinique-a', nom: 'Clinique A', email: 'a@x.io' }) } },
        { provide: MailService, useValue: mailMock() },
        { provide: NotificationsService, useValue: notifMock() },
        { provide: ConfigService, useValue: { get: (_k: string, d?: unknown) => d } },
      ],
    }).compile();

    service = module.get(LicenceLifecycleService);
  });

  it('renouvellement anticipé : étend la licence DEPUIS sa date de fin, pas depuis aujourd\'hui', async () => {
    const saved = await service.activateFromTransaction(tx() as PaymentTransaction);

    // MENSUEL = +1 mois à partir du 2026-10-01 → 2026-11-01 (et non ~2026-08-21).
    const end = new Date(saved.dateExpiration as Date);
    expect(end.getUTCFullYear()).toBe(2026);
    expect(end.getUTCMonth()).toBe(10); // novembre (0-indexé)
    expect(end.getTime()).toBeGreaterThan(CURRENT_END.getTime());
  });

  it('idempotence : une même référence de transaction n\'est appliquée qu\'une fois', async () => {
    const first = await service.activateFromTransaction(tx() as PaymentTransaction);
    const endAfterFirst = new Date(first.dateExpiration as Date).getTime();
    const savesAfterFirst = licenceRepo.save.mock.calls.length;

    // Rejeu du MÊME webhook/transaction : aucune nouvelle extension.
    const second = await service.activateFromTransaction(tx() as PaymentTransaction);
    const endAfterSecond = new Date(second.dateExpiration as Date).getTime();

    expect(endAfterSecond).toBe(endAfterFirst);
    // Le second appel sort avant toute écriture supplémentaire.
    expect(licenceRepo.save.mock.calls.length).toBe(savesAfterFirst);
  });
});
