import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Equipement,
  EquipementCategorie,
  EquipementStatut,
} from './entities/equipement.entity';
import {
  InterventionMaintenance,
  InterventionType,
  InterventionStatut,
} from './entities/intervention-maintenance.entity';
import { CreateEquipementDto } from './dto/create-equipement.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';

@Injectable()
export class EquipementsService {
  constructor(
    @InjectRepository(Equipement)
    private readonly equipRepo: Repository<Equipement>,
    @InjectRepository(InterventionMaintenance)
    private readonly interventionRepo: Repository<InterventionMaintenance>,
  ) {}

  // ── Utilitaires ─────────────────────────────────────────────────
  private async genererCode(tenantId: string): Promise<string> {
    const count = await this.equipRepo.count({ where: { tenantId } });
    return `EQP-${String(count + 1).padStart(5, '0')}`;
  }

  private addDays(base: Date, jours: number): Date {
    const d = new Date(base);
    d.setDate(d.getDate() + jours);
    return d;
  }

  private toDateOnly(d: Date): string {
    return d.toISOString().split('T')[0];
  }

  // ── CRUD Équipements ────────────────────────────────────────────
  async createEquipement(dto: CreateEquipementDto, tenantId: string): Promise<Equipement> {
    const code = await this.genererCode(tenantId);
    const equip = this.equipRepo.create({
      ...dto,
      code,
      tenantId,
      dateAcquisition: dto.dateAcquisition ? new Date(dto.dateAcquisition) : undefined,
      dateProchaineMaintenance: dto.dateProchaineMaintenance
        ? new Date(dto.dateProchaineMaintenance)
        : undefined,
    });

    // Calcul automatique de la 1re échéance si périodicité fournie sans date
    if (
      !equip.dateProchaineMaintenance &&
      dto.periodiciteMaintenanceJours &&
      dto.periodiciteMaintenanceJours > 0
    ) {
      const base = equip.dateAcquisition ?? new Date();
      equip.dateProchaineMaintenance = this.addDays(base, dto.periodiciteMaintenanceJours);
    }

    return this.equipRepo.save(equip);
  }

  async findAll(
    tenantId: string,
    filters: { categorie?: EquipementCategorie; statut?: EquipementStatut; search?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Equipement[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.equipRepo.createQueryBuilder('e').where('e.tenantId = :tenantId', { tenantId });

    if (filters.categorie) qb.andWhere('e.categorie = :categorie', { categorie: filters.categorie });
    if (filters.statut) qb.andWhere('e.statut = :statut', { statut: filters.statut });
    if (filters.search) {
      qb.andWhere(
        '(e.nom ILIKE :s OR e.code ILIKE :s OR e.marque ILIKE :s OR e.modele ILIKE :s OR e.numeroSerie ILIKE :s OR e.localisation ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('e.nom', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<Equipement> {
    const equip = await this.equipRepo.findOne({ where: { id, tenantId } });
    if (!equip) throw new NotFoundException(`Équipement ${id} introuvable`);
    return equip;
  }

  async updateEquipement(
    id: string,
    dto: Partial<CreateEquipementDto>,
    tenantId: string,
  ): Promise<Equipement> {
    const equip = await this.findOne(id, tenantId);
    const { dateAcquisition, dateProchaineMaintenance, ...rest } = dto;
    Object.assign(equip, rest);
    if (dateAcquisition !== undefined)
      equip.dateAcquisition = dateAcquisition ? new Date(dateAcquisition) : null as any;
    if (dateProchaineMaintenance !== undefined)
      equip.dateProchaineMaintenance = dateProchaineMaintenance
        ? new Date(dateProchaineMaintenance)
        : (null as any);
    return this.equipRepo.save(equip);
  }

  async removeEquipement(id: string, tenantId: string): Promise<{ deleted: boolean }> {
    const equip = await this.findOne(id, tenantId);
    // Réforme logique plutôt que suppression physique (traçabilité OHADA)
    equip.statut = EquipementStatut.REFORME;
    await this.equipRepo.save(equip);
    return { deleted: true };
  }

  // ── Interventions de maintenance ────────────────────────────────
  async getInterventions(
    equipementId: string,
    tenantId: string,
  ): Promise<InterventionMaintenance[]> {
    await this.findOne(equipementId, tenantId); // garantit le scoping tenant
    return this.interventionRepo.find({
      where: { equipementId, tenantId },
      order: { date: 'DESC', createdAt: 'DESC' },
    });
  }

  async createIntervention(
    equipementId: string,
    dto: CreateInterventionDto,
    tenantId: string,
    userId?: string,
  ): Promise<InterventionMaintenance> {
    const equip = await this.findOne(equipementId, tenantId);
    const statut = dto.statut ?? InterventionStatut.TERMINEE;

    const intervention = this.interventionRepo.create({
      equipementId,
      type: dto.type,
      date: dto.date ? new Date(dto.date) : new Date(),
      description: dto.description,
      technicienRef: dto.technicienRef,
      prestataire: dto.prestataire,
      cout: dto.cout ?? 0,
      devise: dto.devise ?? 'XOF',
      resultat: dto.resultat,
      dureeIndispoHeures: dto.dureeIndispoHeures ?? 0,
      statut,
      prochaineDate: dto.prochaineDate ? new Date(dto.prochaineDate) : undefined,
      tenantId,
      createdById: userId,
    });
    const saved = await this.interventionRepo.save(intervention);

    // Transition de statut de l'équipement selon le cycle de vie
    if (statut === InterventionStatut.PLANIFIEE || statut === InterventionStatut.EN_COURS) {
      equip.statut = EquipementStatut.EN_MAINTENANCE;
    } else if (statut === InterventionStatut.TERMINEE) {
      // Intervention close → équipement remis en service (sauf réformé)
      if (equip.statut !== EquipementStatut.REFORME) {
        equip.statut = EquipementStatut.EN_SERVICE;
      }
      // Maintenance préventive terminée → recalcul de la prochaine échéance
      if (
        dto.type === InterventionType.PREVENTIVE &&
        equip.periodiciteMaintenanceJours &&
        equip.periodiciteMaintenanceJours > 0
      ) {
        const base = saved.date ?? new Date();
        equip.dateProchaineMaintenance =
          saved.prochaineDate ?? this.addDays(base, equip.periodiciteMaintenanceJours);
      } else if (saved.prochaineDate) {
        equip.dateProchaineMaintenance = saved.prochaineDate;
      }
    }
    await this.equipRepo.save(equip);

    return saved;
  }

  /** Signale une panne : équipement → en_panne (déclenche la maintenance curative). */
  async declarerPanne(
    id: string,
    tenantId: string,
    description?: string,
    userId?: string,
  ): Promise<Equipement> {
    const equip = await this.findOne(id, tenantId);
    equip.statut = EquipementStatut.EN_PANNE;
    await this.equipRepo.save(equip);

    await this.interventionRepo.save(
      this.interventionRepo.create({
        equipementId: id,
        type: InterventionType.CURATIVE,
        date: new Date(),
        description: description ?? 'Déclaration de panne',
        statut: InterventionStatut.PLANIFIEE,
        tenantId,
        createdById: userId,
      }),
    );
    return equip;
  }

  // ── Maintenances dues ───────────────────────────────────────────
  async getMaintenancesDues(tenantId: string, joursAvance = 0): Promise<Equipement[]> {
    const dateLimite = this.addDays(new Date(), joursAvance);
    return this.equipRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.dateProchaineMaintenance IS NOT NULL')
      .andWhere('e.dateProchaineMaintenance <= :dateLimite', {
        dateLimite: this.toDateOnly(dateLimite),
      })
      .andWhere('e.statut != :reforme', { reforme: EquipementStatut.REFORME })
      .orderBy('e.dateProchaineMaintenance', 'ASC')
      .getMany();
  }

  // ── Statistiques ────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const total = await this.equipRepo.count({ where: { tenantId } });
    const enService = await this.equipRepo.count({
      where: { tenantId, statut: EquipementStatut.EN_SERVICE },
    });
    const enPanne = await this.equipRepo.count({
      where: { tenantId, statut: EquipementStatut.EN_PANNE },
    });
    const enMaintenance = await this.equipRepo.count({
      where: { tenantId, statut: EquipementStatut.EN_MAINTENANCE },
    });
    const reforme = await this.equipRepo.count({
      where: { tenantId, statut: EquipementStatut.REFORME },
    });

    const maintenancesDues = (await this.getMaintenancesDues(tenantId)).length;

    // Taux de disponibilité = en service / (parc actif hors réformés)
    const parcActif = total - reforme;
    const tauxDisponibilite = parcActif > 0 ? Math.round((enService / parcActif) * 1000) / 10 : 0;

    const valeurParc = await this.equipRepo
      .createQueryBuilder('e')
      .select('SUM(e.valeurAcquisition)', 'valeur')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.statut != :reforme', { reforme: EquipementStatut.REFORME })
      .getRawOne();

    return {
      total,
      enService,
      enPanne,
      enMaintenance,
      reforme,
      maintenancesDues,
      tauxDisponibilite,
      valeurParcXOF: parseFloat(valeurParc?.valeur ?? '0'),
    };
  }
}
