import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, Like, MoreThan } from 'typeorm';
import { Medicament, MedicamentCategorie } from './entities/medicament.entity';
import { StockMedicament } from './entities/stock-medicament.entity';
import { MouvementStock, TypeMouvement } from './entities/mouvement-stock.entity';
import { CreateMedicamentDto } from './dto/create-medicament.dto';
import { EntreeStockDto, SortieStockDto } from './dto/mouvement-stock.dto';
import { DispenserOrdonnanceDto } from './dto/dispenser-ordonnance.dto';

@Injectable()
export class PharmacieService {
  constructor(
    @InjectRepository(Medicament)
    private readonly medicamentRepo: Repository<Medicament>,
    @InjectRepository(StockMedicament)
    private readonly stockRepo: Repository<StockMedicament>,
    @InjectRepository(MouvementStock)
    private readonly mouvementRepo: Repository<MouvementStock>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Génération de code unique
  // ────────────────────────────────────────────────────────────────
  private async genererCodeMedicament(tenantId: string): Promise<string> {
    const count = await this.medicamentRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `MED-${seq}`;
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD Médicaments
  // ────────────────────────────────────────────────────────────────
  async createMedicament(dto: CreateMedicamentDto, tenantId: string): Promise<Medicament> {
    const code = await this.genererCodeMedicament(tenantId);
    const medicament = this.medicamentRepo.create({ ...dto, code, tenantId });
    return this.medicamentRepo.save(medicament);
  }

  async findAllMedicaments(
    tenantId: string,
    filters: { categorie?: MedicamentCategorie; search?: string; enRupture?: boolean } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Medicament[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.medicamentRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId });

    if (filters.categorie) {
      qb.andWhere('m.categorie = :categorie', { categorie: filters.categorie });
    }
    if (filters.search) {
      qb.andWhere('(m.nom ILIKE :s OR m.nomCommercial ILIKE :s OR m.dci ILIKE :s OR m.code ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }
    if (filters.enRupture === true) {
      qb.andWhere('m.stockActuel <= m.stockMinimum');
    }

    const [data, total] = await qb
      .orderBy('m.nom', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneMedicament(id: string, tenantId: string): Promise<Medicament> {
    const med = await this.medicamentRepo.findOne({ where: { id, tenantId } });
    if (!med) throw new NotFoundException(`Médicament ${id} introuvable`);
    return med;
  }

  async updateMedicament(id: string, dto: Partial<CreateMedicamentDto>, tenantId: string): Promise<Medicament> {
    const med = await this.findOneMedicament(id, tenantId);
    Object.assign(med, dto);
    return this.medicamentRepo.save(med);
  }

  // ────────────────────────────────────────────────────────────────
  // Alertes stock
  // ────────────────────────────────────────────────────────────────
  async getMedicamentsEnRupture(tenantId: string): Promise<Medicament[]> {
    return this.medicamentRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.stockActuel <= m.stockMinimum')
      .andWhere('m.estActif = true')
      .orderBy('m.stockActuel', 'ASC')
      .getMany();
  }

  async getMedicamentsEnAlerte(tenantId: string): Promise<Medicament[]> {
    return this.medicamentRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.stockActuel <= m.stockMinimum * 1.2')
      .andWhere('m.estActif = true')
      .orderBy('m.stockActuel', 'ASC')
      .getMany();
  }

  async getMedicamentsExpirantBientot(tenantId: string, joursAvantExpiration = 30): Promise<any[]> {
    const dateLimite = new Date();
    dateLimite.setDate(dateLimite.getDate() + joursAvantExpiration);

    return this.stockRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.datePeremption <= :dateLimite', { dateLimite })
      .andWhere('s.quantiteActuelle > 0')
      .orderBy('s.datePeremption', 'ASC')
      .getMany();
  }

  // ────────────────────────────────────────────────────────────────
  // Gestion des stocks
  // ────────────────────────────────────────────────────────────────
  async entreeStock(
    medicamentId: string,
    dto: EntreeStockDto,
    tenantId: string,
    userId: string,
  ): Promise<{ lot: StockMedicament; mouvement: MouvementStock; medicament: Medicament }> {
    const med = await this.findOneMedicament(medicamentId, tenantId);

    const lot = this.stockRepo.create({
      medicamentId,
      numeroLot: dto.numeroLot,
      datePeremption: new Date(dto.datePeremption),
      dateReception: dto.dateReception ? new Date(dto.dateReception) : new Date(),
      quantiteInitiale: dto.quantite,
      quantiteActuelle: dto.quantite,
      fournisseur: dto.fournisseur,
      prixAchat: dto.prixAchat,
      localisation: dto.localisation,
      tenantId,
    });
    await this.stockRepo.save(lot);

    const quantiteAvant = med.stockActuel;
    med.stockActuel += dto.quantite;
    await this.medicamentRepo.save(med);

    const mouvement = this.mouvementRepo.create({
      medicamentId,
      lotId: lot.id,
      type: TypeMouvement.ENTREE,
      quantite: dto.quantite,
      quantiteAvant,
      quantiteApres: med.stockActuel,
      motif: dto.motif ?? 'Entrée de stock',
      tenantId,
      createdById: userId,
    });
    await this.mouvementRepo.save(mouvement);

    return { lot, mouvement, medicament: med };
  }

  async sortieStock(
    medicamentId: string,
    quantite: number,
    motif: string,
    tenantId: string,
    userId: string,
    ordonnanceId?: string,
    patientId?: string,
  ): Promise<MouvementStock> {
    const med = await this.findOneMedicament(medicamentId, tenantId);

    if (med.stockActuel < quantite) {
      throw new BadRequestException(
        `Stock insuffisant. Disponible: ${med.stockActuel}, Demandé: ${quantite}`,
      );
    }

    // Décrémenter le lot le plus ancien non périmé (FIFO)
    const lots = await this.stockRepo.find({
      where: { medicamentId, tenantId },
      order: { datePeremption: 'ASC' },
    });

    let restant = quantite;
    for (const lot of lots) {
      if (restant <= 0) break;
      if (lot.quantiteActuelle > 0) {
        const prise = Math.min(lot.quantiteActuelle, restant);
        lot.quantiteActuelle -= prise;
        restant -= prise;
        await this.stockRepo.save(lot);
      }
    }

    const quantiteAvant = med.stockActuel;
    med.stockActuel -= quantite;
    await this.medicamentRepo.save(med);

    const mouvement = this.mouvementRepo.create({
      medicamentId,
      type: TypeMouvement.SORTIE,
      quantite,
      quantiteAvant,
      quantiteApres: med.stockActuel,
      motif,
      ordonnanceId,
      patientId,
      tenantId,
      createdById: userId,
    });
    return this.mouvementRepo.save(mouvement);
  }

  async dispenserOrdonnance(
    ordonnanceId: string,
    dto: DispenserOrdonnanceDto,
    tenantId: string,
    userId: string,
  ): Promise<MouvementStock[]> {
    const mouvements: MouvementStock[] = [];

    for (const ligne of dto.lignes) {
      const mouv = await this.sortieStock(
        ligne.medicamentId,
        ligne.quantite,
        `Dispensation ordonnance ${ordonnanceId}`,
        tenantId,
        userId,
        ordonnanceId,
        dto.patientId,
      );
      mouvements.push(mouv);
    }

    return mouvements;
  }

  // ────────────────────────────────────────────────────────────────
  // Historique et stats
  // ────────────────────────────────────────────────────────────────
  async getHistoriqueMouvements(
    medicamentId: string,
    tenantId: string,
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: MouvementStock[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.mouvementRepo.findAndCount({
      where: { medicamentId, tenantId },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  async getStatsPharmacieJour(tenantId: string): Promise<any> {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);

    const mouvements = await this.mouvementRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.createdAt >= :debutJour', { debutJour })
      .getMany();

    const entrees = mouvements.filter(m => m.type === TypeMouvement.ENTREE);
    const sorties = mouvements.filter(m => m.type === TypeMouvement.SORTIE);

    const totalMedicaments = await this.medicamentRepo.count({ where: { tenantId, estActif: true } });

    const ruptureCount = await this.medicamentRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId', { tenantId })
      .andWhere('m.stockActuel <= m.stockMinimum')
      .getCount();

    const valeurStock = await this.medicamentRepo
      .createQueryBuilder('m')
      .select('SUM(m.stockActuel * m.prixVente)', 'valeur')
      .where('m.tenantId = :tenantId', { tenantId })
      .getRawOne();

    return {
      date: new Date().toISOString().split('T')[0],
      totalMedicaments,
      ruptureCount,
      valeurStockXOF: parseFloat(valeurStock?.valeur ?? '0'),
      mouvementsJour: {
        entrees: entrees.length,
        totalUniteEntrees: entrees.reduce((acc, m) => acc + m.quantite, 0),
        sorties: sorties.length,
        totalUniteSorties: sorties.reduce((acc, m) => acc + m.quantite, 0),
      },
    };
  }
}
