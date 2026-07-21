import {
  Injectable, Logger, NotFoundException, OnModuleInit,
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
    } catch (e) {
      // Le seed ne doit jamais empêcher le démarrage (ex. table absente en dev).
      this.logger.warn(`Seed Académie ignoré: ${(e as Error).message}`);
    }
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
    parcours: Array<ParcoursFormation & { ressources: RessourceFormation[] }>;
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

    const parRessourceParcours = new Map<string, RessourceFormation[]>();
    for (const r of ressources) {
      const arr = parRessourceParcours.get(r.parcoursId) ?? [];
      arr.push(r);
      parRessourceParcours.set(r.parcoursId, arr);
    }

    const groupes = new Map<ParcoursCategorie, Array<ParcoursFormation & { ressources: RessourceFormation[] }>>();
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
        parcours: groupes.get(cat) as Array<ParcoursFormation & { ressources: RessourceFormation[] }>,
      }));
  }

  /** Détail d'un parcours publié + ses ressources publiées. */
  async getParcoursPublie(id: string, tenantId: string | null): Promise<ParcoursFormation & { ressources: RessourceFormation[] }> {
    const parcours = await this.parcoursRepo.findOne({ where: { id } });
    if (!parcours || !parcours.estPublie
      || (parcours.tenantId !== null && parcours.tenantId !== tenantId)) {
      throw new NotFoundException('Parcours de formation introuvable');
    }
    const ressources = await this.ressourceRepo.find({
      where: { parcoursId: id, estPublie: true },
      order: { ordre: 'ASC' },
    });
    return { ...parcours, ressources };
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
