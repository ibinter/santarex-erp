import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Questionnaire,
  QuestionDef,
  TypeQuestion,
} from './entities/questionnaire.entity';
import {
  ReponseSatisfaction,
  ReponseItem,
} from './entities/reponse-satisfaction.entity';
import {
  CreateQuestionnaireDto,
  UpdateQuestionnaireDto,
  CreateReponseDto,
} from './dto/satisfaction.dto';

/** Tenant de démonstration seedé (aligné sur SeedService). */
const SEED_TENANT_ID = 'clinique-saint-joseph';

@Injectable()
export class SatisfactionService implements OnModuleInit {
  private readonly logger = new Logger(SatisfactionService.name);

  constructor(
    @InjectRepository(Questionnaire)
    private readonly questionnaireRepo: Repository<Questionnaire>,
    @InjectRepository(ReponseSatisfaction)
    private readonly reponseRepo: Repository<ReponseSatisfaction>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Seeder — un questionnaire type pour le tenant de démonstration
  // ────────────────────────────────────────────────────────────────
  async onModuleInit(): Promise<void> {
    try {
      const existing = await this.questionnaireRepo.count({
        where: { tenantId: SEED_TENANT_ID },
      });
      if (existing > 0) return;

      const questions: QuestionDef[] = [
        { id: 'accueil', libelle: 'Qualité de l\'accueil', type: TypeQuestion.NOTE_5 },
        { id: 'delai', libelle: 'Délai de prise en charge', type: TypeQuestion.NOTE_5 },
        { id: 'ecoute', libelle: 'Écoute et disponibilité du personnel soignant', type: TypeQuestion.NOTE_5 },
        { id: 'proprete', libelle: 'Propreté et confort des locaux', type: TypeQuestion.NOTE_5 },
        { id: 'information', libelle: 'Clarté des informations reçues', type: TypeQuestion.NOTE_5 },
        {
          id: 'motif',
          libelle: 'Motif principal de votre venue',
          type: TypeQuestion.CHOIX,
          options: ['Consultation', 'Hospitalisation', 'Urgences', 'Examen', 'Autre'],
        },
        { id: 'suggestion', libelle: 'Suggestions d\'amélioration', type: TypeQuestion.TEXTE },
      ];

      await this.questionnaireRepo.save(
        this.questionnaireRepo.create({
          tenantId: SEED_TENANT_ID,
          titre: 'Enquête de satisfaction patient',
          description:
            'Questionnaire type de satisfaction — accueil, soins, environnement et recommandation (NPS).',
          questions,
          echelleMax: 5,
          actif: true,
        }),
      );
      this.logger.log(
        `Questionnaire de satisfaction type seedé pour le tenant ${SEED_TENANT_ID}`,
      );
    } catch (err) {
      // Ne bloque jamais le démarrage (ex. table absente avant migration).
      this.logger.warn(
        `Seed du questionnaire de satisfaction ignoré : ${(err as Error).message}`,
      );
    }
  }

  // ────────────────────────────────────────────────────────────────
  // CRUD questionnaires
  // ────────────────────────────────────────────────────────────────
  async creerQuestionnaire(
    dto: CreateQuestionnaireDto,
    tenantId: string,
  ): Promise<Questionnaire> {
    const q = this.questionnaireRepo.create({
      tenantId,
      titre: dto.titre,
      description: dto.description ?? null,
      questions: (dto.questions as QuestionDef[]) ?? [],
      echelleMax: dto.echelleMax ?? 5,
      actif: dto.actif ?? true,
    });
    return this.questionnaireRepo.save(q);
  }

  async listerQuestionnaires(
    tenantId: string,
    actif?: boolean,
  ): Promise<Questionnaire[]> {
    const where: Record<string, unknown> = { tenantId };
    if (actif !== undefined) where.actif = actif;
    return this.questionnaireRepo.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  async getQuestionnaire(id: string, tenantId: string): Promise<Questionnaire> {
    const q = await this.questionnaireRepo.findOne({ where: { id, tenantId } });
    if (!q) throw new NotFoundException(`Questionnaire ${id} introuvable`);
    return q;
  }

  async majQuestionnaire(
    id: string,
    dto: UpdateQuestionnaireDto,
    tenantId: string,
  ): Promise<Questionnaire> {
    const q = await this.getQuestionnaire(id, tenantId);
    if (dto.titre !== undefined) q.titre = dto.titre;
    if (dto.description !== undefined) q.description = dto.description ?? null;
    if (dto.questions !== undefined) q.questions = dto.questions as QuestionDef[];
    if (dto.echelleMax !== undefined) q.echelleMax = dto.echelleMax;
    if (dto.actif !== undefined) q.actif = dto.actif;
    return this.questionnaireRepo.save(q);
  }

  async supprimerQuestionnaire(id: string, tenantId: string): Promise<{ deleted: boolean }> {
    const q = await this.getQuestionnaire(id, tenantId);
    await this.questionnaireRepo.remove(q);
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // Calcul du score global d'une réponse (ramené sur echelleMax)
  // ────────────────────────────────────────────────────────────────
  private calculerScore(
    questionnaire: Questionnaire,
    reponses: ReponseItem[],
  ): number | null {
    const parId = new Map(questionnaire.questions.map((q) => [q.id, q]));
    const notes: number[] = [];

    for (const r of reponses) {
      const def = parId.get(r.questionId);
      if (!def) continue;
      if (def.type !== TypeQuestion.NOTE_5 && def.type !== TypeQuestion.NOTE_10) {
        continue;
      }
      const brut = Number(r.valeur);
      if (!Number.isFinite(brut)) continue;
      const echelleQuestion = def.type === TypeQuestion.NOTE_10 ? 10 : 5;
      // Normalise chaque note sur [0..1] puis ramène sur l'échelle du questionnaire.
      notes.push((brut / echelleQuestion) * questionnaire.echelleMax);
    }

    if (notes.length === 0) return null;
    const moyenne = notes.reduce((a, b) => a + b, 0) / notes.length;
    return Math.round(moyenne * 100) / 100;
  }

  // ────────────────────────────────────────────────────────────────
  // Collecte des réponses
  // ────────────────────────────────────────────────────────────────
  async creerReponse(
    dto: CreateReponseDto,
    tenantId: string,
  ): Promise<ReponseSatisfaction> {
    const questionnaire = await this.getQuestionnaire(dto.questionnaireId, tenantId);
    if (!Array.isArray(dto.reponses)) {
      throw new BadRequestException('Le corps `reponses` doit être une liste.');
    }

    const reponses: ReponseItem[] = dto.reponses.map((r) => ({
      questionId: r.questionId,
      valeur: r.valeur ?? null,
    }));

    const scoreGlobal = this.calculerScore(questionnaire, reponses);

    const entity = this.reponseRepo.create({
      tenantId,
      questionnaireId: questionnaire.id,
      patientId: dto.patientId ?? null,
      serviceConcerne: dto.serviceConcerne ?? null,
      dateReponse: dto.dateReponse ? new Date(dto.dateReponse) : new Date(),
      reponses,
      scoreGlobal,
      commentaireLibre: dto.commentaireLibre ?? null,
      recommande: dto.recommande ?? null,
    });
    const saved = await this.reponseRepo.save(entity);
    this.logger.log(
      `Réponse de satisfaction enregistrée (questionnaire=${questionnaire.id}, score=${scoreGlobal ?? '—'}, tenant=${tenantId})`,
    );
    return saved;
  }

  async listerReponses(
    tenantId: string,
    filters: { questionnaireId?: string; serviceConcerne?: string; patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: ReponseSatisfaction[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 50 } = pagination;
    const qb = this.reponseRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId });

    if (filters.questionnaireId)
      qb.andWhere('r.questionnaireId = :qid', { qid: filters.questionnaireId });
    if (filters.serviceConcerne)
      qb.andWhere('r.serviceConcerne = :svc', { svc: filters.serviceConcerne });
    if (filters.patientId)
      qb.andWhere('r.patientId = :pid', { pid: filters.patientId });

    const [data, total] = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  // ────────────────────────────────────────────────────────────────
  // Analyse / stats — score moyen, NPS, moyenne par question/service, évolution
  // ────────────────────────────────────────────────────────────────
  private num(v: number | string | null | undefined): number | null {
    if (v === null || v === undefined) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }

  async getAnalyse(
    tenantId: string,
    filters: { questionnaireId?: string; serviceConcerne?: string } = {},
  ): Promise<{
    totalReponses: number;
    scoreMoyen: number | null;
    echelleMax: number;
    nps: number | null;
    tauxRecommandation: number | null;
    repondantsNps: number;
    parQuestion: Array<{ questionId: string; libelle: string; type: string; moyenne: number | null; nbReponses: number; repartition?: Record<string, number> }>;
    parService: Array<{ service: string; scoreMoyen: number | null; nbReponses: number; tauxRecommandation: number | null }>;
    evolution: Array<{ mois: string; scoreMoyen: number | null; nbReponses: number }>;
  }> {
    // Questionnaires du tenant (pour libellés / échelle).
    const questionnaires = await this.questionnaireRepo.find({ where: { tenantId } });
    const qById = new Map(questionnaires.map((q) => [q.id, q]));

    const qb = this.reponseRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId });
    if (filters.questionnaireId)
      qb.andWhere('r.questionnaireId = :qid', { qid: filters.questionnaireId });
    if (filters.serviceConcerne)
      qb.andWhere('r.serviceConcerne = :svc', { svc: filters.serviceConcerne });
    const reponses = await qb.getMany();

    const totalReponses = reponses.length;
    const echelleMax = filters.questionnaireId
      ? qById.get(filters.questionnaireId)?.echelleMax ?? 5
      : 5;

    // Score moyen global.
    const scores = reponses
      .map((r) => this.num(r.scoreGlobal as unknown as number))
      .filter((n): n is number => n !== null);
    const scoreMoyen =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null;

    // NPS / taux de recommandation.
    const avecReco = reponses.filter((r) => r.recommande !== null && r.recommande !== undefined);
    const repondantsNps = avecReco.length;
    const promoteurs = avecReco.filter((r) => r.recommande === true).length;
    const detracteurs = avecReco.filter((r) => r.recommande === false).length;
    const nps =
      repondantsNps > 0
        ? Math.round(((promoteurs - detracteurs) / repondantsNps) * 100)
        : null;
    const tauxRecommandation =
      repondantsNps > 0 ? Math.round((promoteurs / repondantsNps) * 100) : null;

    // Moyenne / répartition par question.
    const aggQuestion = new Map<
      string,
      { libelle: string; type: string; notes: number[]; repartition: Record<string, number> }
    >();
    for (const r of reponses) {
      const q = qById.get(r.questionnaireId);
      const defs = new Map((q?.questions ?? []).map((d) => [d.id, d]));
      for (const item of r.reponses ?? []) {
        const def = defs.get(item.questionId);
        if (!def) continue;
        if (!aggQuestion.has(item.questionId)) {
          aggQuestion.set(item.questionId, {
            libelle: def.libelle,
            type: def.type,
            notes: [],
            repartition: {},
          });
        }
        const bucket = aggQuestion.get(item.questionId)!;
        if (def.type === TypeQuestion.NOTE_5 || def.type === TypeQuestion.NOTE_10) {
          const n = this.num(item.valeur as number);
          if (n !== null) bucket.notes.push(n);
        } else if (def.type === TypeQuestion.OUI_NON || def.type === TypeQuestion.CHOIX) {
          const key = String(item.valeur);
          if (item.valeur !== null && item.valeur !== undefined && key !== '') {
            bucket.repartition[key] = (bucket.repartition[key] ?? 0) + 1;
          }
        }
      }
    }
    const parQuestion = Array.from(aggQuestion.entries()).map(([questionId, b]) => {
      const isNote = b.type === TypeQuestion.NOTE_5 || b.type === TypeQuestion.NOTE_10;
      const moyenne =
        isNote && b.notes.length > 0
          ? Math.round((b.notes.reduce((a, c) => a + c, 0) / b.notes.length) * 100) / 100
          : null;
      return {
        questionId,
        libelle: b.libelle,
        type: b.type,
        moyenne,
        nbReponses: isNote ? b.notes.length : Object.values(b.repartition).reduce((a, c) => a + c, 0),
        repartition: isNote ? undefined : b.repartition,
      };
    });

    // Par service.
    const aggService = new Map<string, { scores: number[]; reco: boolean[] }>();
    for (const r of reponses) {
      const svc = r.serviceConcerne ?? '—';
      if (!aggService.has(svc)) aggService.set(svc, { scores: [], reco: [] });
      const bucket = aggService.get(svc)!;
      const s = this.num(r.scoreGlobal as unknown as number);
      if (s !== null) bucket.scores.push(s);
      if (r.recommande !== null && r.recommande !== undefined) bucket.reco.push(r.recommande);
    }
    const parService = Array.from(aggService.entries()).map(([service, b]) => ({
      service,
      scoreMoyen:
        b.scores.length > 0
          ? Math.round((b.scores.reduce((a, c) => a + c, 0) / b.scores.length) * 100) / 100
          : null,
      nbReponses: b.scores.length,
      tauxRecommandation:
        b.reco.length > 0
          ? Math.round((b.reco.filter(Boolean).length / b.reco.length) * 100)
          : null,
    }));

    // Évolution mensuelle (12 derniers mois avec données).
    const aggMois = new Map<string, number[]>();
    for (const r of reponses) {
      const d = new Date(r.dateReponse ?? r.createdAt);
      const mois = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const s = this.num(r.scoreGlobal as unknown as number);
      if (!aggMois.has(mois)) aggMois.set(mois, []);
      if (s !== null) aggMois.get(mois)!.push(s);
    }
    const evolution = Array.from(aggMois.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mois, scores]) => ({
        mois,
        scoreMoyen:
          scores.length > 0
            ? Math.round((scores.reduce((a, c) => a + c, 0) / scores.length) * 100) / 100
            : null,
        nbReponses: scores.length,
      }));

    return {
      totalReponses,
      scoreMoyen,
      echelleMax,
      nps,
      tauxRecommandation,
      repondantsNps,
      parQuestion,
      parService,
      evolution,
    };
  }

  async getStats(tenantId: string): Promise<{
    questionnaires: number;
    questionnairesActifs: number;
    totalReponses: number;
    reponsesDuMois: number;
    scoreMoyen: number | null;
    nps: number | null;
    tauxRecommandation: number | null;
  }> {
    const [questionnaires, actifs, reponses] = await Promise.all([
      this.questionnaireRepo.count({ where: { tenantId } }),
      this.questionnaireRepo.count({ where: { tenantId, actif: true } }),
      this.reponseRepo.find({ where: { tenantId } }),
    ]);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const reponsesDuMois = reponses.filter(
      (r) => new Date(r.createdAt) >= debutMois,
    ).length;

    const scores = reponses
      .map((r) => this.num(r.scoreGlobal as unknown as number))
      .filter((n): n is number => n !== null);
    const scoreMoyen =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
        : null;

    const avecReco = reponses.filter((r) => r.recommande !== null && r.recommande !== undefined);
    const promoteurs = avecReco.filter((r) => r.recommande === true).length;
    const detracteurs = avecReco.filter((r) => r.recommande === false).length;
    const nps =
      avecReco.length > 0
        ? Math.round(((promoteurs - detracteurs) / avecReco.length) * 100)
        : null;
    const tauxRecommandation =
      avecReco.length > 0 ? Math.round((promoteurs / avecReco.length) * 100) : null;

    return {
      questionnaires,
      questionnairesActifs: actifs,
      totalReponses: reponses.length,
      reponsesDuMois,
      scoreMoyen,
      nps,
      tauxRecommandation,
    };
  }
}
