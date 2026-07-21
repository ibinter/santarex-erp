import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken, getDataSourceToken } from '@nestjs/typeorm';
import { ConflictException, GoneException } from '@nestjs/common';

import { VoucherService } from '../voucher.service';
import { LicenceLifecycleService } from '../licence-lifecycle.service';
import { Voucher } from '../entities/voucher.entity';
import { VoucherStatus } from '../payments.enums';

/**
 * VoucherService — codes prépayés à USAGE UNIQUE.
 * Scénarios : code déjà utilisé refusé ; bascule atomique gagnée par un seul
 * appelant (les concurrents voient affected=0 → refus) ; code expiré refusé.
 */
describe('VoucherService', () => {
  let service: VoucherService;
  let vouchers: Record<string, jest.Mock>;
  let lifecycle: { grantFromVoucher: jest.Mock };
  let updateResult: { affected: number };

  /** Query-builder factice reproduisant l'UPDATE conditionnel atomique. */
  function mockDataSource() {
    const builder: any = {
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn().mockImplementation(async () => updateResult),
    };
    return {
      createQueryBuilder: jest.fn().mockReturnValue(builder),
      _builder: builder,
    };
  }
  let dataSource: ReturnType<typeof mockDataSource>;

  const availableVoucher = (): Partial<Voucher> => ({
    id: 'v-1',
    code: 'SANT-ABCD-EFGH-JKLM',
    status: VoucherStatus.AVAILABLE,
    offerCode: 'PRO',
    durationDays: 30,
    value: 5_000_000,
    expiresAt: null,
  });

  beforeEach(async () => {
    updateResult = { affected: 1 };
    dataSource = mockDataSource();
    vouchers = {
      findOne: jest.fn(),
      findOneOrFail: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
    };
    lifecycle = { grantFromVoucher: jest.fn().mockResolvedValue({ id: 'lic-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VoucherService,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: getRepositoryToken(Voucher), useValue: vouchers },
        { provide: LicenceLifecycleService, useValue: lifecycle },
      ],
    }).compile();

    service = module.get(VoucherService);
  });

  it('redeem: active un code disponible une seule fois (affected=1) et octroie la licence', async () => {
    vouchers.findOne.mockResolvedValue(availableVoucher());
    vouchers.findOneOrFail.mockResolvedValue(availableVoucher());

    const res = await service.redeem('sant-abcd-efgh-jklm', 'clinique-a');

    expect(res.licence).toEqual({ id: 'lic-1' });
    // La bascule AVAILABLE → USED est portée par l'UPDATE conditionnel.
    expect(dataSource._builder.execute).toHaveBeenCalledTimes(1);
    expect(lifecycle.grantFromVoucher).toHaveBeenCalledTimes(1);
  });

  it('redeem: refuse un code déjà utilisé (ConflictException) sans tenter de bascule', async () => {
    vouchers.findOne.mockResolvedValue({ ...availableVoucher(), status: VoucherStatus.USED });

    await expect(service.redeem('SANT-ABCD-EFGH-JKLM', 'clinique-b')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(dataSource.createQueryBuilder).not.toHaveBeenCalled();
    expect(lifecycle.grantFromVoucher).not.toHaveBeenCalled();
  });

  it('redeem: usage unique sous concurrence — un second appelant voit affected=0 → refus', async () => {
    // Le code est encore "available" au diagnostic mais l'UPDATE atomique a déjà
    // été gagné par un autre appel : affected=0 → aucune activation.
    vouchers.findOne.mockResolvedValue(availableVoucher());
    updateResult = { affected: 0 };

    await expect(service.redeem('SANT-ABCD-EFGH-JKLM', 'clinique-b')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(lifecycle.grantFromVoucher).not.toHaveBeenCalled();
  });

  it('redeem: refuse un code expiré (GoneException)', async () => {
    vouchers.findOne.mockResolvedValue({
      ...availableVoucher(),
      expiresAt: new Date(Date.now() - 3_600_000),
    });

    await expect(service.redeem('SANT-ABCD-EFGH-JKLM', 'clinique-b')).rejects.toBeInstanceOf(
      GoneException,
    );
  });
});
