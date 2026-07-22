import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  LotSterilisation,
  MethodeSterilisation,
  ResultatIndicateur,
  StatutLot,
} from './entities/lot-sterilisation.entity';
import { Instrument } from './entities/instrument.entity';
import { CreateLotDto } from './dto/create-lot.dto';
import { UpdateLotDto } from './dto/update-lot.dto';
import { ValiderCycleDto } from './dto/valider-cycle.dto';
import { UtiliserLotDto } from './dto/utiliser-lot.dto';
import { CreateInstrumentDto } from './dto/create-instrument.dto';

// Durée de validité par défaut de la stérilité (jours), selon la méthode.
const VALIDITE_DEFAUT_JOURS: Record<MethodeSterilisation, number> = {
  [MethodeSterilisation.AUTOCLAVE]: 180,
  [MethodeSterilisation.CHALEUR_SECHE]: 180,
  [MethodeSterilisation.CHIMIQUE]: 30,
};

@Injectable()
export class SterilisationService {
  constructor(
    @InjectRepository(LotSterilisation)
    private readonly lotRepo: Repository<LotSterilisation>,
    @InjectRepository(Instrument)
    private readonly instrumentRepo: Repository<Instrument>,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Numérotation auto : STE-AAAA-NNNN
  // ───────────────────────────────────────────────────────────────────────────
  async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.lotRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(4, '0');
    return `STE-${annee}-${seq}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CRUD lots
  // ───────────────────────────────────────────────────────────────────────────
  async createLot(
    dto: CreateLotDto,
    tenantId: string,
    userId: string,
  ): Promise<LotSterilisation> {
    const numero = await this.genererNumero(tenantId);
    const lot = this.lotRepo.create({
      numero,
      methode: dto.methode,
      contenu: dto.contenu,
      temperature: dto.temperature ?? null,
      dureeMin: dto.dureeMin ?? null,
      dateCycle: dto.dateCycle ? new Date(dto.dateCycle) : new Date(),
      operateurRef: dto.operateurRef ?? userId,
      statut: StatutLot.EN_COURS,
      observations: dto.observations ?? null,
      tenantId,
      createdById: userId,
    });
    return this.lotRepo.save(lot);
  }

  async findAllLots(
    tenantId: string,
    filters: { statut?: StatutLot; methode?: MethodeSterilisation } = {},
  ): Promise<LotSterilisation[]> {
    const qb = this.lotRepo
      .createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('l.statut = :statut', { statut: filters.statut });
    if (filters.methode) qb.andWhere('l.methode = :methode', { methode: filters.methode });

    return qb.orderBy('l.dateCycle', 'DESC').getMany();
  }

  async findOneLot(id: string, tenantId: string): Promise<LotSterilisation> {
    const lot = await this.lotRepo.findOne({ where: { id, tenantId } });
    if (!lot) throw new NotFoundException(`Lot de stérilisation ${id} introuvable`);
    return lot;
  }

  async updateLot(
    id: string,
    dto: UpdateLotDto,
    tenantId: string,
  ): Promise<LotSterilisation> {
    const lot = await this.findOneLot(id, tenantId);
    if (lot.statut !== StatutLot.EN_COURS) {
      throw new BadRequestException(
        'Seul un lot « en cours » peut être modifié.',
      );
    }
    if (dto.methode !== undefined) lot.methode = dto.methode;
    if (dto.contenu !== undefined) lot.contenu = dto.contenu;
    if (dto.temperature !== undefined) lot.temperature = dto.temperature;
    if (dto.dureeMin !== undefined) lot.dureeMin = dto.dureeMin;
    if (dto.dateCycle !== undefined) lot.dateCycle = new Date(dto.dateCycle);
    if (dto.operateurRef !== undefined) lot.operateurRef = dto.operateurRef;
    if (dto.observations !== undefined) lot.observations = dto.observations;
    return this.lotRepo.save(lot);
  }

  async removeLot(id: string, tenantId: string): Promise<{ deleted: true }> {
    const lot = await this.findOneLot(id, tenantId);
    if (lot.statut === StatutLot.UTILISE) {
      throw new BadRequestException(
        'Un lot déjà utilisé ne peut être supprimé (traçabilité).',
      );
    }
    await this.lotRepo.remove(lot);
    return { deleted: true };
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Validation d'un cycle : le résultat de l'indicateur détermine le statut
  // ───────────────────────────────────────────────────────────────────────────
  async validerCycle(
    id: string,
    dto: ValiderCycleDto,
    tenantId: string,
  ): Promise<LotSterilisation> {
    const lot = await this.findOneLot(id, tenantId);
    if (lot.statut !== StatutLot.EN_COURS) {
      throw new BadRequestException(
        `Le lot ${lot.numero} a déjà été validé (statut : ${lot.statut}).`,
      );
    }

    lot.resultatIndicateur = dto.resultatIndicateur;
    if (dto.observations !== undefined) lot.observations = dto.observations;

    if (dto.resultatIndicateur === ResultatIndicateur.CONFORME) {
      lot.statut = StatutLot.VALIDE;
      const jours = dto.dureeValiditeJours ?? VALIDITE_DEFAUT_JOURS[lot.methode];
      const peremption = new Date(lot.dateCycle);
      peremption.setDate(peremption.getDate() + jours);
      lot.datePeremptionSterilite = peremption;
    } else {
      // Non conforme → rejeté, blocage d'utilisation
      lot.statut = StatutLot.REJETE;
      lot.datePeremptionSterilite = null;
    }

    return this.lotRepo.save(lot);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Marquage « utilisé » (blocage si non conforme / rejeté / périmé)
  // ───────────────────────────────────────────────────────────────────────────
  async utiliserLot(
    id: string,
    dto: UtiliserLotDto,
    tenantId: string,
  ): Promise<LotSterilisation> {
    const lot = await this.findOneLot(id, tenantId);

    if (lot.statut === StatutLot.REJETE) {
      throw new BadRequestException(
        `Lot ${lot.numero} NON CONFORME : utilisation interdite.`,
      );
    }
    if (lot.statut === StatutLot.EN_COURS) {
      throw new BadRequestException(
        `Lot ${lot.numero} non validé : validez le cycle avant utilisation.`,
      );
    }
    if (lot.statut === StatutLot.UTILISE) {
      throw new BadRequestException(`Lot ${lot.numero} déjà utilisé.`);
    }
    if (
      lot.datePeremptionSterilite &&
      new Date(lot.datePeremptionSterilite).getTime() < Date.now()
    ) {
      throw new BadRequestException(
        `Lot ${lot.numero} PÉRIMÉ : stérilité expirée, re-stérilisation requise.`,
      );
    }

    lot.statut = StatutLot.UTILISE;
    lot.dateUtilisation = new Date();
    if (dto.utiliseParRef !== undefined) lot.utiliseParRef = dto.utiliseParRef;
    return this.lotRepo.save(lot);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Référentiel instruments / plateaux
  // ───────────────────────────────────────────────────────────────────────────
  async createInstrument(
    dto: CreateInstrumentDto,
    tenantId: string,
  ): Promise<Instrument> {
    const instrument = this.instrumentRepo.create({ ...dto, tenantId });
    return this.instrumentRepo.save(instrument);
  }

  async findAllInstruments(tenantId: string): Promise<Instrument[]> {
    return this.instrumentRepo.find({
      where: { tenantId, estActif: true },
      order: { nom: 'ASC' },
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Statistiques : cycles du jour, taux de conformité, lots périmés
  // ───────────────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);
    const now = new Date();

    const [
      cyclesJour,
      enCours,
      valides,
      rejetes,
      utilises,
      totalEvalues,
      conformes,
    ] = await Promise.all([
      this.lotRepo
        .createQueryBuilder('l')
        .where('l.tenantId = :tenantId', { tenantId })
        .andWhere('l.dateCycle BETWEEN :debut AND :fin', { debut: debutJour, fin: finJour })
        .getCount(),
      this.lotRepo.count({ where: { tenantId, statut: StatutLot.EN_COURS } }),
      this.lotRepo.count({ where: { tenantId, statut: StatutLot.VALIDE } }),
      this.lotRepo.count({ where: { tenantId, statut: StatutLot.REJETE } }),
      this.lotRepo.count({ where: { tenantId, statut: StatutLot.UTILISE } }),
      this.lotRepo
        .createQueryBuilder('l')
        .where('l.tenantId = :tenantId', { tenantId })
        .andWhere('l.resultatIndicateur IS NOT NULL')
        .getCount(),
      this.lotRepo.count({
        where: { tenantId, resultatIndicateur: ResultatIndicateur.CONFORME },
      }),
    ]);

    // Lots stérilisés mais dont la stérilité est périmée (encore en stock)
    const perimes = await this.lotRepo
      .createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.statut = :statut', { statut: StatutLot.VALIDE })
      .andWhere('l.datePeremptionSterilite IS NOT NULL')
      .andWhere('l.datePeremptionSterilite < :now', { now })
      .getCount();

    const tauxConformite =
      totalEvalues > 0 ? Math.round((conformes / totalEvalues) * 100) : 100;

    return {
      date: debutJour.toISOString().split('T')[0],
      cyclesJour,
      enCours,
      valides,
      rejetes,
      utilises,
      perimes,
      tauxConformite,
    };
  }

  // Lots dont la stérilité est périmée (utile pour alertes)
  async findLotsPerimes(tenantId: string): Promise<LotSterilisation[]> {
    return this.lotRepo.find({
      where: {
        tenantId,
        statut: StatutLot.VALIDE,
        datePeremptionSterilite: LessThan(new Date()),
      },
      order: { datePeremptionSterilite: 'ASC' },
    });
  }
}
