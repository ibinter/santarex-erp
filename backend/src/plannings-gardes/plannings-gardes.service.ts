import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Garde, StatutGarde, TypeGarde } from './entities/garde.entity';
import { User } from '../users/entities/user.entity';
import { CreateGardeDto } from './dto/create-garde.dto';
import { UpdateGardeDto } from './dto/update-garde.dto';
import { RemplacerGardeDto } from './dto/remplacer-garde.dto';

export interface GardeFilters {
  personnelRef?: string;
  service?: string;
  statut?: StatutGarde;
  typeGarde?: TypeGarde;
  date?: string;
}

export interface PeriodeFilters {
  debut: string; // YYYY-MM-DD (inclus)
  fin: string; // YYYY-MM-DD (inclus)
  service?: string;
  personnelRef?: string;
}

type GardeEnrichie = Garde & {
  personnel: { id: string; nom: string; prenom: string } | null;
  remplacant: { id: string; nom: string; prenom: string } | null;
};

/**
 * Deux gardes se chevauchent si, le même jour, leurs intervalles horaires se
 * recoupent. Les gardes de nuit (heureFin <= heureDebut) débordent sur le
 * lendemain : on les traite comme couvrant [debut, 24h) ce jour-là, ce qui
 * suffit à détecter les conflits usuels sans modéliser le passage minuit.
 */
function minutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}
function chevauche(aDeb: string, aFin: string, bDeb: string, bFin: string): boolean {
  const a1 = minutes(aDeb);
  const a2 = minutes(aFin) <= a1 ? 24 * 60 : minutes(aFin);
  const b1 = minutes(bDeb);
  const b2 = minutes(bFin) <= b1 ? 24 * 60 : minutes(bFin);
  return a1 < b2 && b1 < a2;
}

@Injectable()
export class PlanningsGardesService {
  private readonly logger = new Logger(PlanningsGardesService.name);

  constructor(
    @InjectRepository(Garde)
    private gardeRepo: Repository<Garde>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  // ── Enrichissement personnel (bulk, sans N+1) ────────────────────────────
  private async enrichir(records: Garde[], tenantId: string): Promise<GardeEnrichie[]> {
    if (records.length === 0) return [];
    const ids = [
      ...new Set(
        records
          .flatMap((r) => [r.personnelRef, r.remplacantRef])
          .filter(Boolean) as string[],
      ),
    ];
    const users = ids.length
      ? await this.userRepo.find({ where: { id: In(ids), tenantId } })
      : [];
    const map = new Map(users.map((u) => [u.id, u]));
    const toDto = (id?: string | null) => {
      const u = id ? map.get(id) : undefined;
      return u ? { id: u.id, nom: u.lastName, prenom: u.firstName } : null;
    };
    return records.map((r) => ({
      ...r,
      personnel: toDto(r.personnelRef),
      remplacant: toDto(r.remplacantRef),
    }));
  }

  // ── Détection de conflits ────────────────────────────────────────────────
  /**
   * Recense les gardes actives (non absentes/remplacées) du même personnel, le
   * même jour, dont l'horaire chevauche le créneau proposé.
   */
  async detecterConflits(
    personnelRef: string,
    date: string,
    heureDebut: string,
    heureFin: string,
    tenantId: string,
    excludeId?: string,
  ): Promise<Garde[]> {
    const memeJour = await this.gardeRepo.find({
      where: {
        personnelRef,
        date,
        tenantId,
        statut: In([StatutGarde.PLANIFIEE, StatutGarde.EFFECTUEE]),
      },
    });
    return memeJour.filter(
      (g) =>
        g.id !== excludeId &&
        chevauche(heureDebut, heureFin, g.heureDebut, g.heureFin),
    );
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  async create(dto: CreateGardeDto, tenantId: string, userId?: string) {
    const conflits = await this.detecterConflits(
      dto.personnelRef,
      dto.date,
      dto.heureDebut,
      dto.heureFin,
      tenantId,
    );
    if (conflits.length > 0) {
      throw new ConflictException(
        'Ce personnel a déjà une garde qui chevauche ce créneau.',
      );
    }
    const garde = this.gardeRepo.create({
      ...dto,
      notes: dto.notes ?? null,
      tenantId,
      createdById: userId,
    });
    return this.gardeRepo.save(garde);
  }

  async findAll(tenantId: string, filters: GardeFilters = {}) {
    const where: any = { tenantId };
    if (filters.personnelRef) where.personnelRef = filters.personnelRef;
    if (filters.service) where.service = filters.service;
    if (filters.statut) where.statut = filters.statut;
    if (filters.typeGarde) where.typeGarde = filters.typeGarde;
    if (filters.date) where.date = filters.date;

    const data = await this.gardeRepo.find({
      where,
      order: { date: 'ASC', heureDebut: 'ASC' },
    });
    return this.enrichir(data, tenantId);
  }

  /** Vue calendrier : toutes les gardes d'une période (hebdo/mensuelle). */
  async calendrier(tenantId: string, p: PeriodeFilters) {
    const where: any = {
      tenantId,
      date: Between(p.debut, p.fin),
    };
    if (p.service) where.service = p.service;
    if (p.personnelRef) where.personnelRef = p.personnelRef;

    const data = await this.gardeRepo.find({
      where,
      order: { date: 'ASC', heureDebut: 'ASC' },
    });
    return this.enrichir(data, tenantId);
  }

  async findOne(id: string, tenantId: string): Promise<GardeEnrichie> {
    const garde = await this.gardeRepo.findOne({ where: { id, tenantId } });
    if (!garde) throw new NotFoundException(`Garde ${id} introuvable`);
    return (await this.enrichir([garde], tenantId))[0];
  }

  async update(id: string, dto: UpdateGardeDto, tenantId: string) {
    const garde = await this.gardeRepo.findOne({ where: { id, tenantId } });
    if (!garde) throw new NotFoundException(`Garde ${id} introuvable`);

    const next = { ...garde, ...dto };
    // Revalide les conflits si le créneau ou le personnel change.
    if (dto.personnelRef || dto.date || dto.heureDebut || dto.heureFin) {
      const conflits = await this.detecterConflits(
        next.personnelRef,
        next.date,
        next.heureDebut,
        next.heureFin,
        tenantId,
        id,
      );
      if (conflits.length > 0) {
        throw new ConflictException(
          'Ce personnel a déjà une garde qui chevauche ce créneau.',
        );
      }
    }
    Object.assign(garde, dto);
    await this.gardeRepo.save(garde);
    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const res = await this.gardeRepo.delete({ id, tenantId });
    if (!res.affected) throw new NotFoundException(`Garde ${id} introuvable`);
    return { deleted: true, id };
  }

  // ── Statut & remplacement ────────────────────────────────────────────────
  async changerStatut(id: string, statut: StatutGarde, tenantId: string) {
    const garde = await this.gardeRepo.findOne({ where: { id, tenantId } });
    if (!garde) throw new NotFoundException(`Garde ${id} introuvable`);
    garde.statut = statut;
    await this.gardeRepo.save(garde);
    return this.findOne(id, tenantId);
  }

  async remplacer(id: string, dto: RemplacerGardeDto, tenantId: string) {
    const garde = await this.gardeRepo.findOne({ where: { id, tenantId } });
    if (!garde) throw new NotFoundException(`Garde ${id} introuvable`);

    // Le remplaçant ne doit pas déjà avoir une garde sur ce créneau.
    const conflits = await this.detecterConflits(
      dto.remplacantRef,
      garde.date,
      garde.heureDebut,
      garde.heureFin,
      tenantId,
    );
    if (conflits.length > 0) {
      throw new ConflictException(
        'Le remplaçant a déjà une garde qui chevauche ce créneau.',
      );
    }
    garde.remplacantRef = dto.remplacantRef;
    garde.statut = StatutGarde.REMPLACEE;
    if (dto.notes) garde.notes = dto.notes;
    await this.gardeRepo.save(garde);
    return this.findOne(id, tenantId);
  }

  // ── Statistiques ─────────────────────────────────────────────────────────
  async getStats(tenantId: string, refDate?: string) {
    const base = refDate ? new Date(refDate) : new Date();
    // Semaine ISO (lundi → dimanche) contenant refDate.
    const jour = (base.getDay() + 6) % 7; // 0 = lundi
    const lundi = new Date(base);
    lundi.setDate(base.getDate() - jour);
    const dimanche = new Date(lundi);
    dimanche.setDate(lundi.getDate() + 6);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);

    const semaine = await this.gardeRepo.find({
      where: { tenantId, date: Between(fmt(lundi), fmt(dimanche)) },
    });

    const parType: Record<string, number> = {};
    const parStatut: Record<string, number> = {};
    const parService: Record<string, number> = {};
    for (const g of semaine) {
      parType[g.typeGarde] = (parType[g.typeGarde] ?? 0) + 1;
      parStatut[g.statut] = (parStatut[g.statut] ?? 0) + 1;
      parService[g.service] = (parService[g.service] ?? 0) + 1;
    }

    const effectuees = parStatut[StatutGarde.EFFECTUEE] ?? 0;
    const absentes = parStatut[StatutGarde.ABSENTE] ?? 0;
    const closes = effectuees + absentes;
    // Taux de couverture = gardes honorées / gardes closes (effectuées+absentes).
    const tauxCouverture = closes > 0 ? Math.round((effectuees / closes) * 100) : 100;

    return {
      semaine: { debut: fmt(lundi), fin: fmt(dimanche) },
      totalSemaine: semaine.length,
      planifiees: parStatut[StatutGarde.PLANIFIEE] ?? 0,
      effectuees,
      absentes,
      remplacees: parStatut[StatutGarde.REMPLACEE] ?? 0,
      tauxCouverture,
      parType,
      parService: Object.entries(parService)
        .map(([service, count]) => ({ service, count }))
        .sort((a, b) => b.count - a.count),
    };
  }
}
