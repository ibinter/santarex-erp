import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Paiement, StatutPaiement } from './entities/paiement.entity';
import { Facture, StatutFacture } from '../facturation/entities/facture.entity';
import { CreatePaiementDto } from './dto/create-paiement.dto';

@Injectable()
export class PaiementsService {
  constructor(
    @InjectRepository(Paiement)
    private paiementRepo: Repository<Paiement>,
    @InjectRepository(Facture)
    private factureRepo: Repository<Facture>,
  ) {}

  private async genererReference(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `PAY-${year}-`;
    const dernier = await this.paiementRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.reference LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('p.reference', 'DESC')
      .getOne();

    let sequence = 1;
    if (dernier) {
      const parts = dernier.reference.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  async createPaiement(dto: CreatePaiementDto, tenantId: string, userId: string): Promise<Paiement> {
    const facture = await this.factureRepo.findOne({ where: { id: dto.factureId, tenantId } });
    if (!facture) throw new NotFoundException('Facture non trouvée');
    if (facture.statut === StatutFacture.ANNULEE) {
      throw new BadRequestException('Impossible de payer une facture annulée');
    }
    if (facture.statut === StatutFacture.PAYEE) {
      throw new BadRequestException('Cette facture est déjà entièrement payée');
    }

    const reference = await this.genererReference(tenantId);
    const paiement = this.paiementRepo.create({
      reference,
      factureId: dto.factureId,
      patientId: dto.patientId,
      montant: dto.montant,
      devise: dto.devise ?? 'XOF',
      modePaiement: dto.modePaiement,
      operateur: dto.operateur,
      referenceTransaction: dto.referenceTransaction,
      notes: dto.notes,
      statut: StatutPaiement.VALIDE,
      tenantId,
      createdById: userId,
      validatedAt: new Date(),
    });

    const saved = await this.paiementRepo.save(paiement);
    await this.updateFactureApresPaiement(dto.factureId, dto.montant, tenantId);
    return saved;
  }

  private async updateFactureApresPaiement(
    factureId: string,
    montantNouveauPaiement: number,
    tenantId: string,
  ): Promise<void> {
    const facture = await this.factureRepo.findOne({ where: { id: factureId, tenantId } });
    if (!facture) return;

    const montantPaye = Number(facture.montantPaye) + Number(montantNouveauPaiement);
    const montantRestant = Math.max(0, Number(facture.montantTTC) - montantPaye);

    let statut = facture.statut;
    if (montantRestant <= 0) {
      statut = StatutFacture.PAYEE;
    } else if (montantPaye > 0) {
      statut = StatutFacture.PARTIELLEMENT_PAYEE;
    }

    await this.factureRepo.update(factureId, {
      montantPaye: Math.round(montantPaye * 100) / 100,
      montantRestant: Math.round(montantRestant * 100) / 100,
      statut,
    });
  }

  async findAll(
    tenantId: string,
    filters: {
      factureId?: string;
      patientId?: string;
      modePaiement?: string;
      dateDebut?: string;
      dateFin?: string;
    },
    pagination: { page?: number; limit?: number },
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.paiementRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId });

    if (filters.factureId) qb.andWhere('p.factureId = :factureId', { factureId: filters.factureId });
    if (filters.patientId) qb.andWhere('p.patientId = :patientId', { patientId: filters.patientId });
    if (filters.modePaiement) qb.andWhere('p.modePaiement = :mode', { mode: filters.modePaiement });
    if (filters.dateDebut) qb.andWhere('p.createdAt >= :dateDebut', { dateDebut: filters.dateDebut });
    if (filters.dateFin) qb.andWhere('p.createdAt <= :dateFin', { dateFin: filters.dateFin });

    const [data, total] = await qb.orderBy('p.createdAt', 'DESC').skip(skip).take(limit).getManyAndCount();
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Paiement> {
    const paiement = await this.paiementRepo.findOne({ where: { id, tenantId } });
    if (!paiement) throw new NotFoundException(`Paiement ${id} non trouvé`);
    return paiement;
  }

  async valider(id: string, tenantId: string, userId: string): Promise<Paiement> {
    const paiement = await this.findOne(id, tenantId);
    if (paiement.statut !== StatutPaiement.EN_ATTENTE) {
      throw new BadRequestException('Seuls les paiements en attente peuvent être validés');
    }
    await this.paiementRepo.update(id, {
      statut: StatutPaiement.VALIDE,
      validatedAt: new Date(),
    });
    await this.updateFactureApresPaiement(paiement.factureId, Number(paiement.montant), tenantId);
    return this.findOne(id, tenantId);
  }

  async rembourser(id: string, motif: string, tenantId: string, userId: string): Promise<Paiement> {
    const paiement = await this.findOne(id, tenantId);
    if (paiement.statut !== StatutPaiement.VALIDE) {
      throw new BadRequestException('Seuls les paiements validés peuvent être remboursés');
    }
    await this.paiementRepo.update(id, {
      statut: StatutPaiement.REMBOURSE,
      notes: paiement.notes ? `${paiement.notes}\nRemboursement: ${motif}` : `Remboursement: ${motif}`,
    });

    // Inverser le montant sur la facture
    const facture = await this.factureRepo.findOne({ where: { id: paiement.factureId, tenantId } });
    if (facture) {
      const montantPaye = Math.max(0, Number(facture.montantPaye) - Number(paiement.montant));
      const montantRestant = Number(facture.montantTTC) - montantPaye;
      const statut = montantPaye <= 0 ? StatutFacture.EMISE : StatutFacture.PARTIELLEMENT_PAYEE;
      await this.factureRepo.update(paiement.factureId, {
        montantPaye: Math.round(montantPaye * 100) / 100,
        montantRestant: Math.round(montantRestant * 100) / 100,
        statut,
      });
    }

    return this.findOne(id, tenantId);
  }

  async getStatsCaisse(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const stats = await this.paiementRepo
      .createQueryBuilder('p')
      .select('p.modePaiement', 'modePaiement')
      .addSelect('COALESCE(SUM(p.montant), 0)', 'total')
      .addSelect('COUNT(p.id)', 'count')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.statut = :statut', { statut: StatutPaiement.VALIDE })
      .andWhere('p.createdAt BETWEEN :debut AND :fin', { debut: targetDate, fin: endDate })
      .groupBy('p.modePaiement')
      .getRawMany();

    const totalJour = stats.reduce((sum, s) => sum + Number(s.total), 0);

    return { date: targetDate, totalJour, parMode: stats };
  }

  async getTotalEncaisseJour(tenantId: string): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const result = await this.paiementRepo
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.montant), 0)', 'total')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.statut = :statut', { statut: StatutPaiement.VALIDE })
      .andWhere('p.createdAt BETWEEN :debut AND :fin', { debut: today, fin: todayEnd })
      .getRawOne();

    return Number(result.total);
  }
}
