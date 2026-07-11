import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, Like } from 'typeorm';
import { Facture, StatutFacture } from './entities/facture.entity';
import { LigneFacture } from './entities/ligne-facture.entity';
import { CreateFactureDto, CreateLigneFactureDto } from './dto/create-facture.dto';
import { UpdateFactureDto } from './dto/update-facture.dto';

@Injectable()
export class FacturationService {
  constructor(
    @InjectRepository(Facture)
    private factureRepo: Repository<Facture>,
    @InjectRepository(LigneFacture)
    private ligneRepo: Repository<LigneFacture>,
  ) {}

  async genererNumeroFacture(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `FAC-${year}-`;
    const derniere = await this.factureRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('f.numero', 'DESC')
      .getOne();

    let sequence = 1;
    if (derniere) {
      const parts = derniere.numero.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  async createFacture(dto: CreateFactureDto, tenantId: string, userId: string): Promise<Facture> {
    const numero = await this.genererNumeroFacture(tenantId);
    const dateEcheance = dto.dateEcheance
      ? new Date(dto.dateEcheance)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const facture = this.factureRepo.create({
      numero,
      patientId: dto.patientId,
      consultationId: dto.consultationId,
      hospitalisationId: dto.hospitalisationId,
      dateEcheance,
      tauxTVA: dto.tauxTVA ?? 0,
      partAssurance: dto.partAssurance ?? 0,
      assuranceNom: dto.assuranceNom,
      assuranceNumero: dto.assuranceNumero,
      devise: dto.devise ?? 'XOF',
      notes: dto.notes,
      tenantId,
      createdById: userId,
    });

    const saved = await this.factureRepo.save(facture);

    if (dto.lignes && dto.lignes.length > 0) {
      for (const ligneDto of dto.lignes) {
        await this.addLigne(saved.id, ligneDto, tenantId);
      }
    }

    return this.findOne(saved.id, tenantId);
  }

  async addLigne(factureId: string, dto: CreateLigneFactureDto, tenantId: string): Promise<LigneFacture> {
    const facture = await this.findOne(factureId, tenantId);
    if (facture.statut === StatutFacture.ANNULEE || facture.statut === StatutFacture.PAYEE) {
      throw new BadRequestException('Impossible de modifier une facture annulée ou payée');
    }

    const remise = dto.remisePourcent ?? 0;
    const montantTotal = dto.quantite * dto.prixUnitaire * (1 - remise / 100);

    const ligne = this.ligneRepo.create({
      factureId,
      type: dto.type,
      libelle: dto.libelle,
      quantite: dto.quantite,
      prixUnitaire: dto.prixUnitaire,
      remisePourcent: remise,
      montantTotal: Math.round(montantTotal * 100) / 100,
      referenceId: dto.referenceId,
      tenantId,
    });

    const savedLigne = await this.ligneRepo.save(ligne);
    await this.recalculerTotaux(factureId, tenantId);
    return savedLigne;
  }

  async removeLigne(ligneId: string, factureId: string, tenantId: string): Promise<void> {
    const ligne = await this.ligneRepo.findOne({ where: { id: ligneId, factureId, tenantId } });
    if (!ligne) throw new NotFoundException('Ligne de facture non trouvée');
    await this.ligneRepo.remove(ligne);
    await this.recalculerTotaux(factureId, tenantId);
  }

  async recalculerTotaux(factureId: string, tenantId: string): Promise<Facture> {
    const facture = await this.factureRepo.findOne({
      where: { id: factureId, tenantId },
      relations: ['lignes'],
    });
    if (!facture) throw new NotFoundException('Facture non trouvée');

    const montantHT = facture.lignes.reduce((sum, l) => sum + Number(l.montantTotal), 0);
    const montantTVA = montantHT * (Number(facture.tauxTVA) / 100);
    const montantTTC = montantHT + montantTVA;
    const montantRestant = montantTTC - Number(facture.montantPaye);
    const partPatient = Math.max(0, montantRestant - Number(facture.partAssurance));

    await this.factureRepo.update(factureId, {
      montantHT: Math.round(montantHT * 100) / 100,
      montantTVA: Math.round(montantTVA * 100) / 100,
      montantTTC: Math.round(montantTTC * 100) / 100,
      montantRestant: Math.round(montantRestant * 100) / 100,
      partPatient: Math.round(partPatient * 100) / 100,
    });

    return this.findOne(factureId, tenantId);
  }

  async emettre(factureId: string, tenantId: string): Promise<Facture> {
    const facture = await this.findOne(factureId, tenantId);
    if (facture.statut !== StatutFacture.BROUILLON) {
      throw new BadRequestException('Seules les factures en brouillon peuvent être émises');
    }
    await this.factureRepo.update(factureId, { statut: StatutFacture.EMISE });
    return this.findOne(factureId, tenantId);
  }

  async annuler(factureId: string, motif: string, tenantId: string): Promise<Facture> {
    const facture = await this.findOne(factureId, tenantId);
    if (facture.statut === StatutFacture.PAYEE) {
      throw new BadRequestException('Une facture payée ne peut pas être annulée directement');
    }
    await this.factureRepo.update(factureId, {
      statut: StatutFacture.ANNULEE,
      notes: facture.notes ? `${facture.notes}\nAnnulation: ${motif}` : `Annulation: ${motif}`,
    });
    return this.findOne(factureId, tenantId);
  }

  async applyAssurance(factureId: string, tenantId: string): Promise<Facture> {
    const facture = await this.findOne(factureId, tenantId);
    const partPatient = Math.max(0, Number(facture.montantTTC) - Number(facture.partAssurance));
    await this.factureRepo.update(factureId, { partPatient: Math.round(partPatient * 100) / 100 });
    return this.findOne(factureId, tenantId);
  }

  async update(id: string, dto: UpdateFactureDto, tenantId: string): Promise<Facture> {
    const facture = await this.findOne(id, tenantId);
    if (facture.statut === StatutFacture.ANNULEE) {
      throw new BadRequestException('Impossible de modifier une facture annulée');
    }
    await this.factureRepo.update(id, { ...dto });
    return this.findOne(id, tenantId);
  }

  async findAll(
    tenantId: string,
    filters: { patientId?: string; statut?: StatutFacture; dateDebut?: string; dateFin?: string },
    pagination: { page?: number; limit?: number },
  ): Promise<{ data: Facture[]; total: number; page: number; limit: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.factureRepo
      .createQueryBuilder('f')
      .leftJoinAndSelect('f.lignes', 'lignes')
      .where('f.tenantId = :tenantId', { tenantId });

    if (filters.patientId) qb.andWhere('f.patientId = :patientId', { patientId: filters.patientId });
    if (filters.statut) qb.andWhere('f.statut = :statut', { statut: filters.statut });
    if (filters.dateDebut) qb.andWhere('f.dateEmission >= :dateDebut', { dateDebut: filters.dateDebut });
    if (filters.dateFin) qb.andWhere('f.dateEmission <= :dateFin', { dateFin: filters.dateFin });

    const [data, total] = await qb.orderBy('f.createdAt', 'DESC').skip(skip).take(limit).getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Facture> {
    const facture = await this.factureRepo.findOne({
      where: { id, tenantId },
      relations: ['lignes'],
    });
    if (!facture) throw new NotFoundException(`Facture ${id} non trouvée`);
    return facture;
  }

  async getStatsFacturation(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const caJour = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantTTC), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.statut IN (:...statuts)', { statuts: ['emise', 'partiellement_payee', 'payee'] })
      .andWhere('f.dateEmission BETWEEN :debut AND :fin', { debut: today, fin: todayEnd })
      .getRawOne();

    const caMois = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantTTC), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.statut IN (:...statuts)', { statuts: ['emise', 'partiellement_payee', 'payee'] })
      .andWhere('f.dateEmission >= :debut', { debut: monthStart })
      .getRawOne();

    const impayes = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantRestant), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.statut IN (:...statuts)', { statuts: ['emise', 'partiellement_payee'] })
      .getRawOne();

    const totalEmis = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantTTC), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.statut != :statut', { statut: 'annulee' })
      .getRawOne();

    const totalEncaisse = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantPaye), 0)', 'total')
      .where('f.tenantId = :tenantId', { tenantId })
      .getRawOne();

    const tauxRecouvrement =
      Number(totalEmis.total) > 0
        ? (Number(totalEncaisse.total) / Number(totalEmis.total)) * 100
        : 0;

    return {
      caJour: Number(caJour.total),
      caMois: Number(caMois.total),
      impayes: Number(impayes.total),
      tauxRecouvrement: Math.round(tauxRecouvrement * 100) / 100,
    };
  }
}
