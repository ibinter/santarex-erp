import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { TypeAnalyse, CategorieAnalyse } from './entities/type-analyse.entity';
import { DemandeAnalyse, StatutPrelevement } from './entities/demande-analyse.entity';
import { ResultatAnalyse, StatutResultat, InterpretationResultat } from './entities/resultat-analyse.entity';
import { CreateDemandeAnalyseDto } from './dto/create-demande-analyse.dto';
import { SaisirTousResultatsDto } from './dto/saisir-resultats.dto';

@Injectable()
export class LaboratoireService {
  constructor(
    @InjectRepository(TypeAnalyse)
    private readonly typeAnalyseRepo: Repository<TypeAnalyse>,
    @InjectRepository(DemandeAnalyse)
    private readonly demandeRepo: Repository<DemandeAnalyse>,
    @InjectRepository(ResultatAnalyse)
    private readonly resultatRepo: Repository<ResultatAnalyse>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Génération numéro demande
  // ────────────────────────────────────────────────────────────────
  private async genererNumeroDemande(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.demandeRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(5, '0');
    return `LAB-${annee}-${seq}`;
  }

  // ────────────────────────────────────────────────────────────────
  // Types d'analyse (catalogue)
  // ────────────────────────────────────────────────────────────────
  async createTypeAnalyse(dto: Partial<TypeAnalyse>, tenantId: string): Promise<TypeAnalyse> {
    const type = this.typeAnalyseRepo.create({ ...dto, tenantId });
    return this.typeAnalyseRepo.save(type);
  }

  async findAllTypesAnalyse(
    tenantId: string,
    filters: { categorie?: CategorieAnalyse; search?: string } = {},
  ): Promise<TypeAnalyse[]> {
    const qb = this.typeAnalyseRepo
      .createQueryBuilder('t')
      .where('t.tenantId = :tenantId', { tenantId })
      .andWhere('t.estActif = true');

    if (filters.categorie) {
      qb.andWhere('t.categorie = :categorie', { categorie: filters.categorie });
    }
    if (filters.search) {
      qb.andWhere('(t.nom ILIKE :s OR t.code ILIKE :s)', { s: `%${filters.search}%` });
    }

    return qb.orderBy('t.categorie', 'ASC').addOrderBy('t.nom', 'ASC').getMany();
  }

  // ────────────────────────────────────────────────────────────────
  // Demandes d'analyse
  // ────────────────────────────────────────────────────────────────
  async creerDemande(
    dto: CreateDemandeAnalyseDto,
    tenantId: string,
    userId: string,
  ): Promise<DemandeAnalyse> {
    const numero = await this.genererNumeroDemande(tenantId);

    // Calcul date prévue résultats (délai max des analyses demandées)
    let delaiMax = 24;
    if (dto.analyses && dto.analyses.length > 0) {
      const types = await this.typeAnalyseRepo.findByIds(dto.analyses);
      if (types.length > 0) {
        delaiMax = Math.max(...types.map(t => t.delaiResultatsHeures));
      }
    }

    const datePrevue = new Date();
    datePrevue.setHours(datePrevue.getHours() + (dto.urgence ? Math.ceil(delaiMax / 2) : delaiMax));

    const demande = this.demandeRepo.create({
      ...dto,
      numero,
      dateHeureDemande: new Date(),
      datePrevueResultats: datePrevue,
      tenantId,
      createdById: userId,
    });

    return this.demandeRepo.save(demande);
  }

  async findAllDemandes(
    tenantId: string,
    filters: { patientId?: string; statut?: StatutPrelevement; urgence?: boolean; date?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: DemandeAnalyse[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.demandeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.patientId) qb.andWhere('d.patientId = :patientId', { patientId: filters.patientId });
    if (filters.statut) qb.andWhere('d.statutPrelevement = :statut', { statut: filters.statut });
    if (filters.urgence !== undefined) qb.andWhere('d.urgence = :urgence', { urgence: filters.urgence });
    if (filters.date) {
      const debut = new Date(filters.date);
      debut.setHours(0, 0, 0, 0);
      const fin = new Date(filters.date);
      fin.setHours(23, 59, 59, 999);
      qb.andWhere('d.dateHeureDemande BETWEEN :debut AND :fin', { debut, fin });
    }

    const [data, total] = await qb
      .orderBy('d.urgence', 'DESC')
      .addOrderBy('d.dateHeureDemande', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOneDemande(id: string, tenantId: string): Promise<DemandeAnalyse> {
    const demande = await this.demandeRepo.findOne({ where: { id, tenantId } });
    if (!demande) throw new NotFoundException(`Demande d\'analyse ${id} introuvable`);
    return demande;
  }

  async marquerPreleve(demandeId: string, tenantId: string, userId: string): Promise<DemandeAnalyse> {
    const demande = await this.findOneDemande(demandeId, tenantId);

    if (demande.statutPrelevement !== StatutPrelevement.ATTENTE_PRELEVEMENT) {
      throw new BadRequestException('Cette demande n\'est pas en attente de prélèvement');
    }

    demande.statutPrelevement = StatutPrelevement.PRELEVE;
    demande.dateHeurePrelevement = new Date();
    return this.demandeRepo.save(demande);
  }

  // ────────────────────────────────────────────────────────────────
  // Résultats
  // ────────────────────────────────────────────────────────────────
  async saisirResultats(
    demandeId: string,
    dto: SaisirTousResultatsDto,
    tenantId: string,
    biologisteId: string,
  ): Promise<ResultatAnalyse[]> {
    const demande = await this.findOneDemande(demandeId, tenantId);

    const resultats: ResultatAnalyse[] = [];

    for (const analyseDto of dto.analyses) {
      // Vérifier si un résultat existe déjà (mise à jour)
      let resultat = await this.resultatRepo.findOne({
        where: { demandeAnalyseId: demandeId, typeAnalyseId: analyseDto.typeAnalyseId, tenantId },
      });

      const estCritique = analyseDto.resultats.some(
        r => r.interpretation === InterpretationResultat.CRITIQUE,
      );

      if (resultat) {
        resultat.resultats = analyseDto.resultats as any;
        resultat.interpretation = analyseDto.interpretation;
        resultat.estCritique = estCritique;
        resultat.biologisteId = biologisteId;
      } else {
        resultat = this.resultatRepo.create({
          demandeAnalyseId: demandeId,
          patientId: demande.patientId,
          typeAnalyseId: analyseDto.typeAnalyseId,
          resultats: analyseDto.resultats as any,
          interpretation: analyseDto.interpretation,
          estCritique,
          biologisteId,
          tenantId,
        });
      }

      await this.resultatRepo.save(resultat);
      resultats.push(resultat);
    }

    // Passer la demande en statut "en_analyse"
    if (demande.statutPrelevement === StatutPrelevement.PRELEVE) {
      demande.statutPrelevement = StatutPrelevement.EN_ANALYSE;
      await this.demandeRepo.save(demande);
    }

    return resultats;
  }

  async validerResultats(
    demandeId: string,
    tenantId: string,
    biologisteId: string,
  ): Promise<{ demande: DemandeAnalyse; resultats: ResultatAnalyse[] }> {
    const demande = await this.findOneDemande(demandeId, tenantId);

    const resultats = await this.resultatRepo.find({
      where: { demandeAnalyseId: demandeId, tenantId },
    });

    if (resultats.length === 0) {
      throw new BadRequestException('Aucun résultat saisi pour cette demande');
    }

    // Valider tous les résultats
    const now = new Date();
    for (const r of resultats) {
      r.statut = StatutResultat.VALIDE;
      r.biologisteId = biologisteId;
      r.dateValidation = now;
      await this.resultatRepo.save(r);
    }

    // Fermer la demande
    demande.statutPrelevement = StatutPrelevement.TERMINE;
    await this.demandeRepo.save(demande);

    // Alerte résultats critiques (log — notification métier à brancher selon architecture)
    const critiqueCount = resultats.filter(r => r.estCritique).length;
    if (critiqueCount > 0) {
      console.warn(
        `[LABO] ALERTE CRITIQUE: demande ${demande.numero} — ${critiqueCount} résultat(s) critique(s). Médecin: ${demande.medecinId}`,
      );
    }

    return { demande, resultats };
  }

  async getResultatsPatient(
    patientId: string,
    tenantId: string,
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: ResultatAnalyse[]; total: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const [data, total] = await this.resultatRepo.findAndCount({
      where: { patientId, tenantId, statut: StatutResultat.VALIDE },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return { data, total };
  }

  // ────────────────────────────────────────────────────────────────
  // Stats du jour
  // ────────────────────────────────────────────────────────────────
  async getStatsDuJour(tenantId: string): Promise<any> {
    const debutJour = new Date();
    debutJour.setHours(0, 0, 0, 0);
    const finJour = new Date();
    finJour.setHours(23, 59, 59, 999);

    const demandesJour = await this.demandeRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.dateHeureDemande BETWEEN :debut AND :fin', { debut: debutJour, fin: finJour })
      .getMany();

    const totalJour = demandesJour.length;
    const urgentes = demandesJour.filter(d => d.urgence).length;
    const enAttente = demandesJour.filter(d =>
      [StatutPrelevement.ATTENTE_PRELEVEMENT, StatutPrelevement.PRELEVE, StatutPrelevement.EN_ANALYSE].includes(d.statutPrelevement),
    ).length;
    const terminees = demandesJour.filter(d => d.statutPrelevement === StatutPrelevement.TERMINE).length;

    const critiqueCount = await this.resultatRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.estCritique = true')
      .andWhere('r.createdAt BETWEEN :debut AND :fin', { debut: debutJour, fin: finJour })
      .getCount();

    return {
      date: new Date().toISOString().split('T')[0],
      demandesJour: totalJour,
      urgentes,
      enAttente,
      terminees,
      resultatsCritiques: critiqueCount,
    };
  }
}
