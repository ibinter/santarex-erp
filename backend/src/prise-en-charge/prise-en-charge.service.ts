import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Assureur } from './entities/assureur.entity';
import { BonPriseEnCharge, StatutBon } from './entities/bon-prise-en-charge.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateAssureurDto } from './dto/create-assureur.dto';
import { CreateBonDto } from './dto/create-bon.dto';
import { RepondreBonDto } from './dto/repondre-bon.dto';

@Injectable()
export class PriseEnChargeService {
  constructor(
    @InjectRepository(Assureur)
    private readonly assureurRepo: Repository<Assureur>,
    @InjectRepository(BonPriseEnCharge)
    private readonly bonRepo: Repository<BonPriseEnCharge>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Assureurs (CRUD)
  // ────────────────────────────────────────────────────────────────
  async createAssureur(dto: CreateAssureurDto, tenantId: string): Promise<Assureur> {
    const assureur = this.assureurRepo.create({ ...dto, tenantId });
    return this.assureurRepo.save(assureur);
  }

  async findAllAssureurs(
    tenantId: string,
    filters: { search?: string; actif?: boolean } = {},
  ): Promise<Assureur[]> {
    const qb = this.assureurRepo
      .createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId });

    if (filters.actif !== undefined) {
      qb.andWhere('a.actif = :actif', { actif: filters.actif });
    }
    if (filters.search) {
      qb.andWhere('a.nom ILIKE :s', { s: `%${filters.search}%` });
    }

    return qb.orderBy('a.nom', 'ASC').getMany();
  }

  async findOneAssureur(id: string, tenantId: string): Promise<Assureur> {
    const assureur = await this.assureurRepo.findOne({ where: { id, tenantId } });
    if (!assureur) throw new NotFoundException(`Assureur ${id} introuvable`);
    return assureur;
  }

  async updateAssureur(
    id: string,
    dto: Partial<CreateAssureurDto>,
    tenantId: string,
  ): Promise<Assureur> {
    const assureur = await this.findOneAssureur(id, tenantId);
    Object.assign(assureur, dto);
    return this.assureurRepo.save(assureur);
  }

  // ────────────────────────────────────────────────────────────────
  // Bons de prise en charge — numérotation
  // ────────────────────────────────────────────────────────────────
  private async genererNumeroBon(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.bonRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(4, '0');
    return `BPC-${annee}-${seq}`;
  }

  private calculerMontantCouvert(montantEstime: number, taux: number): number {
    const m = Number(montantEstime) || 0;
    const t = Number(taux) || 0;
    return Math.round(((m * t) / 100) * 100) / 100;
  }

  /**
   * Hydrate en bulk (aucune boucle N+1) `patient` et `assureur` sur une liste
   * de bons, en conservant `patientId`/`assureurId` bruts.
   */
  private async enrichirBons(
    bons: BonPriseEnCharge[],
    tenantId: string,
  ): Promise<any[]> {
    if (bons.length === 0) return [];

    const patientIds = [...new Set(bons.map((b) => b.patientId).filter(Boolean))];
    const assureurIds = [...new Set(bons.map((b) => b.assureurId).filter(Boolean))];

    const [patients, assureurs] = await Promise.all([
      patientIds.length
        ? this.patientRepo.find({ where: { id: In(patientIds), tenantId } })
        : Promise.resolve([] as Patient[]),
      assureurIds.length
        ? this.assureurRepo.find({ where: { id: In(assureurIds), tenantId } })
        : Promise.resolve([] as Assureur[]),
    ]);

    const pMap = new Map(patients.map((p) => [p.id, p]));
    const aMap = new Map(assureurs.map((a) => [a.id, a]));

    return bons.map((b) => {
      const p = b.patientId ? pMap.get(b.patientId) : undefined;
      const a = b.assureurId ? aMap.get(b.assureurId) : undefined;
      return {
        ...b,
        patient: p ? { id: p.id, nom: p.nom, prenom: p.prenom, ipp: p.ipp } : null,
        assureur: a ? { id: a.id, nom: a.nom, type: a.type } : null,
      };
    });
  }

  // ────────────────────────────────────────────────────────────────
  // Bons de prise en charge — CRUD
  // ────────────────────────────────────────────────────────────────
  async createBon(
    dto: CreateBonDto,
    tenantId: string,
    userId: string,
  ): Promise<BonPriseEnCharge> {
    // Vérifie assureur (scoping tenant) + récupère taux par défaut
    const assureur = await this.findOneAssureur(dto.assureurId, tenantId);

    const taux =
      dto.tauxCouverture !== undefined && dto.tauxCouverture !== null
        ? dto.tauxCouverture
        : Number(assureur.tauxCouvertureDefaut) || 0;

    const numero = await this.genererNumeroBon(tenantId);

    const bon = this.bonRepo.create({
      patientId: dto.patientId,
      assureurId: dto.assureurId,
      numeroAssure: dto.numeroAssure,
      prestation: dto.prestation,
      description: dto.description,
      montantEstime: dto.montantEstime,
      tauxCouverture: taux,
      montantCouvert: this.calculerMontantCouvert(dto.montantEstime, taux),
      statut: StatutBon.BROUILLON,
      notes: dto.notes,
      numero,
      tenantId,
      createdById: userId,
    });

    return this.bonRepo.save(bon);
  }

  async findAllBons(
    tenantId: string,
    filters: { patientId?: string; assureurId?: string; statut?: StatutBon } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.bonRepo
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId });

    if (filters.patientId) qb.andWhere('b.patientId = :patientId', { patientId: filters.patientId });
    if (filters.assureurId) qb.andWhere('b.assureurId = :assureurId', { assureurId: filters.assureurId });
    if (filters.statut) qb.andWhere('b.statut = :statut', { statut: filters.statut });

    const [data, total] = await qb
      .orderBy('b.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data: await this.enrichirBons(data, tenantId), total, page, limit };
  }

  async findOneBon(id: string, tenantId: string): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de prise en charge ${id} introuvable`);
    const [enriched] = await this.enrichirBons([bon], tenantId);
    return enriched;
  }

  async updateBon(
    id: string,
    dto: Partial<CreateBonDto>,
    tenantId: string,
  ): Promise<BonPriseEnCharge> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de prise en charge ${id} introuvable`);

    if (bon.statut !== StatutBon.BROUILLON) {
      throw new BadRequestException(
        'Seul un bon au statut brouillon peut être modifié',
      );
    }

    Object.assign(bon, dto);
    // Recalcule le montant couvert si montant ou taux ont changé
    bon.montantCouvert = this.calculerMontantCouvert(
      bon.montantEstime,
      bon.tauxCouverture,
    );
    return this.bonRepo.save(bon);
  }

  // ────────────────────────────────────────────────────────────────
  // Transitions de statut
  // ────────────────────────────────────────────────────────────────
  async envoyerBon(id: string, tenantId: string): Promise<BonPriseEnCharge> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de prise en charge ${id} introuvable`);

    if (bon.statut !== StatutBon.BROUILLON) {
      throw new BadRequestException(
        'Seul un bon au statut brouillon peut être envoyé',
      );
    }

    bon.statut = StatutBon.DEMANDE_ENVOYEE;
    bon.dateEnvoi = new Date();
    return this.bonRepo.save(bon);
  }

  async repondreBon(
    id: string,
    dto: RepondreBonDto,
    tenantId: string,
  ): Promise<BonPriseEnCharge> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de prise en charge ${id} introuvable`);

    if (bon.statut !== StatutBon.DEMANDE_ENVOYEE) {
      throw new BadRequestException(
        'La réponse ne peut être enregistrée que sur un bon dont la demande a été envoyée',
      );
    }

    bon.dateReponse = new Date();

    if (dto.accepte) {
      bon.statut = StatutBon.ACCEPTE;
      bon.numeroAutorisation = dto.numeroAutorisation ?? null;
      bon.dateValidite = dto.dateValidite ? new Date(dto.dateValidite) : null;
      bon.motifRefus = null;
    } else {
      bon.statut = StatutBon.REFUSE;
      bon.motifRefus = dto.motifRefus ?? null;
      bon.numeroAutorisation = null;
      bon.dateValidite = null;
    }

    return this.bonRepo.save(bon);
  }

  // ────────────────────────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const bons = await this.bonRepo
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId })
      .getMany();

    const parStatut: Record<string, number> = {
      brouillon: 0,
      demande_envoyee: 0,
      accepte: 0,
      refuse: 0,
      expire: 0,
    };
    for (const b of bons) {
      parStatut[b.statut] = (parStatut[b.statut] ?? 0) + 1;
    }

    const montantCouvertTotal = bons
      .filter((b) => b.statut === StatutBon.ACCEPTE)
      .reduce((acc, b) => acc + (Number(b.montantCouvert) || 0), 0);

    const nbAssureurs = await this.assureurRepo.count({
      where: { tenantId, actif: true },
    });

    return {
      totalBons: bons.length,
      parStatut,
      montantCouvertTotal,
      nbAssureursActifs: nbAssureurs,
    };
  }
}
