import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  CollecteDechets,
  CategorieDechet,
  StatutCollecte,
} from './entities/collecte-dechets.entity';
import {
  EnlevementDechets,
  StatutEnlevement,
} from './entities/enlevement-dechets.entity';
import { CreateCollecteDto } from './dto/create-collecte.dto';
import { CreateEnlevementDto } from './dto/create-enlevement.dto';
import { TraiterEnlevementDto } from './dto/traiter-enlevement.dto';

/** Seuil d'alerte : durée de stockage maximale avant enlèvement (jours). */
const SEUIL_STOCKAGE_JOURS = 7;

@Injectable()
export class DechetsMedicauxService {
  constructor(
    @InjectRepository(CollecteDechets)
    private readonly collecteRepo: Repository<CollecteDechets>,
    @InjectRepository(EnlevementDechets)
    private readonly enlevementRepo: Repository<EnlevementDechets>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Génération de numéros uniques (par tenant / année)
  // ────────────────────────────────────────────────────────────────
  private async genererNumeroCollecte(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.collecteRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('EXTRACT(YEAR FROM c."createdAt") = :annee', { annee })
      .getCount();
    return `DAS-${annee}-${String(count + 1).padStart(4, '0')}`;
  }

  private async genererNumeroBordereau(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.enlevementRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('EXTRACT(YEAR FROM e."createdAt") = :annee', { annee })
      .getCount();
    return `BSD-${annee}-${String(count + 1).padStart(4, '0')}`;
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD Collectes
  // ────────────────────────────────────────────────────────────────
  async createCollecte(
    dto: CreateCollecteDto,
    tenantId: string,
    userId?: string,
  ): Promise<CollecteDechets> {
    const numero = await this.genererNumeroCollecte(tenantId);
    const collecte = this.collecteRepo.create({
      ...dto,
      numero,
      dateCollecte: new Date(dto.dateCollecte),
      statut: StatutCollecte.EN_STOCKAGE,
      tenantId,
      createdById: userId,
    });
    return this.collecteRepo.save(collecte);
  }

  async findAllCollectes(
    tenantId: string,
    filters: {
      categorie?: CategorieDechet;
      statut?: StatutCollecte;
      serviceProducteur?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: CollecteDechets[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.collecteRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId });

    if (filters.categorie) {
      qb.andWhere('c.categorie = :categorie', { categorie: filters.categorie });
    }
    if (filters.statut) {
      qb.andWhere('c.statut = :statut', { statut: filters.statut });
    }
    if (filters.serviceProducteur) {
      qb.andWhere('c.serviceProducteur = :sp', { sp: filters.serviceProducteur });
    }
    if (filters.search) {
      qb.andWhere(
        '(c.numero ILIKE :s OR c.serviceProducteur ILIKE :s OR c.uniteProducteur ILIKE :s OR c.agentRef ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('c.dateCollecte', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneCollecte(id: string, tenantId: string): Promise<CollecteDechets> {
    const c = await this.collecteRepo.findOne({ where: { id, tenantId } });
    if (!c) throw new NotFoundException(`Collecte ${id} introuvable`);
    return c;
  }

  async updateCollecte(
    id: string,
    dto: Partial<CreateCollecteDto>,
    tenantId: string,
  ): Promise<CollecteDechets> {
    const c = await this.findOneCollecte(id, tenantId);
    if (c.statut === StatutCollecte.ENLEVE || c.statut === StatutCollecte.INCINERE) {
      throw new BadRequestException(
        'Impossible de modifier une collecte déjà enlevée ou incinérée',
      );
    }
    const { dateCollecte, ...rest } = dto;
    Object.assign(c, rest);
    if (dateCollecte) c.dateCollecte = new Date(dateCollecte);
    return this.collecteRepo.save(c);
  }

  async removeCollecte(id: string, tenantId: string): Promise<{ deleted: true }> {
    const c = await this.findOneCollecte(id, tenantId);
    if (c.enlevementId) {
      throw new BadRequestException(
        'Impossible de supprimer une collecte rattachée à un enlèvement',
      );
    }
    await this.collecteRepo.remove(c);
    return { deleted: true };
  }

  /** Collectes prêtes à être enlevées (en stockage, non rattachées). */
  async findCollectesEnAttente(tenantId: string): Promise<CollecteDechets[]> {
    return this.collecteRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.statut = :statut', { statut: StatutCollecte.EN_STOCKAGE })
      .andWhere('c.enlevementId IS NULL')
      .orderBy('c.dateCollecte', 'ASC')
      .getMany();
  }

  /**
   * Alerte : collectes en stockage depuis plus de SEUIL_STOCKAGE_JOURS jours
   * et non encore enlevées (risque réglementaire).
   */
  async findCollectesStockageProlonge(tenantId: string): Promise<CollecteDechets[]> {
    const limite = new Date();
    limite.setDate(limite.getDate() - SEUIL_STOCKAGE_JOURS);
    return this.collecteRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.statut = :statut', { statut: StatutCollecte.EN_STOCKAGE })
      .andWhere('c.enlevementId IS NULL')
      .andWhere('c.dateCollecte <= :limite', { limite })
      .orderBy('c.dateCollecte', 'ASC')
      .getMany();
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD Enlèvements (regroupement type BSDASRI)
  // ────────────────────────────────────────────────────────────────
  async createEnlevement(
    dto: CreateEnlevementDto,
    tenantId: string,
    userId?: string,
  ): Promise<EnlevementDechets> {
    // Récupère et valide les collectes ciblées (scoping tenant).
    const collectes = await this.collecteRepo.find({
      where: { id: In(dto.collecteIds), tenantId },
    });
    if (collectes.length !== dto.collecteIds.length) {
      throw new BadRequestException(
        'Une ou plusieurs collectes sont introuvables pour ce tenant',
      );
    }
    const dejaRattachees = collectes.filter((c) => c.enlevementId);
    if (dejaRattachees.length > 0) {
      throw new BadRequestException(
        `Collectes déjà rattachées à un enlèvement : ${dejaRattachees
          .map((c) => c.numero)
          .join(', ')}`,
      );
    }

    const poidsTotal = collectes.reduce(
      (sum, c) => sum + Number(c.poidsKg ?? 0),
      0,
    );
    const bordereauNumero =
      dto.bordereauNumero ?? (await this.genererNumeroBordereau(tenantId));

    const enlevement = this.enlevementRepo.create({
      bordereauNumero,
      prestataire: dto.prestataire,
      dateEnlevement: new Date(dto.dateEnlevement),
      modeTraitement: dto.modeTraitement,
      poidsTotal,
      statut: StatutEnlevement.ENLEVE,
      observations: dto.observations,
      tenantId,
      createdById: userId,
    });
    const saved = await this.enlevementRepo.save(enlevement);

    // Rattache les collectes et passe leur statut à « enlevé ».
    await this.collecteRepo.update(
      { id: In(dto.collecteIds), tenantId },
      { enlevementId: saved.id, statut: StatutCollecte.ENLEVE },
    );

    return saved;
  }

  async findAllEnlevements(
    tenantId: string,
    filters: { statut?: StatutEnlevement; search?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: EnlevementDechets[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.enlevementRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId });

    if (filters.statut) {
      qb.andWhere('e.statut = :statut', { statut: filters.statut });
    }
    if (filters.search) {
      qb.andWhere('(e.bordereauNumero ILIKE :s OR e.prestataire ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    const [data, total] = await qb
      .orderBy('e.dateEnlevement', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneEnlevement(
    id: string,
    tenantId: string,
  ): Promise<EnlevementDechets & { collectes: CollecteDechets[] }> {
    const e = await this.enlevementRepo.findOne({ where: { id, tenantId } });
    if (!e) throw new NotFoundException(`Enlèvement ${id} introuvable`);
    const collectes = await this.collecteRepo.find({
      where: { enlevementId: id, tenantId },
      order: { dateCollecte: 'ASC' },
    });
    return { ...e, collectes };
  }

  async updateEnlevement(
    id: string,
    dto: Partial<CreateEnlevementDto>,
    tenantId: string,
  ): Promise<EnlevementDechets> {
    const e = await this.enlevementRepo.findOne({ where: { id, tenantId } });
    if (!e) throw new NotFoundException(`Enlèvement ${id} introuvable`);
    if (e.statut === StatutEnlevement.TRAITE) {
      throw new BadRequestException('Enlèvement déjà traité : modification interdite');
    }
    const { collecteIds, dateEnlevement, ...rest } = dto;
    Object.assign(e, rest);
    if (dateEnlevement) e.dateEnlevement = new Date(dateEnlevement);
    return this.enlevementRepo.save(e);
  }

  /** Clôture : certificat de destruction → statut traité/incinéré. */
  async traiterEnlevement(
    id: string,
    dto: TraiterEnlevementDto,
    tenantId: string,
  ): Promise<EnlevementDechets> {
    const e = await this.enlevementRepo.findOne({ where: { id, tenantId } });
    if (!e) throw new NotFoundException(`Enlèvement ${id} introuvable`);
    e.certificatDestruction = dto.certificatDestruction;
    e.dateTraitement = dto.dateTraitement ? new Date(dto.dateTraitement) : new Date();
    e.statut = StatutEnlevement.TRAITE;
    const saved = await this.enlevementRepo.save(e);

    await this.collecteRepo.update(
      { enlevementId: id, tenantId },
      { statut: StatutCollecte.INCINERE },
    );
    return saved;
  }

  async removeEnlevement(id: string, tenantId: string): Promise<{ deleted: true }> {
    const e = await this.enlevementRepo.findOne({ where: { id, tenantId } });
    if (!e) throw new NotFoundException(`Enlèvement ${id} introuvable`);
    if (e.statut === StatutEnlevement.TRAITE) {
      throw new BadRequestException('Enlèvement déjà traité : suppression interdite');
    }
    // Détache les collectes et les remet en stockage.
    await this.collecteRepo.update(
      { enlevementId: id, tenantId },
      { enlevementId: null, statut: StatutCollecte.EN_STOCKAGE },
    );
    await this.enlevementRepo.remove(e);
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<{
    totalCollectes: number;
    poidsTotalKg: number;
    poidsParCategorie: Record<string, number>;
    poidsParMois: Record<string, number>;
    parStatut: Record<string, number>;
    enAttenteEnlevement: number;
    poidsEnAttenteKg: number;
    stockageProlonge: number;
    enlevementsTotal: number;
    enlevementsATraiter: number;
  }> {
    const collectes = await this.collecteRepo.find({ where: { tenantId } });

    const poidsParCategorie: Record<string, number> = {};
    const poidsParMois: Record<string, number> = {};
    const parStatut: Record<string, number> = {};
    let poidsTotalKg = 0;

    for (const c of collectes) {
      const p = Number(c.poidsKg ?? 0);
      poidsTotalKg += p;
      poidsParCategorie[c.categorie] = (poidsParCategorie[c.categorie] ?? 0) + p;
      parStatut[c.statut] = (parStatut[c.statut] ?? 0) + 1;
      const d = new Date(c.dateCollecte);
      const moisCle = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      poidsParMois[moisCle] = (poidsParMois[moisCle] ?? 0) + p;
    }

    const round = (n: number) => Math.round(n * 1000) / 1000;
    for (const k of Object.keys(poidsParCategorie)) poidsParCategorie[k] = round(poidsParCategorie[k]);
    for (const k of Object.keys(poidsParMois)) poidsParMois[k] = round(poidsParMois[k]);

    const enAttente = collectes.filter(
      (c) => c.statut === StatutCollecte.EN_STOCKAGE && !c.enlevementId,
    );
    const poidsEnAttenteKg = round(
      enAttente.reduce((s, c) => s + Number(c.poidsKg ?? 0), 0),
    );
    const stockageProlonge = (await this.findCollectesStockageProlonge(tenantId)).length;

    const [enlevementsTotal, enlevementsATraiter] = await Promise.all([
      this.enlevementRepo.count({ where: { tenantId } }),
      this.enlevementRepo
        .createQueryBuilder('e')
        .where('e.tenantId = :tenantId', { tenantId })
        .andWhere('e.statut != :traite', { traite: StatutEnlevement.TRAITE })
        .getCount(),
    ]);

    return {
      totalCollectes: collectes.length,
      poidsTotalKg: round(poidsTotalKg),
      poidsParCategorie,
      poidsParMois,
      parStatut,
      enAttenteEnlevement: enAttente.length,
      poidsEnAttenteKg,
      stockageProlonge,
      enlevementsTotal,
      enlevementsATraiter,
    };
  }
}
