import {
  Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ParcoursFormation } from './entities/parcours-formation.entity';
import { RessourceFormation } from './entities/ressource-formation.entity';
import { ProgressionFormation } from './entities/progression-formation.entity';
import {
  ParcoursCategorie, ParcoursNiveau, RessourceType, ProgressionStatut,
  PARCOURS_CATEGORIE_ORDRE, PARCOURS_CATEGORIE_LABEL,
} from './academie.enums';
import { CreateParcoursDto, UpdateParcoursDto } from './dto/parcours.dto';
import { CreateRessourceDto, UpdateRessourceDto } from './dto/ressource.dto';
import { ReponseQuizDto } from './dto/quiz.dto';
import {
  QUIZ_SEEDS, QuizContenu, QuizPublic, QuizResultat, QuizCorrectionQuestion,
} from './academie.quiz';

/**
 * Ressource « publique » exposée au client : identique à `RessourceFormation`
 * mais SANS le contenu brut du quiz (`quizJson`, qui contient les bonnes
 * réponses). Un simple compteur `quizNombreQuestions` est fourni à la place.
 */
export type RessourcePublique = Omit<RessourceFormation, 'quizJson'> & {
  quizNombreQuestions: number | null;
};

/**
 * Service de l'Académie / Formation SANTAREX.
 *
 * - CRUD parcours & ressources (réservé admin via le controller).
 * - Listing publié par catégorie (contenu global + contenu du tenant courant).
 * - Suivi de progression par utilisateur (marquer consulté / terminé).
 * - Statistiques de progression.
 * - Seed idempotent de la STRUCTURE des catégories au démarrage.
 *
 * RÈGLE CDC : jamais de fausse vidéo / fausse URL. Le contenu de démo est créé
 * avec `estPublie=false` et/ou `contenuDisponible=false` (« Bientôt disponible »).
 */
@Injectable()
export class AcademieService implements OnModuleInit {
  private readonly logger = new Logger(AcademieService.name);

  constructor(
    @InjectRepository(ParcoursFormation)
    private readonly parcoursRepo: Repository<ParcoursFormation>,
    @InjectRepository(RessourceFormation)
    private readonly ressourceRepo: Repository<RessourceFormation>,
    @InjectRepository(ProgressionFormation)
    private readonly progressionRepo: Repository<ProgressionFormation>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedStructure();
      await this.seedQuizzes();
    } catch (e) {
      // Le seed ne doit jamais empêcher le démarrage (ex. table absente en dev).
      this.logger.warn(`Seed Académie ignoré: ${(e as Error).message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  HELPERS
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Retire le contenu brut du quiz (`quizJson`, avec les bonnes réponses) avant
   * exposition au client et ajoute un compteur `quizNombreQuestions`.
   */
  private sanitizeRessource(r: RessourceFormation): RessourcePublique {
    const { quizJson, ...reste } = r;
    return {
      ...reste,
      quizNombreQuestions: quizJson?.questions?.length ?? null,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SEED — structure idempotente des catégories (contenu global, éditeur)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Crée, une seule fois, un parcours global de structure par catégorie avec
   * quelques ressources de démonstration HONNÊTES (contenu non disponible :
   * badge « Bientôt disponible »). Idempotent : on ne recrée pas un parcours
   * de structure déjà présent (repéré par titre + tenantId NULL).
   */
  private async seedStructure(): Promise<void> {
    const structure: Array<{
      categorie: ParcoursCategorie;
      niveau: ParcoursNiveau;
      description: string;
      ressources: Array<{ type: RessourceType; titre: string; description: string; duree?: number; moduleAssocie?: string }>;
    }> = [
      {
        categorie: ParcoursCategorie.DEMARRAGE,
        niveau: ParcoursNiveau.DEBUTANT,
        description: 'Prise en main de SANTAREX : connexion, navigation et premiers réflexes.',
        ressources: [
          { type: RessourceType.VIDEO, titre: 'Première connexion et découverte du tableau de bord', description: 'Visite guidée de l\'interface principale.', duree: 6, moduleAssocie: 'dashboard' },
          { type: RessourceType.DOCUMENT, titre: 'Guide de démarrage rapide (PDF)', description: 'Les étapes essentielles pour bien commencer.', duree: 10 },
          { type: RessourceType.QUIZ, titre: 'Quiz : suis-je prêt à démarrer ?', description: 'Validez vos acquis de base.', duree: 5 },
        ],
      },
      {
        categorie: ParcoursCategorie.ADMINISTRATION,
        niveau: ParcoursNiveau.INTERMEDIAIRE,
        description: 'Gérer les utilisateurs, les rôles et les paramètres de l\'établissement.',
        ressources: [
          { type: RessourceType.VIDEO, titre: 'Créer et gérer les comptes utilisateurs', description: 'Rôles, permissions et bonnes pratiques.', duree: 8, moduleAssocie: 'utilisateurs' },
          { type: RessourceType.DOCUMENT, titre: 'Matrice des rôles et permissions', description: 'Référence des droits par profil.', duree: 12 },
        ],
      },
      {
        categorie: ParcoursCategorie.MODULES,
        niveau: ParcoursNiveau.DEBUTANT,
        description: 'Maîtriser les modules métier : patients, consultations, pharmacie, laboratoire.',
        ressources: [
          { type: RessourceType.VIDEO, titre: 'Le dossier patient de A à Z', description: 'Création, recherche et DME.', duree: 9, moduleAssocie: 'patients' },
          { type: RessourceType.VIDEO, titre: 'Consultations : le wizard en 5 étapes', description: 'Réaliser une consultation complète.', duree: 7, moduleAssocie: 'consultations' },
          { type: RessourceType.DOCUMENT, titre: 'Aide-mémoire pharmacie & laboratoire', description: 'Flux de travail au quotidien.', duree: 10, moduleAssocie: 'pharmacie' },
        ],
      },
      {
        categorie: ParcoursCategorie.FINANCE,
        niveau: ParcoursNiveau.INTERMEDIAIRE,
        description: 'Facturation, caisse et comptabilité au sein de SANTAREX.',
        ressources: [
          { type: RessourceType.VIDEO, titre: 'De la facture à l\'encaissement', description: 'Cycle complet en caisse.', duree: 8, moduleAssocie: 'facturation' },
          { type: RessourceType.DOCUMENT, titre: 'Comprendre les états comptables', description: 'Lecture des rapports financiers.', duree: 14, moduleAssocie: 'comptabilite' },
        ],
      },
      {
        categorie: ParcoursCategorie.MOBILE,
        niveau: ParcoursNiveau.DEBUTANT,
        description: 'Utiliser SANTAREX en mobilité (application PWA installable).',
        ressources: [
          { type: RessourceType.VIDEO, titre: 'Installer et utiliser l\'application mobile (PWA)', description: 'Installation et usage hors-ligne.', duree: 5, moduleAssocie: 'mobile' },
        ],
      },
      {
        categorie: ParcoursCategorie.SECURITE,
        niveau: ParcoursNiveau.AVANCE,
        description: 'Sécurité des données, confidentialité et conformité.',
        ressources: [
          { type: RessourceType.DOCUMENT, titre: 'Bonnes pratiques de sécurité et de mots de passe', description: 'Protéger les données patients.', duree: 11 },
          { type: RessourceType.QUIZ, titre: 'Quiz sécurité & confidentialité', description: 'Testez vos réflexes.', duree: 6 },
        ],
      },
      {
        categorie: ParcoursCategorie.NOUVEAUTES,
        niveau: ParcoursNiveau.DEBUTANT,
        description: 'Découvrir les dernières fonctionnalités et évolutions de SANTAREX.',
        ressources: [
          { type: RessourceType.DOCUMENT, titre: 'Notes de version — dernières nouveautés', description: 'Ce qui a changé récemment.', duree: 8 },
        ],
      },
    ];

    let created = 0;
    for (const [i, bloc] of structure.entries()) {
      const titre = `Parcours ${PARCOURS_CATEGORIE_LABEL[bloc.categorie]}`;
      const existe = await this.parcoursRepo.findOne({
        where: { titre, tenantId: IsNull() },
      });
      if (existe) continue;

      // Parcours de structure PUBLIÉ (la structure est réelle) mais dont les
      // ressources ne portent AUCUNE URL et sont marquées « bientôt disponible ».
      const parcours = await this.parcoursRepo.save(this.parcoursRepo.create({
        titre,
        description: bloc.description,
        categorie: bloc.categorie,
        niveau: bloc.niveau,
        ordre: i,
        estPublie: true,
        tenantId: null,
      }));

      for (const [j, r] of bloc.ressources.entries()) {
        await this.ressourceRepo.save(this.ressourceRepo.create({
          parcoursId: parcours.id,
          type: r.type,
          titre: r.titre,
          description: r.description,
          duree: r.duree ?? null,
          url: null,                 // AUCUNE fausse URL
          miniatureUrl: null,
          moduleAssocie: r.moduleAssocie ?? null,
          langue: 'fr',
          versionCompatible: null,
          ordre: j,
          estPublie: true,
          contenuDisponible: false,  // « Bientôt disponible » — honnête
        }));
      }
      created += 1;
    }

    if (created > 0) {
      this.logger.log(`Structure Académie initialisée: ${created} parcours globaux créés (contenu « bientôt disponible », aucune fausse vidéo).`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SEED — quiz RÉELS (contenu pédagogique authentique, autorisé)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Rattache le contenu RÉEL des quiz aux parcours globaux correspondants.
   * Idempotent et robuste : pour chaque quiz défini dans `QUIZ_SEEDS`, on trouve
   * le parcours global (tenantId NULL) de la catégorie, puis on crée ou complète
   * la ressource quiz (par titre) avec ses questions. Un quiz étant du contenu
   * réel (pas une vidéo/URL factice), `contenuDisponible = true` est légitime.
   */
  private async seedQuizzes(): Promise<void> {
    let touched = 0;

    for (const seed of QUIZ_SEEDS) {
      // Parcours global de la catégorie (créé par seedStructure).
      const parcours = await this.parcoursRepo.findOne({
        where: {
          titre: `Parcours ${PARCOURS_CATEGORIE_LABEL[seed.categorie as ParcoursCategorie]}`,
          tenantId: IsNull(),
        },
      });
      if (!parcours) continue;

      const contenu: QuizContenu = {
        seuilReussite: seed.seuilReussite,
        questions: seed.questions,
      };

      // Ressource quiz existante (par titre + parcours) ?
      let ressource = await this.ressourceRepo.findOne({
        where: { parcoursId: parcours.id, titre: seed.ressourceTitre, type: RessourceType.QUIZ },
      });

      if (!ressource) {
        // Ordre : à la suite des ressources existantes du parcours.
        const count = await this.ressourceRepo.count({ where: { parcoursId: parcours.id } });
        ressource = this.ressourceRepo.create({
          parcoursId: parcours.id,
          type: RessourceType.QUIZ,
          titre: seed.ressourceTitre,
          description: seed.description,
          duree: seed.duree,
          url: null,
          miniatureUrl: null,
          moduleAssocie: seed.moduleAssocie,
          langue: 'fr',
          versionCompatible: null,
          ordre: count,
          estPublie: true,
          contenuDisponible: true,   // quiz réel => contenu disponible (pas une fausse URL)
          quizJson: contenu,
        });
        await this.ressourceRepo.save(ressource);
        touched += 1;
        continue;
      }

      // Ressource déjà présente : ne compléter que si le quiz est vide.
      const dejaRempli = !!ressource.quizJson?.questions?.length;
      if (!dejaRempli) {
        ressource.quizJson = contenu;
        ressource.description = ressource.description ?? seed.description;
        ressource.duree = ressource.duree ?? seed.duree;
        ressource.moduleAssocie = ressource.moduleAssocie ?? seed.moduleAssocie;
        ressource.estPublie = true;
        ressource.contenuDisponible = true;
        await this.ressourceRepo.save(ressource);
        touched += 1;
      }
    }

    if (touched > 0) {
      this.logger.log(`Quiz Académie initialisés: ${touched} ressource(s) quiz avec contenu réel (contenuDisponible=true).`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  LISTING PUBLIÉ (par catégorie) — global + tenant courant
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Liste les parcours publiés visibles pour le tenant : contenu global
   * (tenantId NULL) + contenu propre au tenant, regroupé par catégorie, avec
   * les ressources publiées de chaque parcours.
   */
  async listerParcoursPublies(tenantId: string | null): Promise<Array<{
    categorie: ParcoursCategorie;
    label: string;
    parcours: Array<ParcoursFormation & { ressources: RessourcePublique[] }>;
  }>> {
    const qb = this.parcoursRepo.createQueryBuilder('p')
      .where('p.estPublie = :pub', { pub: true })
      .andWhere('(p.tenantId IS NULL OR p.tenantId = :tid)', { tid: tenantId ?? '__none__' })
      .orderBy('p.ordre', 'ASC')
      .addOrderBy('p.titre', 'ASC');

    const parcours = await qb.getMany();
    const ids = parcours.map(p => p.id);

    const ressources = ids.length
      ? await this.ressourceRepo.createQueryBuilder('r')
          .where('r.parcoursId IN (:...ids)', { ids })
          .andWhere('r.estPublie = :pub', { pub: true })
          .orderBy('r.ordre', 'ASC')
          .getMany()
      : [];

    const parRessourceParcours = new Map<string, RessourcePublique[]>();
    for (const r of ressources) {
      const arr = parRessourceParcours.get(r.parcoursId) ?? [];
      arr.push(this.sanitizeRessource(r));
      parRessourceParcours.set(r.parcoursId, arr);
    }

    const groupes = new Map<ParcoursCategorie, Array<ParcoursFormation & { ressources: RessourcePublique[] }>>();
    for (const p of parcours) {
      const enrichi = { ...p, ressources: parRessourceParcours.get(p.id) ?? [] };
      const arr = groupes.get(p.categorie) ?? [];
      arr.push(enrichi);
      groupes.set(p.categorie, arr);
    }

    return PARCOURS_CATEGORIE_ORDRE
      .filter(cat => groupes.has(cat))
      .map(cat => ({
        categorie: cat,
        label: PARCOURS_CATEGORIE_LABEL[cat],
        parcours: groupes.get(cat) as Array<ParcoursFormation & { ressources: RessourcePublique[] }>,
      }));
  }

  /** Détail d'un parcours publié + ses ressources publiées. */
  async getParcoursPublie(id: string, tenantId: string | null): Promise<ParcoursFormation & { ressources: RessourcePublique[] }> {
    const parcours = await this.parcoursRepo.findOne({ where: { id } });
    if (!parcours || !parcours.estPublie
      || (parcours.tenantId !== null && parcours.tenantId !== tenantId)) {
      throw new NotFoundException('Parcours de formation introuvable');
    }
    const ressources = await this.ressourceRepo.find({
      where: { parcoursId: id, estPublie: true },
      order: { ordre: 'ASC' },
    });
    return { ...parcours, ressources: ressources.map(r => this.sanitizeRessource(r)) };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CRUD PARCOURS (admin)
  // ══════════════════════════════════════════════════════════════════════════

  async creerParcours(dto: CreateParcoursDto, tenantId: string | null): Promise<ParcoursFormation> {
    const parcours = this.parcoursRepo.create({
      titre: dto.titre,
      description: dto.description ?? null,
      categorie: dto.categorie ?? ParcoursCategorie.DEMARRAGE,
      niveau: dto.niveau ?? ParcoursNiveau.DEBUTANT,
      ordre: dto.ordre ?? 0,
      estPublie: dto.estPublie ?? false,
      iconeUrl: dto.iconeUrl ?? null,
      tenantId: tenantId ?? null,
    });
    return this.parcoursRepo.save(parcours);
  }

  async majParcours(id: string, dto: UpdateParcoursDto): Promise<ParcoursFormation> {
    const parcours = await this.parcoursRepo.findOne({ where: { id } });
    if (!parcours) throw new NotFoundException('Parcours introuvable');
    Object.assign(parcours, {
      ...(dto.titre !== undefined ? { titre: dto.titre } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.categorie !== undefined ? { categorie: dto.categorie } : {}),
      ...(dto.niveau !== undefined ? { niveau: dto.niveau } : {}),
      ...(dto.ordre !== undefined ? { ordre: dto.ordre } : {}),
      ...(dto.estPublie !== undefined ? { estPublie: dto.estPublie } : {}),
      ...(dto.iconeUrl !== undefined ? { iconeUrl: dto.iconeUrl } : {}),
    });
    return this.parcoursRepo.save(parcours);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  CRUD RESSOURCES (admin)
  // ══════════════════════════════════════════════════════════════════════════

  async creerRessource(dto: CreateRessourceDto): Promise<RessourceFormation> {
    const parcours = await this.parcoursRepo.findOne({ where: { id: dto.parcoursId } });
    if (!parcours) throw new NotFoundException('Parcours parent introuvable');

    // Honnêteté : sans URL réelle, le contenu ne peut être « disponible ».
    const url = dto.url ?? null;
    const contenuDisponible = url ? (dto.contenuDisponible ?? true) : false;

    const ressource = this.ressourceRepo.create({
      parcoursId: dto.parcoursId,
      type: dto.type ?? RessourceType.DOCUMENT,
      titre: dto.titre,
      description: dto.description ?? null,
      duree: dto.duree ?? null,
      url,
      miniatureUrl: dto.miniatureUrl ?? null,
      moduleAssocie: dto.moduleAssocie ?? null,
      langue: dto.langue ?? 'fr',
      versionCompatible: dto.versionCompatible ?? null,
      ordre: dto.ordre ?? 0,
      estPublie: dto.estPublie ?? false,
      contenuDisponible,
    });
    return this.ressourceRepo.save(ressource);
  }

  async majRessource(id: string, dto: UpdateRessourceDto): Promise<RessourceFormation> {
    const ressource = await this.ressourceRepo.findOne({ where: { id } });
    if (!ressource) throw new NotFoundException('Ressource introuvable');

    Object.assign(ressource, {
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.titre !== undefined ? { titre: dto.titre } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.duree !== undefined ? { duree: dto.duree } : {}),
      ...(dto.url !== undefined ? { url: dto.url } : {}),
      ...(dto.miniatureUrl !== undefined ? { miniatureUrl: dto.miniatureUrl } : {}),
      ...(dto.moduleAssocie !== undefined ? { moduleAssocie: dto.moduleAssocie } : {}),
      ...(dto.langue !== undefined ? { langue: dto.langue } : {}),
      ...(dto.versionCompatible !== undefined ? { versionCompatible: dto.versionCompatible } : {}),
      ...(dto.ordre !== undefined ? { ordre: dto.ordre } : {}),
      ...(dto.estPublie !== undefined ? { estPublie: dto.estPublie } : {}),
      ...(dto.contenuDisponible !== undefined ? { contenuDisponible: dto.contenuDisponible } : {}),
    });

    // Garde-fou d'honnêteté : pas d'URL => contenu non disponible.
    if (!ressource.url) ressource.contenuDisponible = false;

    return this.ressourceRepo.save(ressource);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PROGRESSION (par utilisateur / tenant)
  // ══════════════════════════════════════════════════════════════════════════

  /** Marque une ressource comme consultée (en_cours par défaut, ou terminé). */
  async marquerProgression(
    userId: string,
    tenantId: string | null,
    ressourceId: string,
    statut: ProgressionStatut = ProgressionStatut.EN_COURS,
  ): Promise<ProgressionFormation> {
    const ressource = await this.ressourceRepo.findOne({ where: { id: ressourceId } });
    if (!ressource) throw new NotFoundException('Ressource introuvable');

    let progression = await this.progressionRepo.findOne({ where: { userId, ressourceId } });
    if (!progression) {
      progression = this.progressionRepo.create({ userId, tenantId: tenantId ?? null, ressourceId });
    }
    progression.statut = statut;
    progression.consulteAt = new Date();
    return this.progressionRepo.save(progression);
  }

  /** Progression de l'utilisateur courant (toutes ressources). */
  async maProgression(userId: string): Promise<ProgressionFormation[]> {
    return this.progressionRepo.find({
      where: { userId },
      order: { consulteAt: 'DESC' },
    });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  QUIZ — moteur (questions sans réponses / soumission notée + progression)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Charge une ressource quiz accessible pour le tenant courant et renvoie son
   * contenu. Vérifie : type quiz, ressource & parcours publiés, tenant autorisé,
   * quiz non vide.
   */
  private async chargerQuizAccessible(
    ressourceId: string,
    tenantId: string | null,
  ): Promise<{ ressource: RessourceFormation; contenu: QuizContenu }> {
    const ressource = await this.ressourceRepo.findOne({ where: { id: ressourceId } });
    if (!ressource || ressource.type !== RessourceType.QUIZ || !ressource.estPublie) {
      throw new NotFoundException('Quiz introuvable');
    }

    const parcours = await this.parcoursRepo.findOne({ where: { id: ressource.parcoursId } });
    if (!parcours || !parcours.estPublie
      || (parcours.tenantId !== null && parcours.tenantId !== tenantId)) {
      throw new NotFoundException('Quiz introuvable');
    }

    const contenu = ressource.quizJson;
    if (!contenu || !Array.isArray(contenu.questions) || contenu.questions.length === 0) {
      throw new NotFoundException('Ce quiz n\'a pas encore de questions');
    }
    return { ressource, contenu };
  }

  /**
   * Renvoie les questions d'un quiz SANS révéler les bonnes réponses ni les
   * explications (fournies uniquement dans le corrigé après soumission).
   */
  async getQuiz(ressourceId: string, tenantId: string | null): Promise<QuizPublic> {
    const { ressource, contenu } = await this.chargerQuizAccessible(ressourceId, tenantId);
    return {
      ressourceId: ressource.id,
      titre: ressource.titre,
      description: ressource.description,
      seuilReussite: contenu.seuilReussite,
      nombreQuestions: contenu.questions.length,
      questions: contenu.questions.map(q => ({
        id: q.id,
        question: q.question,
        options: q.options,
        multiple: q.bonnesReponses.length > 1,
      })),
    };
  }

  /**
   * Corrige les réponses soumises, calcule le score et enregistre la
   * progression (`termine` si score ≥ seuil, sinon `en_cours`). Renvoie le
   * corrigé complet (bonnes réponses + explications).
   */
  async soumettreQuiz(
    userId: string,
    tenantId: string | null,
    ressourceId: string,
    reponses: ReponseQuizDto[],
  ): Promise<QuizResultat> {
    const { ressource, contenu } = await this.chargerQuizAccessible(ressourceId, tenantId);

    if (!Array.isArray(reponses)) {
      throw new BadRequestException('Réponses invalides');
    }

    // Indexe les réponses de l'utilisateur par identifiant de question.
    const parQuestion = new Map<string, number[]>();
    for (const r of reponses) {
      // Déduplique et ignore les indices hors bornes plus bas.
      parQuestion.set(r.questionId, Array.from(new Set(r.options ?? [])));
    }

    const corrige: QuizCorrectionQuestion[] = [];
    let score = 0;

    for (const q of contenu.questions) {
      const choisiesBrutes = parQuestion.get(q.id) ?? [];
      const nbOptions = q.options.length;
      const choisies = choisiesBrutes.filter(i => Number.isInteger(i) && i >= 0 && i < nbOptions);

      const attendues = [...q.bonnesReponses].sort((a, b) => a - b);
      const donnees = [...choisies].sort((a, b) => a - b);
      const correct = attendues.length === donnees.length
        && attendues.every((v, i) => v === donnees[i]);

      if (correct) score += 1;

      corrige.push({
        questionId: q.id,
        question: q.question,
        options: q.options,
        reponseUtilisateur: donnees,
        bonnesReponses: attendues,
        correct,
        explication: q.explication,
      });
    }

    const total = contenu.questions.length;
    const pourcentage = total > 0 ? Math.round((score / total) * 100) : 0;
    const reussi = pourcentage >= contenu.seuilReussite;
    const statut = reussi ? ProgressionStatut.TERMINE : ProgressionStatut.EN_COURS;

    // Enregistre la progression (réutilise la logique idempotente existante).
    await this.marquerProgression(userId, tenantId, ressource.id, statut);

    return {
      ressourceId: ressource.id,
      score,
      total,
      pourcentage,
      seuilReussite: contenu.seuilReussite,
      reussi,
      statut,
      corrige,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STATS de progression (utilisateur courant + tenant)
  // ══════════════════════════════════════════════════════════════════════════

  async getStats(userId: string, tenantId: string | null): Promise<{
    totalRessourcesPubliees: number;
    contenuDisponible: number;
    ressourcesCommencees: number;
    ressourcesTerminees: number;
    pourcentageTermine: number;
  }> {
    const totalRessourcesPubliees = await this.ressourceRepo.createQueryBuilder('r')
      .innerJoin(ParcoursFormation, 'p', 'p.id = r.parcoursId')
      .where('r.estPublie = :pub', { pub: true })
      .andWhere('p.estPublie = :pub', { pub: true })
      .andWhere('(p.tenantId IS NULL OR p.tenantId = :tid)', { tid: tenantId ?? '__none__' })
      .getCount();

    const contenuDisponible = await this.ressourceRepo.createQueryBuilder('r')
      .innerJoin(ParcoursFormation, 'p', 'p.id = r.parcoursId')
      .where('r.estPublie = :pub', { pub: true })
      .andWhere('r.contenuDisponible = :disp', { disp: true })
      .andWhere('p.estPublie = :pub', { pub: true })
      .andWhere('(p.tenantId IS NULL OR p.tenantId = :tid)', { tid: tenantId ?? '__none__' })
      .getCount();

    const progressions = await this.progressionRepo.find({ where: { userId } });
    const ressourcesTerminees = progressions.filter(p => p.statut === ProgressionStatut.TERMINE).length;
    const ressourcesCommencees = progressions.filter(
      p => p.statut === ProgressionStatut.EN_COURS || p.statut === ProgressionStatut.TERMINE,
    ).length;

    const pourcentageTermine = totalRessourcesPubliees > 0
      ? Math.round((ressourcesTerminees / totalRessourcesPubliees) * 100)
      : 0;

    return {
      totalRessourcesPubliees,
      contenuDisponible,
      ressourcesCommencees,
      ressourcesTerminees,
      pourcentageTermine,
    };
  }
}
