import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, IsNull } from 'typeorm';
import {
  MaladieDeclarable,
  CategorieMaladie,
} from './entities/maladie-declarable.entity';
import {
  DeclarationSanitaire,
  StatutDeclaration,
  GraviteDeclaration,
  EvolutionCas,
  SexePatient,
} from './entities/declaration-sanitaire.entity';
import {
  CreateMaladieDto,
  UpdateMaladieDto,
  CreateDeclarationDto,
  UpdateDeclarationDto,
  ChangerStatutDeclarationDto,
  TransmettreDeclarationDto,
} from './dto/declaration-sanitaire.dto';
import { SEED_MALADIES } from './maladies.seed';

/**
 * Transitions de statut autorisées (workflow de déclaration sanitaire).
 * a_declarer → declaree → transmise → confirmee → classee.
 * Retours arrière contrôlés autorisés (correction d'une transmission, reprise).
 */
const TRANSITIONS: Record<StatutDeclaration, StatutDeclaration[]> = {
  [StatutDeclaration.A_DECLARER]: [StatutDeclaration.DECLAREE],
  [StatutDeclaration.DECLAREE]: [
    StatutDeclaration.TRANSMISE,
    StatutDeclaration.A_DECLARER,
  ],
  [StatutDeclaration.TRANSMISE]: [
    StatutDeclaration.CONFIRMEE,
    StatutDeclaration.CLASSEE,
    StatutDeclaration.DECLAREE,
  ],
  [StatutDeclaration.CONFIRMEE]: [
    StatutDeclaration.CLASSEE,
    StatutDeclaration.TRANSMISE,
  ],
  [StatutDeclaration.CLASSEE]: [StatutDeclaration.CONFIRMEE],
};

/** Statuts considérés comme « pas encore transmis » (compte pour l'urgence). */
const STATUTS_NON_TRANSMIS: StatutDeclaration[] = [
  StatutDeclaration.A_DECLARER,
  StatutDeclaration.DECLAREE,
];

export interface DeclarationAvecUrgence extends DeclarationSanitaire {
  delaiHeures: number | null;
  echeance: string | null;
  urgent: boolean;
  enRetard: boolean;
}

@Injectable()
export class DeclarationsSanitairesService implements OnModuleInit {
  private readonly logger = new Logger(DeclarationsSanitairesService.name);

  constructor(
    @InjectRepository(MaladieDeclarable)
    private readonly maladieRepo: Repository<MaladieDeclarable>,
    @InjectRepository(DeclarationSanitaire)
    private readonly declRepo: Repository<DeclarationSanitaire>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedReferentiel();
    } catch (e) {
      // Le seed ne doit jamais empêcher le démarrage (ex. table absente en dev).
      this.logger.warn(`Seed MDO ignoré: ${(e as Error).message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SEED — référentiel MDO global (tenantId NULL)
  // ══════════════════════════════════════════════════════════════════════════
  private async seedReferentiel(): Promise<void> {
    let crees = 0;
    for (const seed of SEED_MALADIES) {
      const existe = await this.maladieRepo.findOne({
        where: { nom: seed.nom, tenantId: IsNull() },
      });
      if (existe) continue;
      await this.maladieRepo.save(
        this.maladieRepo.create({
          tenantId: null,
          nom: seed.nom,
          codeCIM10: seed.codeCIM10,
          categorie: seed.categorie,
          delaiDeclarationHeures: seed.delaiDeclarationHeures,
          description: seed.description,
          actif: true,
        }),
      );
      crees += 1;
    }
    if (crees > 0) {
      this.logger.log(`Référentiel MDO seedé : ${crees} maladie(s) ajoutée(s).`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RÉFÉRENTIEL MDO — CRUD
  //  Visibilité : entrées globales (tenantId NULL) + propres au tenant.
  // ══════════════════════════════════════════════════════════════════════════
  async findMaladies(
    tenantId: string,
    filtres: { categorie?: CategorieMaladie; actif?: boolean; search?: string } = {},
  ): Promise<MaladieDeclarable[]> {
    if (filtres.categorie && !Object.values(CategorieMaladie).includes(filtres.categorie)) {
      throw new BadRequestException(`Catégorie invalide : ${filtres.categorie}`);
    }
    const qb = this.maladieRepo
      .createQueryBuilder('m')
      .where('(m.tenantId = :tenantId OR m.tenantId IS NULL)', { tenantId });

    if (filtres.categorie) qb.andWhere('m.categorie = :cat', { cat: filtres.categorie });
    if (filtres.actif !== undefined) qb.andWhere('m.actif = :actif', { actif: filtres.actif });
    if (filtres.search) {
      qb.andWhere('(m.nom ILIKE :s OR m.codeCIM10 ILIKE :s)', { s: `%${filtres.search}%` });
    }
    return qb.orderBy('m.nom', 'ASC').getMany();
  }

  private async findMaladieAccessible(
    id: string,
    tenantId: string,
  ): Promise<MaladieDeclarable> {
    const maladie = await this.maladieRepo.findOne({ where: { id } });
    if (!maladie || (maladie.tenantId !== null && maladie.tenantId !== tenantId)) {
      throw new NotFoundException(`MDO ${id} introuvable`);
    }
    return maladie;
  }

  async creerMaladie(
    dto: CreateMaladieDto,
    tenantId: string,
  ): Promise<MaladieDeclarable> {
    const maladie = this.maladieRepo.create({
      tenantId,
      nom: dto.nom,
      codeCIM10: dto.codeCIM10 ?? null,
      categorie: dto.categorie,
      delaiDeclarationHeures: dto.delaiDeclarationHeures ?? 24,
      description: dto.description ?? null,
      actif: dto.actif ?? true,
    });
    return this.maladieRepo.save(maladie);
  }

  async updateMaladie(
    id: string,
    dto: UpdateMaladieDto,
    tenantId: string,
  ): Promise<MaladieDeclarable> {
    const maladie = await this.findMaladieAccessible(id, tenantId);
    if (maladie.tenantId === null) {
      throw new BadRequestException(
        'Une MDO du référentiel global ne peut être modifiée.',
      );
    }
    if (dto.nom !== undefined) maladie.nom = dto.nom;
    if (dto.codeCIM10 !== undefined) maladie.codeCIM10 = dto.codeCIM10 ?? null;
    if (dto.categorie !== undefined) maladie.categorie = dto.categorie;
    if (dto.delaiDeclarationHeures !== undefined) maladie.delaiDeclarationHeures = dto.delaiDeclarationHeures;
    if (dto.description !== undefined) maladie.description = dto.description ?? null;
    if (dto.actif !== undefined) maladie.actif = dto.actif;
    return this.maladieRepo.save(maladie);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DÉCLARATIONS — helpers
  // ══════════════════════════════════════════════════════════════════════════
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const debut = new Date(annee, 0, 1, 0, 0, 0, 0);
    const fin = new Date(annee, 11, 31, 23, 59, 59, 999);
    const count = await this.declRepo.count({
      where: { tenantId, createdAt: Between(debut, fin) },
    });
    const seq = String(count + 1).padStart(4, '0');
    return `MDO-${annee}-${seq}`;
  }

  /**
   * Enrichit une déclaration avec le calcul d'urgence : échéance réglementaire
   * = dateDiagnostic + délai de la MDO. `urgent` si non transmise et échéance
   * dans < 6 h, `enRetard` si non transmise et échéance dépassée.
   */
  private async enrichirUrgence(
    decl: DeclarationSanitaire,
  ): Promise<DeclarationAvecUrgence> {
    const maladie = await this.maladieRepo.findOne({ where: { id: decl.maladieId } });
    const delaiHeures = maladie?.delaiDeclarationHeures ?? null;

    let echeance: Date | null = null;
    if (delaiHeures != null && decl.dateDiagnostic) {
      echeance = new Date(
        new Date(decl.dateDiagnostic).getTime() + delaiHeures * 3600 * 1000,
      );
    }
    const nonTransmis = STATUTS_NON_TRANSMIS.includes(decl.statut);
    const now = Date.now();
    const enRetard =
      nonTransmis && echeance != null && echeance.getTime() < now;
    const urgent =
      nonTransmis &&
      echeance != null &&
      !enRetard &&
      echeance.getTime() - now < 6 * 3600 * 1000;

    return {
      ...decl,
      delaiHeures,
      echeance: echeance ? echeance.toISOString() : null,
      urgent,
      enRetard,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DÉCLARATIONS — CRUD
  // ══════════════════════════════════════════════════════════════════════════
  async creer(
    dto: CreateDeclarationDto,
    tenantId: string,
    medecinRef: string,
  ): Promise<DeclarationSanitaire> {
    const maladie = await this.findMaladieAccessible(dto.maladieId, tenantId);
    const numero = await this.genererNumero(tenantId);
    const decl = this.declRepo.create({
      numero,
      tenantId,
      maladieId: maladie.id,
      maladieNom: maladie.nom,
      codeCIM10: maladie.codeCIM10,
      patientId: dto.patientId ?? null,
      patientNom: dto.patientNom ?? null,
      patientAge: dto.patientAge ?? null,
      patientSexe: dto.patientSexe ?? SexePatient.INCONNU,
      localite: dto.localite ?? null,
      dateDiagnostic: new Date(dto.dateDiagnostic),
      dateDeclaration: null,
      medecinDeclarantRef: medecinRef,
      statut: StatutDeclaration.A_DECLARER,
      gravite: dto.gravite ?? GraviteDeclaration.MODERE,
      evolution: dto.evolution ?? EvolutionCas.EN_COURS,
      mesuresPrises: dto.mesuresPrises ?? null,
    });
    const saved = await this.declRepo.save(decl);
    this.logger.log(
      `Déclaration ${saved.numero} créée (maladie=${maladie.nom}, tenant=${tenantId})`,
    );
    return saved;
  }

  async findAll(
    tenantId: string,
    filters: {
      statut?: StatutDeclaration;
      maladieId?: string;
      gravite?: GraviteDeclaration;
      localite?: string;
      search?: string;
    } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{
    data: DeclarationAvecUrgence[];
    total: number;
    page: number;
    limit: number;
  }> {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    // Valide les filtres enum : une valeur inconnue déclencherait sinon une
    // erreur Postgres « invalid input value for enum » remontée en HTTP 500.
    if (filters.statut && !Object.values(StatutDeclaration).includes(filters.statut)) {
      throw new BadRequestException(`Statut invalide : ${filters.statut}`);
    }
    if (filters.gravite && !Object.values(GraviteDeclaration).includes(filters.gravite)) {
      throw new BadRequestException(`Gravité invalide : ${filters.gravite}`);
    }

    const qb = this.declRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.statut) qb.andWhere('d.statut = :statut', { statut: filters.statut });
    if (filters.maladieId) qb.andWhere('d.maladieId = :maladieId', { maladieId: filters.maladieId });
    if (filters.gravite) qb.andWhere('d.gravite = :gravite', { gravite: filters.gravite });
    if (filters.localite) qb.andWhere('d.localite ILIKE :loc', { loc: `%${filters.localite}%` });
    if (filters.search) {
      qb.andWhere(
        '(d.numero ILIKE :s OR d.maladieNom ILIKE :s OR d.patientNom ILIKE :s OR d.localite ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    const [rows, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = await Promise.all(rows.map((r) => this.enrichirUrgence(r)));
    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<DeclarationAvecUrgence> {
    const decl = await this.declRepo.findOne({ where: { id, tenantId } });
    if (!decl) throw new NotFoundException(`Déclaration ${id} introuvable`);
    return this.enrichirUrgence(decl);
  }

  async update(
    id: string,
    dto: UpdateDeclarationDto,
    tenantId: string,
  ): Promise<DeclarationSanitaire> {
    const decl = await this.declRepo.findOne({ where: { id, tenantId } });
    if (!decl) throw new NotFoundException(`Déclaration ${id} introuvable`);
    if (decl.statut === StatutDeclaration.CLASSEE) {
      throw new BadRequestException(
        'Une déclaration classée ne peut être modifiée.',
      );
    }
    if (dto.patientId !== undefined) decl.patientId = dto.patientId ?? null;
    if (dto.patientNom !== undefined) decl.patientNom = dto.patientNom ?? null;
    if (dto.patientAge !== undefined) decl.patientAge = dto.patientAge ?? null;
    if (dto.patientSexe !== undefined) decl.patientSexe = dto.patientSexe;
    if (dto.localite !== undefined) decl.localite = dto.localite ?? null;
    if (dto.dateDiagnostic !== undefined) decl.dateDiagnostic = new Date(dto.dateDiagnostic);
    if (dto.gravite !== undefined) decl.gravite = dto.gravite;
    if (dto.evolution !== undefined) decl.evolution = dto.evolution;
    if (dto.mesuresPrises !== undefined) decl.mesuresPrises = dto.mesuresPrises ?? null;
    return this.declRepo.save(decl);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Transitions & transmission
  // ══════════════════════════════════════════════════════════════════════════
  async changerStatut(
    id: string,
    dto: ChangerStatutDeclarationDto,
    tenantId: string,
  ): Promise<DeclarationSanitaire> {
    const decl = await this.declRepo.findOne({ where: { id, tenantId } });
    if (!decl) throw new NotFoundException(`Déclaration ${id} introuvable`);
    const ancien = decl.statut;
    const nouveau = dto.statut;
    if (ancien === nouveau) {
      throw new BadRequestException('La déclaration est déjà dans ce statut.');
    }
    const autorisees = TRANSITIONS[ancien] ?? [];
    if (!autorisees.includes(nouveau)) {
      throw new BadRequestException(`Transition non autorisée : ${ancien} → ${nouveau}.`);
    }
    if (nouveau === StatutDeclaration.TRANSMISE && !decl.autoriteDestinataire) {
      throw new BadRequestException(
        'Utilisez l\'action « transmettre » pour renseigner l\'autorité destinataire.',
      );
    }
    decl.statut = nouveau;
    if (nouveau === StatutDeclaration.DECLAREE && !decl.dateDeclaration) {
      decl.dateDeclaration = new Date();
    }
    return this.declRepo.save(decl);
  }

  async transmettre(
    id: string,
    dto: TransmettreDeclarationDto,
    tenantId: string,
  ): Promise<DeclarationSanitaire> {
    const decl = await this.declRepo.findOne({ where: { id, tenantId } });
    if (!decl) throw new NotFoundException(`Déclaration ${id} introuvable`);
    if (
      decl.statut !== StatutDeclaration.A_DECLARER &&
      decl.statut !== StatutDeclaration.DECLAREE
    ) {
      throw new BadRequestException(
        'Seule une déclaration « à déclarer » ou « déclarée » peut être transmise.',
      );
    }
    decl.autoriteDestinataire = dto.autoriteDestinataire;
    decl.referenceTransmission = dto.referenceTransmission ?? null;
    decl.dateTransmission = new Date();
    if (!decl.dateDeclaration) decl.dateDeclaration = new Date();
    decl.statut = StatutDeclaration.TRANSMISE;
    const saved = await this.declRepo.save(decl);
    this.logger.log(
      `Déclaration ${saved.numero} transmise à « ${dto.autoriteDestinataire} » (tenant=${tenantId})`,
    );
    return saved;
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Statistiques épidémiologiques
  // ══════════════════════════════════════════════════════════════════════════
  async getStats(tenantId: string): Promise<{
    total: number;
    parStatut: Record<string, number>;
    parGravite: Record<string, number>;
    parEvolution: Record<string, number>;
    parMaladie: { maladieNom: string; total: number }[];
    parLocalite: { localite: string; total: number }[];
    casDuMois: number;
    aTransmettre: number;
    enRetard: number;
    deces: number;
  }> {
    const declarations = await this.declRepo.find({ where: { tenantId } });
    const total = declarations.length;

    const parStatut: Record<string, number> = {};
    for (const s of Object.values(StatutDeclaration)) parStatut[s] = 0;
    const parGravite: Record<string, number> = {};
    for (const g of Object.values(GraviteDeclaration)) parGravite[g] = 0;
    const parEvolution: Record<string, number> = {};
    for (const e of Object.values(EvolutionCas)) parEvolution[e] = 0;

    const maladieMap: Record<string, number> = {};
    const localiteMap: Record<string, number> = {};

    for (const d of declarations) {
      parStatut[d.statut] = (parStatut[d.statut] ?? 0) + 1;
      parGravite[d.gravite] = (parGravite[d.gravite] ?? 0) + 1;
      parEvolution[d.evolution] = (parEvolution[d.evolution] ?? 0) + 1;
      maladieMap[d.maladieNom] = (maladieMap[d.maladieNom] ?? 0) + 1;
      if (d.localite) localiteMap[d.localite] = (localiteMap[d.localite] ?? 0) + 1;
    }

    const parMaladie = Object.entries(maladieMap)
      .map(([maladieNom, t]) => ({ maladieNom, total: t }))
      .sort((a, b) => b.total - a.total);
    const parLocalite = Object.entries(localiteMap)
      .map(([localite, t]) => ({ localite, total: t }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const casDuMois = declarations.filter(
      (d) => new Date(d.createdAt) >= debutMois,
    ).length;

    const aTransmettre =
      (parStatut[StatutDeclaration.A_DECLARER] ?? 0) +
      (parStatut[StatutDeclaration.DECLAREE] ?? 0);
    const deces = parEvolution[EvolutionCas.DECES] ?? 0;

    // En retard : non transmis et échéance réglementaire dépassée.
    const maladies = await this.maladieRepo.find();
    const delaiParId = new Map(maladies.map((m) => [m.id, m.delaiDeclarationHeures]));
    const now = Date.now();
    const enRetard = declarations.filter((d) => {
      if (!STATUTS_NON_TRANSMIS.includes(d.statut)) return false;
      const delai = delaiParId.get(d.maladieId);
      if (delai == null) return false;
      const echeance = new Date(d.dateDiagnostic).getTime() + delai * 3600 * 1000;
      return echeance < now;
    }).length;

    return {
      total,
      parStatut,
      parGravite,
      parEvolution,
      parMaladie,
      parLocalite,
      casDuMois,
      aTransmettre,
      enRetard,
      deces,
    };
  }

  /** Alerte : déclarations non transmises dont l'échéance est dépassée ou imminente. */
  async getAlertes(tenantId: string): Promise<DeclarationAvecUrgence[]> {
    const rows = await this.declRepo.find({
      where: { tenantId },
      order: { dateDiagnostic: 'ASC' },
    });
    const enrichies = await Promise.all(rows.map((r) => this.enrichirUrgence(r)));
    return enrichies.filter((d) => d.urgent || d.enRetard);
  }
}
