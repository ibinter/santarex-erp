import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaiementsService } from '../paiements.service';
import { StatutFacture } from '../../facturation/entities/facture.entity';

function build(facture: any | null) {
  const em: any = {
    findOne: jest.fn().mockResolvedValue(facture),
    create: jest.fn((_e, v) => v),
    save: jest.fn(async (v) => ({ id: 'p1', ...v })),
    update: jest.fn(),
  };
  const qb: any = {
    where: () => qb, andWhere: () => qb, orderBy: () => qb, getOne: async () => null,
  };
  const paiementRepo: any = {
    createQueryBuilder: () => qb,
    manager: { transaction: (fn: any) => fn(em) },
  };
  return { service: new PaiementsService(paiementRepo, {} as any, {} as any), em };
}

const facture = (over: any = {}) => ({
  id: 'f1', tenantId: 't1', patientId: 'pat1', devise: 'XOF',
  statut: StatutFacture.EMISE, montantTTC: 10000, montantPaye: 0, ...over,
});

describe('PaiementsService.createPaiement', () => {
  it('déduit le patient de la facture (patientId non envoyé)', async () => {
    const { service, em } = build(facture());
    const p: any = await service.createPaiement({ factureId: 'f1', montant: 4000, modePaiement: 'especes' as any }, 't1', 'u1');
    expect(p.patientId).toBe('pat1');
    expect(em.update).toHaveBeenCalledWith(expect.anything(), 'f1', expect.objectContaining({
      montantPaye: 4000, montantRestant: 6000, statut: StatutFacture.PARTIELLEMENT_PAYEE,
    }));
  });

  it('solde la facture quand le reste est payé', async () => {
    const { service, em } = build(facture({ montantPaye: 6000, statut: StatutFacture.PARTIELLEMENT_PAYEE }));
    await service.createPaiement({ factureId: 'f1', montant: 4000, modePaiement: 'especes' as any }, 't1', 'u1');
    expect(em.update).toHaveBeenCalledWith(expect.anything(), 'f1', expect.objectContaining({
      montantRestant: 0, statut: StatutFacture.PAYEE,
    }));
  });

  it('refuse un paiement supérieur au reste à payer', async () => {
    const { service, em } = build(facture({ montantPaye: 9000 }));
    await expect(
      service.createPaiement({ factureId: 'f1', montant: 2000, modePaiement: 'especes' as any }, 't1', 'u1'),
    ).rejects.toThrow(BadRequestException);
    expect(em.save).not.toHaveBeenCalled();
  });

  it('refuse une facture annulée ou déjà payée', async () => {
    for (const statut of [StatutFacture.ANNULEE, StatutFacture.PAYEE]) {
      const { service } = build(facture({ statut }));
      await expect(
        service.createPaiement({ factureId: 'f1', montant: 100, modePaiement: 'especes' as any }, 't1', 'u1'),
      ).rejects.toThrow(BadRequestException);
    }
  });

  it('refuse une facture introuvable', async () => {
    const { service } = build(null);
    await expect(
      service.createPaiement({ factureId: 'x', montant: 100, modePaiement: 'especes' as any }, 't1', 'u1'),
    ).rejects.toThrow(NotFoundException);
  });
});
