import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employe, StatutEmploye } from './entities/employe.entity';
import { Conge, StatutConge } from './entities/conge.entity';
import { BulletinPaie, StatutBulletin } from './entities/bulletin-paie.entity';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';
import { CreateCongeDto, ApprouverCongeDto } from './dto/create-conge.dto';
import { CreatePaieDto } from './dto/create-paie.dto';

/** Taux par défaut (Côte d'Ivoire, simplifiés) — surchargables par requête. */
const DEFAULT_TAUX_CNPS = 0.063;
const DEFAULT_TAUX_ITS = 0.015;

const round2 = (n: number) => Math.round(n * 100) / 100;

@Injectable()
export class RhService {
  constructor(
    @InjectRepository(Employe)
    private employeRepo: Repository<Employe>,
    @InjectRepository(Conge)
    private congeRepo: Repository<Conge>,
    @InjectRepository(BulletinPaie)
    private bulletinRepo: Repository<BulletinPaie>,
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  // ── Employés ────────────────────────────────────────────────────────────

  async genererMatricule(tenantId: string): Promise<string> {
    const prefix = 'EMP-';
    const dernier = await this.employeRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.matricule LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('e.matricule', 'DESC')
      .getOne();

    let sequence = 1;
    if (dernier) {
      const parts = dernier.matricule.split('-');
      const parsed = parseInt(parts[parts.length - 1], 10);
      if (!Number.isNaN(parsed)) sequence = parsed + 1;
    }
    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async createEmploye(dto: CreateEmployeDto, tenantId: string): Promise<Employe> {
    const matricule = await this.genererMatricule(tenantId);
    const employe = this.employeRepo.create({
      matricule,
      nom: dto.nom,
      prenom: dto.prenom,
      poste: dto.poste,
      departement: dto.departement,
      dateEmbauche: dto.dateEmbauche ? new Date(dto.dateEmbauche) : new Date(),
      typeContrat: dto.typeContrat,
      salaireBase: dto.salaireBase,
      statut: dto.statut ?? StatutEmploye.ACTIF,
      email: dto.email,
      telephone: dto.telephone,
      adresse: dto.adresse,
      tenantId,
    });
    return this.employeRepo.save(employe);
  }

  async updateEmploye(
    id: string,
    dto: UpdateEmployeDto,
    tenantId: string,
  ): Promise<Employe> {
    const employe = await this.findOneEmploye(id, tenantId);
    Object.assign(employe, {
      ...dto,
      dateEmbauche: dto.dateEmbauche
        ? new Date(dto.dateEmbauche)
        : employe.dateEmbauche,
    });
    return this.employeRepo.save(employe);
  }

  async findOneEmploye(id: string, tenantId: string): Promise<Employe> {
    const employe = await this.employeRepo.findOne({ where: { id, tenantId } });
    if (!employe) throw new NotFoundException(`Employé ${id} non trouvé`);
    return employe;
  }

  async findAllEmployes(
    tenantId: string,
    filters: { statut?: StatutEmploye; departement?: string; q?: string },
  ): Promise<Employe[]> {
    const qb = this.employeRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('e.statut = :statut', { statut: filters.statut });
    if (filters.departement)
      qb.andWhere('e.departement = :departement', { departement: filters.departement });
    if (filters.q) {
      qb.andWhere(
        '(LOWER(e.nom) LIKE :q OR LOWER(e.prenom) LIKE :q OR LOWER(e.poste) LIKE :q OR LOWER(e.matricule) LIKE :q OR LOWER(e.departement) LIKE :q)',
        { q: `%${filters.q.toLowerCase()}%` },
      );
    }

    const employes = await qb.orderBy('e.createdAt', 'DESC').getMany();

    // Marque les employés actuellement en congé (congé approuvé couvrant aujourd'hui).
    const enConge = await this.employeIdsEnConge(tenantId);
    return employes.map((e) => ({ ...e, enConge: enConge.has(e.id) })) as Employe[];
  }

  private async employeIdsEnConge(tenantId: string): Promise<Set<string>> {
    const today = new Date().toISOString().slice(0, 10);
    const rows = await this.congeRepo
      .createQueryBuilder('c')
      .select('c.employeId', 'employeId')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.statut = :statut', { statut: StatutConge.APPROUVE })
      .andWhere('c.dateDebut <= :today', { today })
      .andWhere('c.dateFin >= :today', { today })
      .getRawMany();
    return new Set(rows.map((r) => r.employeId));
  }

  // ── Congés ──────────────────────────────────────────────────────────────

  private calculerJours(debut: Date, fin: Date): number {
    const ms = fin.getTime() - debut.getTime();
    if (ms < 0) throw new BadRequestException('dateFin doit être postérieure à dateDebut');
    return Math.floor(ms / (24 * 3600 * 1000)) + 1;
  }

  async createConge(dto: CreateCongeDto, tenantId: string): Promise<Conge> {
    // Vérifie que l'employé appartient bien au tenant.
    await this.findOneEmploye(dto.employeId, tenantId);

    const debut = new Date(dto.dateDebut);
    const fin = new Date(dto.dateFin);
    const jours = this.calculerJours(debut, fin);

    const conge = this.congeRepo.create({
      employeId: dto.employeId,
      type: dto.type,
      dateDebut: debut,
      dateFin: fin,
      jours,
      motif: dto.motif,
      statut: StatutConge.DEMANDE,
      tenantId,
    });
    return this.congeRepo.save(conge);
  }

  async findAllConges(
    tenantId: string,
    filters: { employeId?: string; statut?: StatutConge },
  ): Promise<Conge[]> {
    const qb = this.congeRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.employe', 'employe')
      .where('c.tenantId = :tenantId', { tenantId });

    if (filters.employeId) qb.andWhere('c.employeId = :employeId', { employeId: filters.employeId });
    if (filters.statut) qb.andWhere('c.statut = :statut', { statut: filters.statut });

    return qb.orderBy('c.createdAt', 'DESC').getMany();
  }

  async approuverConge(
    id: string,
    dto: ApprouverCongeDto,
    tenantId: string,
    userId: string,
  ): Promise<Conge> {
    const conge = await this.congeRepo.findOne({ where: { id, tenantId } });
    if (!conge) throw new NotFoundException(`Congé ${id} non trouvé`);
    if (conge.statut !== StatutConge.DEMANDE) {
      throw new BadRequestException('Seules les demandes en attente peuvent être traitées');
    }
    const approuver = dto.approuver !== false;
    conge.statut = approuver ? StatutConge.APPROUVE : StatutConge.REFUSE;
    conge.approuveById = userId;
    conge.approuveAt = new Date();
    if (dto.motif) conge.motif = dto.motif;
    return this.congeRepo.save(conge);
  }

  // ── Paie ────────────────────────────────────────────────────────────────

  private computeBulletin(
    employe: Employe,
    mois: string,
    primes: number,
    retenues: number,
    tauxCNPS: number,
    tauxITS: number,
  ): Partial<BulletinPaie> {
    const base = Number(employe.salaireBase);
    const cotisationCNPS = round2(base * tauxCNPS);
    const impotITS = round2(base * tauxITS);
    const cotisations = round2(cotisationCNPS + impotITS);
    const netAPayer = round2(base + primes - retenues - cotisations);
    return {
      employeId: employe.id,
      mois,
      salaireBase: round2(base),
      primes: round2(primes),
      retenues: round2(retenues),
      cotisationCNPS,
      impotITS,
      cotisations,
      netAPayer,
      statut: StatutBulletin.BROUILLON,
      tenantId: employe.tenantId,
    };
  }

  async genererPaie(dto: CreatePaieDto, tenantId: string): Promise<BulletinPaie[]> {
    const primes = dto.primes ?? 0;
    const retenues = dto.retenues ?? 0;
    const tauxCNPS = dto.tauxCNPS ?? DEFAULT_TAUX_CNPS;
    const tauxITS = dto.tauxITS ?? DEFAULT_TAUX_ITS;

    // Cible : un employé précis, ou tous les employés actifs du tenant.
    let cibles: Employe[];
    if (dto.employeId) {
      cibles = [await this.findOneEmploye(dto.employeId, tenantId)];
    } else {
      cibles = await this.employeRepo.find({
        where: { tenantId, statut: StatutEmploye.ACTIF },
      });
    }
    if (cibles.length === 0) {
      throw new BadRequestException('Aucun employé éligible pour la génération de paie');
    }

    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(BulletinPaie);
      const resultats: BulletinPaie[] = [];

      for (const employe of cibles) {
        const existant = await repo.findOne({
          where: { tenantId, employeId: employe.id, mois: dto.mois },
        });
        const data = this.computeBulletin(
          employe,
          dto.mois,
          primes,
          retenues,
          tauxCNPS,
          tauxITS,
        );

        if (existant) {
          if (existant.statut === StatutBulletin.PAYE) {
            // Un bulletin déjà payé n'est pas régénéré.
            resultats.push(existant);
            continue;
          }
          Object.assign(existant, data);
          resultats.push(await repo.save(existant));
        } else {
          resultats.push(await repo.save(repo.create(data)));
        }
      }
      return resultats;
    });
  }

  async findAllPaie(
    tenantId: string,
    filters: { employeId?: string; mois?: string; statut?: StatutBulletin },
  ): Promise<BulletinPaie[]> {
    const qb = this.bulletinRepo
      .createQueryBuilder('b')
      .leftJoinAndSelect('b.employe', 'employe')
      .where('b.tenantId = :tenantId', { tenantId });

    if (filters.employeId) qb.andWhere('b.employeId = :employeId', { employeId: filters.employeId });
    if (filters.mois) qb.andWhere('b.mois = :mois', { mois: filters.mois });
    if (filters.statut) qb.andWhere('b.statut = :statut', { statut: filters.statut });

    return qb.orderBy('b.mois', 'DESC').addOrderBy('b.createdAt', 'DESC').getMany();
  }

  // ── Statistiques ──────────────────────────────────────────────────────────

  async getStats(tenantId: string) {
    const effectif = await this.employeRepo.count({
      where: { tenantId, statut: StatutEmploye.ACTIF },
    });

    const totalEmployes = await this.employeRepo.count({ where: { tenantId } });

    const masse = await this.employeRepo
      .createQueryBuilder('e')
      .select('COALESCE(SUM(e.salaireBase), 0)', 'total')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.statut = :statut', { statut: StatutEmploye.ACTIF })
      .getRawOne();

    const congesEnCours = (await this.employeIdsEnConge(tenantId)).size;

    const congesEnAttente = await this.congeRepo.count({
      where: { tenantId, statut: StatutConge.DEMANDE },
    });

    const nbDepartements = await this.employeRepo
      .createQueryBuilder('e')
      .select('COUNT(DISTINCT e.departement)', 'n')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.departement IS NOT NULL')
      .getRawOne();

    return {
      effectif,
      totalEmployes,
      masseSalariale: Number(masse.total),
      congesEnCours,
      congesEnAttente,
      nbDepartements: Number(nbDepartements.n),
    };
  }
}
