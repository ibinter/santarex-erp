import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  PocheSang,
  GroupeABO,
  Rhesus,
  StatutPoche,
  TypeProduitSanguin,
} from './entities/poche-sang.entity';
import { Transfusion } from './entities/transfusion.entity';
import { CreatePocheDto } from './dto/create-poche.dto';
import { CreateTransfusionDto } from './dto/create-transfusion.dto';
import { estCompatible, groupesCompatiblesPour } from './utils/compatibilite';

@Injectable()
export class BanqueSangService {
  constructor(
    @InjectRepository(PocheSang)
    private readonly pocheRepo: Repository<PocheSang>,
    @InjectRepository(Transfusion)
    private readonly transfusionRepo: Repository<Transfusion>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Génération de numéro unique par tenant
  // ────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const count = await this.pocheRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `POCHE-${seq}`;
  }

  /** Bascule les poches périmées (datePeremption < aujourd'hui) au statut perimee. */
  private async marquerPerimees(tenantId: string): Promise<void> {
    const today = new Date().toISOString().slice(0, 10);
    await this.pocheRepo
      .createQueryBuilder()
      .update(PocheSang)
      .set({ statut: StatutPoche.PERIMEE })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('statut = :dispo', { dispo: StatutPoche.DISPONIBLE })
      .andWhere('"datePeremption" < :today', { today })
      .execute();
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD Poches
  // ────────────────────────────────────────────────────────────────
  async createPoche(dto: CreatePocheDto, tenantId: string): Promise<PocheSang> {
    if (new Date(dto.datePeremption) <= new Date(dto.datePrelevement)) {
      throw new BadRequestException(
        'La date de péremption doit être postérieure à la date de prélèvement.',
      );
    }
    const numero = dto.numero?.trim() || (await this.genererNumero(tenantId));
    const existant = await this.pocheRepo.findOne({ where: { numero, tenantId } });
    if (existant) {
      throw new BadRequestException(`Une poche portant le numéro ${numero} existe déjà.`);
    }
    const poche = this.pocheRepo.create({
      ...dto,
      numero,
      datePrelevement: dto.datePrelevement as unknown as Date,
      datePeremption: dto.datePeremption as unknown as Date,
      statut: StatutPoche.DISPONIBLE,
      tenantId,
    });
    return this.pocheRepo.save(poche);
  }

  async findAllPoches(
    tenantId: string,
    filters: {
      groupe?: GroupeABO;
      rhesus?: Rhesus;
      typeProduit?: TypeProduitSanguin;
      statut?: StatutPoche;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: PocheSang[]; total: number; page: number; limit: number }> {
    await this.marquerPerimees(tenantId);
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.pocheRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId });

    if (filters.groupe) qb.andWhere('p.groupe = :groupe', { groupe: filters.groupe });
    if (filters.rhesus) qb.andWhere('p.rhesus = :rhesus', { rhesus: filters.rhesus });
    if (filters.typeProduit)
      qb.andWhere('p.typeProduit = :typeProduit', { typeProduit: filters.typeProduit });
    if (filters.statut) qb.andWhere('p.statut = :statut', { statut: filters.statut });
    if (filters.search)
      qb.andWhere('(p.numero ILIKE :s OR p.donneurRef ILIKE :s)', {
        s: `%${filters.search}%`,
      });

    qb.orderBy('p.datePeremption', 'ASC').skip(skip).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async findOnePoche(id: string, tenantId: string): Promise<PocheSang> {
    const poche = await this.pocheRepo.findOne({ where: { id, tenantId } });
    if (!poche) throw new NotFoundException('Poche de sang introuvable.');
    return poche;
  }

  async updatePoche(
    id: string,
    dto: Partial<CreatePocheDto>,
    tenantId: string,
  ): Promise<PocheSang> {
    const poche = await this.findOnePoche(id, tenantId);
    Object.assign(poche, dto);
    return this.pocheRepo.save(poche);
  }

  /** Change le statut d'une poche (ex : détruire, réserver). */
  async changerStatut(
    id: string,
    statut: StatutPoche,
    tenantId: string,
  ): Promise<PocheSang> {
    const poche = await this.findOnePoche(id, tenantId);
    if (poche.statut === StatutPoche.TRANSFUSEE) {
      throw new BadRequestException('Une poche déjà transfusée ne peut plus changer de statut.');
    }
    poche.statut = statut;
    return this.pocheRepo.save(poche);
  }

  // ────────────────────────────────────────────────────────────────
  // Recherche de poches compatibles pour un patient
  // ────────────────────────────────────────────────────────────────
  async findPochesCompatibles(
    groupePatient: GroupeABO,
    rhesusPatient: Rhesus,
    tenantId: string,
    typeProduit?: TypeProduitSanguin,
  ): Promise<PocheSang[]> {
    await this.marquerPerimees(tenantId);
    const combinaisons = groupesCompatiblesPour(groupePatient, rhesusPatient);

    const qb = this.pocheRepo
      .createQueryBuilder('p')
      .where('p.tenantId = :tenantId', { tenantId })
      .andWhere('p.statut = :statut', { statut: StatutPoche.DISPONIBLE });

    // Construit un OR sur les couples (groupe, rhesus) compatibles.
    const orClauses = combinaisons
      .map((_, i) => `(p.groupe = :g${i} AND p.rhesus = :r${i})`)
      .join(' OR ');
    const params: Record<string, string> = {};
    combinaisons.forEach((c, i) => {
      params[`g${i}`] = c.groupe;
      params[`r${i}`] = c.rhesus;
    });
    if (orClauses) qb.andWhere(`(${orClauses})`, params);

    if (typeProduit) qb.andWhere('p.typeProduit = :typeProduit', { typeProduit });

    qb.orderBy('p.datePeremption', 'ASC');
    return qb.getMany();
  }

  // ────────────────────────────────────────────────────────────────
  // Transfusions
  // ────────────────────────────────────────────────────────────────
  async findAllTransfusions(
    tenantId: string,
    filters: { patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Transfusion[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;
    const qb = this.transfusionRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId });
    if (filters.patientId)
      qb.andWhere('t.patientId = :patientId', { patientId: filters.patientId });
    qb.orderBy('t.date', 'DESC').skip(skip).take(limit);
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async enregistrerTransfusion(
    dto: CreateTransfusionDto,
    tenantId: string,
  ): Promise<Transfusion> {
    const poche = await this.findOnePoche(dto.pocheId, tenantId);

    if (poche.statut !== StatutPoche.DISPONIBLE && poche.statut !== StatutPoche.RESERVEE) {
      throw new BadRequestException(
        `La poche ${poche.numero} n'est pas disponible (statut : ${poche.statut}).`,
      );
    }
    if (new Date(poche.datePeremption) < new Date()) {
      throw new BadRequestException(`La poche ${poche.numero} est périmée.`);
    }

    const compatible = estCompatible(
      dto.groupePatient,
      dto.rhesusPatient,
      poche.groupe,
      poche.rhesus,
    );

    if (!compatible && !dto.forcer) {
      throw new BadRequestException(
        `INCOMPATIBILITÉ : le patient ${dto.groupePatient}${dto.rhesusPatient} ` +
          `ne peut pas recevoir une poche ${poche.groupe}${poche.rhesus}. ` +
          `Transfusion refusée.`,
      );
    }

    // Décrémente le stock : la poche passe au statut transfusee.
    poche.statut = StatutPoche.TRANSFUSEE;
    await this.pocheRepo.save(poche);

    const transfusion = this.transfusionRepo.create({
      patientId: dto.patientId,
      pocheId: poche.id,
      pocheNumero: poche.numero,
      date: new Date(),
      groupePatient: dto.groupePatient,
      rhesusPatient: dto.rhesusPatient,
      compatibiliteVerifiee: compatible,
      medecin: dto.medecin,
      indication: dto.indication,
      observations: dto.observations,
      tenantId,
    });
    return this.transfusionRepo.save(transfusion);
  }

  /** Enregistre une réaction transfusionnelle a posteriori. */
  async enregistrerReaction(
    id: string,
    reaction: string,
    tenantId: string,
  ): Promise<Transfusion> {
    const transfusion = await this.transfusionRepo.findOne({ where: { id, tenantId } });
    if (!transfusion) throw new NotFoundException('Transfusion introuvable.');
    transfusion.reactionTransfusionnelle = reaction;
    return this.transfusionRepo.save(transfusion);
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<{
    stockParGroupe: { groupe: string; rhesus: string; libelle: string; count: number }[];
    stockParType: { typeProduit: string; count: number }[];
    totalDisponible: number;
    prochesPeremption: PocheSang[];
    perimees: number;
    transfusionsTotal: number;
  }> {
    await this.marquerPerimees(tenantId);

    const disponibles = await this.pocheRepo.find({
      where: { tenantId, statut: StatutPoche.DISPONIBLE },
    });

    const mapGroupe = new Map<string, number>();
    const mapType = new Map<string, number>();
    for (const p of disponibles) {
      const kg = `${p.groupe}|${p.rhesus}`;
      mapGroupe.set(kg, (mapGroupe.get(kg) ?? 0) + 1);
      mapType.set(p.typeProduit, (mapType.get(p.typeProduit) ?? 0) + 1);
    }

    const stockParGroupe = Array.from(mapGroupe.entries()).map(([k, count]) => {
      const [groupe, rhesus] = k.split('|');
      return { groupe, rhesus, libelle: `${groupe}${rhesus}`, count };
    });
    const stockParType = Array.from(mapType.entries()).map(([typeProduit, count]) => ({
      typeProduit,
      count,
    }));

    // Poches proches de la péremption (7 jours).
    const today = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + 7);
    const prochesPeremption = await this.pocheRepo.find({
      where: {
        tenantId,
        statut: StatutPoche.DISPONIBLE,
        datePeremption: Between(
          today.toISOString().slice(0, 10) as unknown as Date,
          limite.toISOString().slice(0, 10) as unknown as Date,
        ),
      },
      order: { datePeremption: 'ASC' },
    });

    const perimees = await this.pocheRepo.count({
      where: { tenantId, statut: StatutPoche.PERIMEE },
    });
    const transfusionsTotal = await this.transfusionRepo.count({ where: { tenantId } });

    return {
      stockParGroupe,
      stockParType,
      totalDisponible: disponibles.length,
      prochesPeremption,
      perimees,
      transfusionsTotal,
    };
  }
}
