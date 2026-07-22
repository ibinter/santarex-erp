import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Deces, LieuDeces, SexeDefunt } from './entities/deces.entity';
import { CasierMorgue, StatutCasier } from './entities/casier-morgue.entity';
import { SejourMorgue, StatutSejourMorgue } from './entities/sejour-morgue.entity';
import { Patient } from '../patients/entities/patient.entity';
import { CreateDecesDto } from './dto/create-deces.dto';
import { UpdateDecesDto } from './dto/update-deces.dto';
import { CreateCasierDto } from './dto/create-casier.dto';
import { UpdateCasierDto } from './dto/update-casier.dto';
import { EntreeMorgueDto } from './dto/entree-morgue.dto';
import { RemiseCorpsDto } from './dto/remise-corps.dto';

@Injectable()
export class MorgueService {
  constructor(
    @InjectRepository(Deces)
    private readonly decesRepo: Repository<Deces>,
    @InjectRepository(CasierMorgue)
    private readonly casierRepo: Repository<CasierMorgue>,
    @InjectRepository(SejourMorgue)
    private readonly sejourRepo: Repository<SejourMorgue>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
  ) {}

  // ───────────────────────────────────────────────────────────────────────────
  // Génération de numéros
  // ───────────────────────────────────────────────────────────────────────────
  private async genererNumeroDeces(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.decesRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(4, '0');
    return `DEC-${annee}-${seq}`;
  }

  private async genererNumeroCertificat(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.decesRepo.count({
      where: { tenantId, certificatEmis: true },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `CERT-${annee}-${seq}`;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Décès (CRUD)
  // ───────────────────────────────────────────────────────────────────────────
  async createDeces(
    dto: CreateDecesDto,
    tenantId: string,
    userId: string,
  ): Promise<Deces> {
    // Si un patient est référencé, vérifier qu'il appartient bien au tenant
    if (dto.patientId) {
      const patient = await this.patientRepo.findOne({
        where: { id: dto.patientId, tenantId },
      });
      if (!patient) {
        throw new NotFoundException(`Patient ${dto.patientId} introuvable`);
      }
      // Éviter un double enregistrement de décès pour le même patient
      const existant = await this.decesRepo.findOne({
        where: { patientId: dto.patientId, tenantId },
      });
      if (existant) {
        throw new BadRequestException(
          `Un décès est déjà enregistré pour ce patient (${existant.numero})`,
        );
      }
    }

    const numero = await this.genererNumeroDeces(tenantId);
    const emettre = dto.emettreCertificat === true;

    const deces = this.decesRepo.create({
      numero,
      patientId: dto.patientId ?? null,
      defuntNom: dto.defuntNom,
      defuntPrenom: dto.defuntPrenom,
      defuntSexe: dto.defuntSexe ?? SexeDefunt.INDETERMINE,
      defuntAge: dto.defuntAge ?? null,
      dateHeureDeces: new Date(dto.dateHeureDeces),
      lieuDeces: dto.lieuDeces ?? LieuDeces.SERVICE,
      causeDeces: dto.causeDeces ?? null,
      medecinConstatantRef: dto.medecinConstatantRef ?? null,
      certificatEmis: emettre,
      numeroCertificat: emettre
        ? await this.genererNumeroCertificat(tenantId)
        : null,
      tenantId,
      createdById: userId,
    });

    return this.decesRepo.save(deces);
  }

  async findAllDeces(
    tenantId: string,
    filters: { lieuDeces?: LieuDeces; certificatEmis?: string; q?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: Deces[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.decesRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.lieuDeces) {
      qb.andWhere('d.lieuDeces = :lieuDeces', { lieuDeces: filters.lieuDeces });
    }
    if (filters.certificatEmis === 'true' || filters.certificatEmis === 'false') {
      qb.andWhere('d.certificatEmis = :ce', {
        ce: filters.certificatEmis === 'true',
      });
    }
    if (filters.q) {
      qb.andWhere(
        '(LOWER(d.defuntNom) LIKE :q OR LOWER(d.defuntPrenom) LIKE :q OR LOWER(d.numero) LIKE :q)',
        { q: `%${filters.q.toLowerCase()}%` },
      );
    }

    const [data, total] = await qb
      .orderBy('d.dateHeureDeces', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneDeces(id: string, tenantId: string): Promise<Deces> {
    const deces = await this.decesRepo.findOne({ where: { id, tenantId } });
    if (!deces) throw new NotFoundException(`Décès ${id} introuvable`);
    return deces;
  }

  async updateDeces(
    id: string,
    dto: UpdateDecesDto,
    tenantId: string,
  ): Promise<Deces> {
    const deces = await this.findOneDeces(id, tenantId);

    if (dto.defuntNom !== undefined) deces.defuntNom = dto.defuntNom;
    if (dto.defuntPrenom !== undefined) deces.defuntPrenom = dto.defuntPrenom;
    if (dto.defuntSexe !== undefined) deces.defuntSexe = dto.defuntSexe;
    if (dto.defuntAge !== undefined) deces.defuntAge = dto.defuntAge;
    if (dto.dateHeureDeces !== undefined)
      deces.dateHeureDeces = new Date(dto.dateHeureDeces);
    if (dto.lieuDeces !== undefined) deces.lieuDeces = dto.lieuDeces;
    if (dto.causeDeces !== undefined) deces.causeDeces = dto.causeDeces;
    if (dto.medecinConstatantRef !== undefined)
      deces.medecinConstatantRef = dto.medecinConstatantRef;

    return this.decesRepo.save(deces);
  }

  /** Émettre (ou ré-émettre) le certificat de décès. */
  async emettreCertificat(id: string, tenantId: string): Promise<Deces> {
    const deces = await this.findOneDeces(id, tenantId);
    if (deces.certificatEmis) {
      throw new BadRequestException(
        `Le certificat de décès est déjà émis (${deces.numeroCertificat})`,
      );
    }
    deces.certificatEmis = true;
    deces.numeroCertificat = await this.genererNumeroCertificat(tenantId);
    return this.decesRepo.save(deces);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Casiers (référentiel chambre froide)
  // ───────────────────────────────────────────────────────────────────────────
  async createCasier(dto: CreateCasierDto, tenantId: string): Promise<CasierMorgue> {
    const existing = await this.casierRepo.findOne({
      where: { numero: dto.numero, tenantId },
    });
    if (existing) {
      throw new BadRequestException(
        `Un casier avec le numéro "${dto.numero}" existe déjà`,
      );
    }
    const casier = this.casierRepo.create({ ...dto, tenantId });
    return this.casierRepo.save(casier);
  }

  async findAllCasiers(
    tenantId: string,
    filters: { statut?: StatutCasier } = {},
  ): Promise<CasierMorgue[]> {
    const qb = this.casierRepo
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId })
      .andWhere('c.estActif = true');

    if (filters.statut) {
      qb.andWhere('c.statut = :statut', { statut: filters.statut });
    }
    return qb.orderBy('c.numero', 'ASC').getMany();
  }

  async findCasiersLibres(tenantId: string): Promise<CasierMorgue[]> {
    return this.findAllCasiers(tenantId, { statut: StatutCasier.LIBRE });
  }

  async updateCasier(
    id: string,
    dto: UpdateCasierDto,
    tenantId: string,
  ): Promise<CasierMorgue> {
    const casier = await this.casierRepo.findOne({ where: { id, tenantId } });
    if (!casier) throw new NotFoundException(`Casier ${id} introuvable`);

    // Ne pas passer un casier occupé en libre/maintenance manuellement
    if (
      dto.statut &&
      dto.statut !== casier.statut &&
      casier.statut === StatutCasier.OCCUPE
    ) {
      throw new BadRequestException(
        `Le casier "${casier.numero}" est occupé : effectuez d'abord la remise du corps`,
      );
    }

    Object.assign(casier, dto);
    return this.casierRepo.save(casier);
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Séjours morgue (entrée / remise)
  // ───────────────────────────────────────────────────────────────────────────
  async entree(
    dto: EntreeMorgueDto,
    tenantId: string,
    userId: string,
  ): Promise<SejourMorgue> {
    const deces = await this.decesRepo.findOne({
      where: { id: dto.decesId, tenantId },
    });
    if (!deces) throw new NotFoundException(`Décès ${dto.decesId} introuvable`);

    // Vérifier que ce défunt n'est pas déjà en chambre froide
    const sejourActif = await this.sejourRepo.findOne({
      where: {
        decesId: dto.decesId,
        statut: StatutSejourMorgue.EN_CHAMBRE,
        tenantId,
      },
    });
    if (sejourActif) {
      throw new BadRequestException(
        `Le corps est déjà en chambre froide (séjour en cours)`,
      );
    }

    const casier = await this.casierRepo.findOne({
      where: { id: dto.casierId, tenantId },
    });
    if (!casier) throw new NotFoundException(`Casier ${dto.casierId} introuvable`);
    if (casier.statut !== StatutCasier.LIBRE) {
      throw new BadRequestException(
        `Le casier "${casier.numero}" n'est pas disponible (statut: ${casier.statut})`,
      );
    }

    const sejour = this.sejourRepo.create({
      decesId: dto.decesId,
      casierId: dto.casierId,
      dateEntree: dto.dateEntree ? new Date(dto.dateEntree) : new Date(),
      statut: StatutSejourMorgue.EN_CHAMBRE,
      tarifJournalier: dto.tarifJournalier ?? 0,
      tenantId,
      createdById: userId,
    });
    const saved = await this.sejourRepo.save(sejour);

    // Occuper le casier
    casier.statut = StatutCasier.OCCUPE;
    casier.sejourActuelId = saved.id;
    await this.casierRepo.save(casier);

    return saved;
  }

  /** Nombre de jours de conservation (arrondi au jour supérieur, min. 1). */
  private calculerJours(entree: Date, sortie: Date): number {
    const diffMs = sortie.getTime() - entree.getTime();
    const jours = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(1, jours);
  }

  async remise(
    id: string,
    dto: RemiseCorpsDto,
    tenantId: string,
  ): Promise<SejourMorgue> {
    const sejour = await this.sejourRepo.findOne({ where: { id, tenantId } });
    if (!sejour) throw new NotFoundException(`Séjour morgue ${id} introuvable`);
    if (sejour.statut !== StatutSejourMorgue.EN_CHAMBRE) {
      throw new BadRequestException(`Ce corps a déjà été remis`);
    }

    const dateSortie = dto.dateSortie ? new Date(dto.dateSortie) : new Date();
    const jours = this.calculerJours(new Date(sejour.dateEntree), dateSortie);
    const frais = parseFloat(
      (Number(sejour.tarifJournalier) * jours).toFixed(2),
    );

    sejour.dateSortie = dateSortie;
    sejour.statut = StatutSejourMorgue.REMIS;
    sejour.fraisConservation = frais;
    sejour.personneRemiseNom = dto.personneRemiseNom;
    sejour.personneRemiseLien = dto.personneRemiseLien ?? null;
    sejour.personneRemisePiece = dto.personneRemisePiece ?? null;
    sejour.agentRef = dto.agentRef ?? null;
    const saved = await this.sejourRepo.save(sejour);

    // Libérer le casier
    const casier = await this.casierRepo.findOne({
      where: { id: sejour.casierId, tenantId },
    });
    if (casier) {
      casier.statut = StatutCasier.LIBRE;
      casier.sejourActuelId = null;
      await this.casierRepo.save(casier);
    }

    return saved;
  }

  /**
   * Liste des séjours enrichis (décès + casier) — pas de N+1.
   */
  async findAllSejours(
    tenantId: string,
    filters: { statut?: StatutSejourMorgue } = {},
  ): Promise<any[]> {
    const qb = this.sejourRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId });
    if (filters.statut) {
      qb.andWhere('s.statut = :statut', { statut: filters.statut });
    }
    const sejours = await qb.orderBy('s.dateEntree', 'DESC').getMany();
    if (sejours.length === 0) return [];

    const decesIds = [...new Set(sejours.map((s) => s.decesId))];
    const casierIds = [...new Set(sejours.map((s) => s.casierId))];
    const [decesList, casiers] = await Promise.all([
      this.decesRepo.find({ where: { id: In(decesIds), tenantId } }),
      this.casierRepo.find({ where: { id: In(casierIds), tenantId } }),
    ]);
    const dMap = new Map(decesList.map((d) => [d.id, d]));
    const cMap = new Map(casiers.map((c) => [c.id, c]));

    return sejours.map((s) => {
      const d = dMap.get(s.decesId);
      const c = cMap.get(s.casierId);
      return {
        ...s,
        deces: d
          ? {
              id: d.id,
              numero: d.numero,
              defuntNom: d.defuntNom,
              defuntPrenom: d.defuntPrenom,
              dateHeureDeces: d.dateHeureDeces,
            }
          : null,
        casier: c ? { id: c.id, numero: c.numero } : null,
      };
    });
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Statistiques
  // ───────────────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const totalCasiers = await this.casierRepo.count({
      where: { tenantId, estActif: true },
    });
    const casiersOccupes = await this.casierRepo.count({
      where: { tenantId, statut: StatutCasier.OCCUPE },
    });
    const casiersLibres = await this.casierRepo.count({
      where: { tenantId, statut: StatutCasier.LIBRE },
    });
    const casiersMaintenance = await this.casierRepo.count({
      where: { tenantId, statut: StatutCasier.MAINTENANCE },
    });

    const corpsPresents = await this.sejourRepo.count({
      where: { tenantId, statut: StatutSejourMorgue.EN_CHAMBRE },
    });

    // Décès du mois courant
    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const decesMois = await this.decesRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.dateHeureDeces >= :debutMois', { debutMois })
      .getCount();

    const totalDeces = await this.decesRepo.count({ where: { tenantId } });
    const certificatsEmis = await this.decesRepo.count({
      where: { tenantId, certificatEmis: true },
    });

    const tauxOccupation =
      totalCasiers > 0
        ? parseFloat(((casiersOccupes / totalCasiers) * 100).toFixed(1))
        : 0;

    return {
      date: new Date().toISOString().split('T')[0],
      casiers: {
        total: totalCasiers,
        occupes: casiersOccupes,
        libres: casiersLibres,
        maintenance: casiersMaintenance,
        tauxOccupationPct: tauxOccupation,
      },
      corpsPresents,
      deces: {
        total: totalDeces,
        duMois: decesMois,
        certificatsEmis,
      },
    };
  }
}
