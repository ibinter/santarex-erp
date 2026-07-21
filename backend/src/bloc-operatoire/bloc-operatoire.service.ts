import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SalleOperation,
  StatutSalle,
} from './entities/salle-operation.entity';
import {
  Intervention,
  StatutIntervention,
} from './entities/intervention.entity';
import { CreateSalleDto } from './dto/create-salle.dto';
import { UpdateSalleDto } from './dto/update-salle.dto';
import { CreateInterventionDto } from './dto/create-intervention.dto';
import { ChangerStatutInterventionDto } from './dto/changer-statut-intervention.dto';

@Injectable()
export class BlocOperatoireService {
  constructor(
    @InjectRepository(SalleOperation)
    private readonly salleRepo: Repository<SalleOperation>,
    @InjectRepository(Intervention)
    private readonly interventionRepo: Repository<Intervention>,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  // Génération de numéro d'intervention
  // ─────────────────────────────────────────────────────────────────────────
  async genererNumeroIntervention(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.interventionRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `INT-${annee}-${seq}`;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gestion des salles
  // ─────────────────────────────────────────────────────────────────────────
  async createSalle(dto: CreateSalleDto, tenantId: string): Promise<SalleOperation> {
    const existing = await this.salleRepo.findOne({
      where: { nom: dto.nom, tenantId },
    });
    if (existing) {
      throw new BadRequestException(`Une salle nommée "${dto.nom}" existe déjà`);
    }
    const salle = this.salleRepo.create({ ...dto, tenantId });
    return this.salleRepo.save(salle);
  }

  async findAllSalles(tenantId: string): Promise<SalleOperation[]> {
    return this.salleRepo.find({
      where: { tenantId, estActive: true },
      order: { nom: 'ASC' },
    });
  }

  async findOneSalle(id: string, tenantId: string): Promise<SalleOperation> {
    const salle = await this.salleRepo.findOne({ where: { id, tenantId } });
    if (!salle) throw new NotFoundException(`Salle ${id} introuvable`);
    return salle;
  }

  async updateSalle(
    id: string,
    dto: UpdateSalleDto,
    tenantId: string,
  ): Promise<SalleOperation> {
    const salle = await this.findOneSalle(id, tenantId);
    if (dto.nom && dto.nom !== salle.nom) {
      const dup = await this.salleRepo.findOne({
        where: { nom: dto.nom, tenantId },
      });
      if (dup && dup.id !== id) {
        throw new BadRequestException(`Une salle nommée "${dto.nom}" existe déjà`);
      }
    }
    Object.assign(salle, dto);
    return this.salleRepo.save(salle);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Détection de conflit de salle (créneaux qui se chevauchent)
  // ─────────────────────────────────────────────────────────────────────────
  private async detecterConflitSalle(
    tenantId: string,
    salleId: string,
    debut: Date,
    dureeMin: number,
    ignorerInterventionId?: string,
  ): Promise<void> {
    const fin = new Date(debut.getTime() + dureeMin * 60000);

    const candidates = await this.interventionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.salleId = :salleId', { salleId })
      .andWhere('i.statut IN (:...statuts)', {
        statuts: [StatutIntervention.PROGRAMMEE, StatutIntervention.EN_COURS],
      })
      .getMany();

    for (const c of candidates) {
      if (ignorerInterventionId && c.id === ignorerInterventionId) continue;
      const cDebut = new Date(c.dateHeurePrevue);
      const cFin = new Date(cDebut.getTime() + c.dureeEstimee * 60000);
      // Chevauchement : début < finExistant ET finNouveau > débutExistant
      if (debut < cFin && fin > cDebut) {
        throw new BadRequestException(
          `Conflit de salle : l'intervention ${c.numero} occupe déjà ce créneau ` +
            `(${cDebut.toLocaleString('fr-FR')} → ${cFin.toLocaleString('fr-FR')})`,
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Gestion des interventions
  // ─────────────────────────────────────────────────────────────────────────
  async createIntervention(
    dto: CreateInterventionDto,
    tenantId: string,
    userId: string,
  ): Promise<Intervention> {
    // Vérifier que la salle existe
    const salle = await this.salleRepo.findOne({
      where: { id: dto.salleId, tenantId },
    });
    if (!salle) throw new NotFoundException(`Salle ${dto.salleId} introuvable`);
    if (salle.statut === StatutSalle.MAINTENANCE) {
      throw new BadRequestException(
        `La salle "${salle.nom}" est en maintenance et ne peut être programmée`,
      );
    }

    const debut = new Date(dto.dateHeurePrevue);
    await this.detecterConflitSalle(tenantId, dto.salleId, debut, dto.dureeEstimee);

    const numero = await this.genererNumeroIntervention(tenantId);
    const intervention = this.interventionRepo.create({
      numero,
      patientId: dto.patientId,
      chirurgienId: dto.chirurgienId,
      anesthesisteId: dto.anesthesisteId,
      salleId: dto.salleId,
      typeIntervention: dto.typeIntervention,
      dateHeurePrevue: debut,
      dureeEstimee: dto.dureeEstimee,
      urgence: dto.urgence ?? false,
      statut: StatutIntervention.PROGRAMMEE,
      tenantId,
      createdById: userId,
    });

    return this.interventionRepo.save(intervention);
  }

  async findAllInterventions(
    tenantId: string,
    filters: { statut?: StatutIntervention; salleId?: string; patientId?: string } = {},
  ): Promise<Intervention[]> {
    const qb = this.interventionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('i.statut = :statut', { statut: filters.statut });
    if (filters.salleId) qb.andWhere('i.salleId = :salleId', { salleId: filters.salleId });
    if (filters.patientId) qb.andWhere('i.patientId = :patientId', { patientId: filters.patientId });

    return qb.orderBy('i.dateHeurePrevue', 'ASC').getMany();
  }

  async findOneIntervention(id: string, tenantId: string): Promise<Intervention> {
    const intervention = await this.interventionRepo.findOne({
      where: { id, tenantId },
    });
    if (!intervention) throw new NotFoundException(`Intervention ${id} introuvable`);
    return intervention;
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Planning du jour (interventions + état des salles)
  // ─────────────────────────────────────────────────────────────────────────
  async getPlanningDuJour(tenantId: string, dateStr?: string): Promise<any> {
    const jour = dateStr ? new Date(dateStr) : new Date();
    const debutJour = new Date(jour);
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date(jour);
    finJour.setHours(23, 59, 59, 999);

    const [salles, interventions] = await Promise.all([
      this.findAllSalles(tenantId),
      this.interventionRepo
        .createQueryBuilder('i')
        .where('i.tenantId = :tenantId', { tenantId })
        .andWhere('i.dateHeurePrevue BETWEEN :debut AND :fin', {
          debut: debutJour,
          fin: finJour,
        })
        .andWhere('i.statut != :annulee', { annulee: StatutIntervention.ANNULEE })
        .orderBy('i.dateHeurePrevue', 'ASC')
        .getMany(),
    ]);

    return {
      date: debutJour.toISOString().split('T')[0],
      salles,
      interventions,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Changement de statut d'intervention (démarrer / terminer / annuler)
  // ─────────────────────────────────────────────────────────────────────────
  async changerStatut(
    id: string,
    dto: ChangerStatutInterventionDto,
    tenantId: string,
  ): Promise<Intervention> {
    const intervention = await this.findOneIntervention(id, tenantId);
    const salle = await this.salleRepo.findOne({
      where: { id: intervention.salleId, tenantId },
    });

    const transitions: Record<StatutIntervention, StatutIntervention[]> = {
      [StatutIntervention.PROGRAMMEE]: [
        StatutIntervention.EN_COURS,
        StatutIntervention.ANNULEE,
      ],
      [StatutIntervention.EN_COURS]: [StatutIntervention.TERMINEE],
      [StatutIntervention.TERMINEE]: [],
      [StatutIntervention.ANNULEE]: [],
    };

    if (
      intervention.statut !== dto.statut &&
      !transitions[intervention.statut].includes(dto.statut)
    ) {
      throw new BadRequestException(
        `Transition invalide : ${intervention.statut} → ${dto.statut}`,
      );
    }

    if (dto.statut === StatutIntervention.EN_COURS) {
      intervention.dateHeureDebut = new Date();
      intervention.statut = StatutIntervention.EN_COURS;
      if (salle) {
        salle.statut = StatutSalle.OCCUPEE;
        await this.salleRepo.save(salle);
      }
    } else if (dto.statut === StatutIntervention.TERMINEE) {
      intervention.dateHeureFin = new Date();
      intervention.statut = StatutIntervention.TERMINEE;
      if (dto.compteRendu) intervention.compteRendu = dto.compteRendu;
      if (salle) {
        salle.statut = StatutSalle.NETTOYAGE;
        await this.salleRepo.save(salle);
      }
    } else if (dto.statut === StatutIntervention.ANNULEE) {
      intervention.statut = StatutIntervention.ANNULEE;
      // Si la salle était occupée par cette intervention, la libérer
      if (salle && salle.statut === StatutSalle.OCCUPEE) {
        salle.statut = StatutSalle.DISPONIBLE;
        await this.salleRepo.save(salle);
      }
    }

    return this.interventionRepo.save(intervention);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Statistiques du bloc opératoire
  // ─────────────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);

    const [
      totalSalles,
      sallesDisponibles,
      sallesOccupees,
      sallesNettoyage,
      sallesMaintenance,
    ] = await Promise.all([
      this.salleRepo.count({ where: { tenantId, estActive: true } }),
      this.salleRepo.count({ where: { tenantId, estActive: true, statut: StatutSalle.DISPONIBLE } }),
      this.salleRepo.count({ where: { tenantId, estActive: true, statut: StatutSalle.OCCUPEE } }),
      this.salleRepo.count({ where: { tenantId, estActive: true, statut: StatutSalle.NETTOYAGE } }),
      this.salleRepo.count({ where: { tenantId, estActive: true, statut: StatutSalle.MAINTENANCE } }),
    ]);

    const enCours = await this.interventionRepo.count({
      where: { tenantId, statut: StatutIntervention.EN_COURS },
    });

    const programmeesJour = await this.interventionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.statut = :statut', { statut: StatutIntervention.PROGRAMMEE })
      .andWhere('i.dateHeurePrevue BETWEEN :debut AND :fin', {
        debut: debutJour,
        fin: finJour,
      })
      .getCount();

    // Durée moyenne des interventions programmées / en cours du jour
    const interventionsJour = await this.interventionRepo
      .createQueryBuilder('i')
      .where('i.tenantId = :tenantId', { tenantId })
      .andWhere('i.dateHeurePrevue BETWEEN :debut AND :fin', {
        debut: debutJour,
        fin: finJour,
      })
      .andWhere('i.statut != :annulee', { annulee: StatutIntervention.ANNULEE })
      .getMany();

    const dureeMoyenne =
      interventionsJour.length > 0
        ? Math.round(
            interventionsJour.reduce((acc, i) => acc + i.dureeEstimee, 0) /
              interventionsJour.length,
          )
        : 0;

    return {
      date: debutJour.toISOString().split('T')[0],
      salles: {
        total: totalSalles,
        disponibles: sallesDisponibles,
        occupees: sallesOccupees,
        nettoyage: sallesNettoyage,
        maintenance: sallesMaintenance,
      },
      interventions: {
        programmeesJour,
        enCours,
        dureeMoyenneMin: dureeMoyenne,
      },
    };
  }
}
