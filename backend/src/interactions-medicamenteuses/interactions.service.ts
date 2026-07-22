import {
  Injectable, Logger, NotFoundException, OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { InteractionMedicamenteuse } from './entities/interaction-medicamenteuse.entity';
import { ContreIndication } from './entities/contre-indication.entity';
import { SeveriteInteraction, SEVERITE_ORDRE } from './interactions.enums';
import { normaliserDci, ordonnerPaire } from './interactions.normalize';
import {
  SEED_INTERACTIONS, SEED_CONTRE_INDICATIONS, expandreTokens,
} from './interactions.seed';
import {
  CreateInteractionDto, UpdateInteractionDto, CreateContreIndicationDto,
} from './dto/interaction.dto';

/** Une interaction détectée entre deux médicaments saisis. */
export interface InteractionDetectee {
  medicamentA: string;         // libellé saisi par l'utilisateur
  medicamentB: string;
  severite: SeveriteInteraction;
  mecanisme: string | null;
  effet: string | null;
  conduiteATenir: string | null;
  source: string | null;
  reference: { dciA: string; dciB: string }; // termes du référentiel ayant matché
}

/** Résultat complet d'une vérification. */
export interface ResultatVerification {
  medicaments: string[];
  interactions: InteractionDetectee[];
  resume: {
    total: number;
    contre_indication: number;
    majeure: number;
    moderee: number;
    mineure: number;
    plusHauteSeverite: SeveriteInteraction | null;
  };
}

/**
 * Service Interactions médicamenteuses & contre-indications.
 *
 * - `verifierInteractions` : cœur métier — détecte, pour une liste de
 *   médicaments, toutes les paires en conflit (via expansion DCI → classe).
 * - CRUD du référentiel (lecture pour tous, écriture réservée admin par le
 *   controller). Le référentiel GLOBAL a `tenantId = null` (partagé) ; un tenant
 *   peut ajouter ses propres entrées.
 * - Seed idempotent du référentiel médical réel au démarrage.
 */
@Injectable()
export class InteractionsService implements OnModuleInit {
  private readonly logger = new Logger(InteractionsService.name);

  constructor(
    @InjectRepository(InteractionMedicamenteuse)
    private readonly interactionRepo: Repository<InteractionMedicamenteuse>,
    @InjectRepository(ContreIndication)
    private readonly contreIndicationRepo: Repository<ContreIndication>,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.seedReferentiel();
    } catch (e) {
      // Le seed ne doit jamais empêcher le démarrage (ex. table absente en dev).
      this.logger.warn(`Seed Interactions ignoré: ${(e as Error).message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  SEED — référentiel médical réel (global, tenantId NULL)
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Insère, une seule fois, les interactions et contre-indications de référence
   * (contenu médical établi). Idempotent : chaque entrée est repérée par sa
   * clé normalisée + `tenantId NULL` et n'est pas recréée si présente.
   */
  private async seedReferentiel(): Promise<void> {
    let interactionsCrees = 0;
    for (const seed of SEED_INTERACTIONS) {
      const [dciA, dciB] = ordonnerPaire(seed.a, seed.b);
      const existe = await this.interactionRepo.findOne({
        where: { dciA, dciB, tenantId: IsNull() },
      });
      if (existe) continue;
      await this.interactionRepo.save(this.interactionRepo.create({
        dciA, dciB,
        severite: seed.severite,
        mecanisme: seed.mecanisme,
        effet: seed.effet,
        conduiteATenir: seed.conduiteATenir,
        source: seed.source ?? null,
        tenantId: null,
      }));
      interactionsCrees += 1;
    }

    let ciCreees = 0;
    for (const seed of SEED_CONTRE_INDICATIONS) {
      const dci = normaliserDci(seed.dci);
      const condition = normaliserDci(seed.condition);
      const existe = await this.contreIndicationRepo.findOne({
        where: { dci, condition, tenantId: IsNull() },
      });
      if (existe) continue;
      await this.contreIndicationRepo.save(this.contreIndicationRepo.create({
        dci, condition,
        gravite: seed.gravite,
        description: seed.description,
        source: seed.source ?? null,
        tenantId: null,
      }));
      ciCreees += 1;
    }

    if (interactionsCrees > 0 || ciCreees > 0) {
      this.logger.log(
        `Référentiel Interactions initialisé: ${interactionsCrees} interaction(s) et ${ciCreees} contre-indication(s) globales (contenu médical réel).`,
      );
    }
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  VÉRIFICATEUR — cœur métier
  // ══════════════════════════════════════════════════════════════════════════

  /** Charge le référentiel visible pour le tenant (global + propre au tenant). */
  private async chargerReferentiel(tenantId: string | null): Promise<InteractionMedicamenteuse[]> {
    return this.interactionRepo.createQueryBuilder('i')
      .where('(i.tenantId IS NULL OR i.tenantId = :tid)', { tid: tenantId ?? '__none__' })
      .getMany();
  }

  /**
   * Vérifie les interactions entre les médicaments fournis.
   *
   * Chaque libellé saisi est normalisé puis élargi à ses classes
   * (ex. « ibuprofène » → { ibuprofene, ains }). Toutes les paires de
   * médicaments distincts sont confrontées au référentiel ; pour chaque paire
   * en conflit on retient l'interaction la PLUS SÉVÈRE.
   */
  async verifierInteractions(
    medicaments: string[],
    tenantId: string | null,
  ): Promise<ResultatVerification> {
    // Dédupe les libellés saisis (sur la forme normalisée) en gardant le libellé d'origine.
    const entrees: Array<{ label: string; tokens: string[] }> = [];
    const vus = new Set<string>();
    for (const brut of medicaments ?? []) {
      const norm = normaliserDci(brut);
      if (!norm || vus.has(norm)) continue;
      vus.add(norm);
      entrees.push({ label: brut.trim(), tokens: expandreTokens(brut) });
    }

    // Index du référentiel par clé de paire ordonnée → interaction la plus sévère.
    const referentiel = await this.chargerReferentiel(tenantId);
    const parPaire = new Map<string, InteractionMedicamenteuse>();
    for (const it of referentiel) {
      const cle = `${it.dciA}|${it.dciB}`;
      const actuel = parPaire.get(cle);
      if (!actuel || SEVERITE_ORDRE[it.severite] < SEVERITE_ORDRE[actuel.severite]) {
        parPaire.set(cle, it);
      }
    }

    const detectees: InteractionDetectee[] = [];
    for (let i = 0; i < entrees.length; i++) {
      for (let j = i + 1; j < entrees.length; j++) {
        let meilleure: InteractionMedicamenteuse | null = null;
        for (const ta of entrees[i].tokens) {
          for (const tb of entrees[j].tokens) {
            const [a, b] = ordonnerPaire(ta, tb);
            const trouve = parPaire.get(`${a}|${b}`);
            if (trouve && (!meilleure || SEVERITE_ORDRE[trouve.severite] < SEVERITE_ORDRE[meilleure.severite])) {
              meilleure = trouve;
            }
          }
        }
        if (meilleure) {
          detectees.push({
            medicamentA: entrees[i].label,
            medicamentB: entrees[j].label,
            severite: meilleure.severite,
            mecanisme: meilleure.mecanisme,
            effet: meilleure.effet,
            conduiteATenir: meilleure.conduiteATenir,
            source: meilleure.source,
            reference: { dciA: meilleure.dciA, dciB: meilleure.dciB },
          });
        }
      }
    }

    // Tri : le plus dangereux d'abord.
    detectees.sort((x, y) => SEVERITE_ORDRE[x.severite] - SEVERITE_ORDRE[y.severite]);

    const compter = (s: SeveriteInteraction) => detectees.filter(d => d.severite === s).length;

    return {
      medicaments: entrees.map(e => e.label),
      interactions: detectees,
      resume: {
        total: detectees.length,
        contre_indication: compter(SeveriteInteraction.CONTRE_INDICATION),
        majeure: compter(SeveriteInteraction.MAJEURE),
        moderee: compter(SeveriteInteraction.MODEREE),
        mineure: compter(SeveriteInteraction.MINEURE),
        plusHauteSeverite: detectees.length ? detectees[0].severite : null,
      },
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RÉFÉRENTIEL — lecture & recherche
  // ══════════════════════════════════════════════════════════════════════════

  /** Liste le référentiel visible, filtrable par sévérité et/ou terme DCI. */
  async listerInteractions(
    tenantId: string | null,
    filtres?: { severite?: SeveriteInteraction; dci?: string },
  ): Promise<InteractionMedicamenteuse[]> {
    const qb = this.interactionRepo.createQueryBuilder('i')
      .where('(i.tenantId IS NULL OR i.tenantId = :tid)', { tid: tenantId ?? '__none__' });

    if (filtres?.severite) {
      qb.andWhere('i.severite = :sev', { sev: filtres.severite });
    }
    if (filtres?.dci) {
      const terme = `%${normaliserDci(filtres.dci)}%`;
      qb.andWhere('(i.dciA LIKE :terme OR i.dciB LIKE :terme)', { terme });
    }

    return qb.orderBy('i.dciA', 'ASC').addOrderBy('i.dciB', 'ASC').getMany();
  }

  /** Recherche les interactions impliquant une DCI donnée (avec expansion). */
  async rechercherParDci(dci: string, tenantId: string | null): Promise<InteractionMedicamenteuse[]> {
    const tokens = expandreTokens(dci);
    if (!tokens.length) return [];
    const referentiel = await this.chargerReferentiel(tenantId);
    const set = new Set(tokens);
    return referentiel
      .filter(it => set.has(it.dciA) || set.has(it.dciB))
      .sort((a, b) => SEVERITE_ORDRE[a.severite] - SEVERITE_ORDRE[b.severite]);
  }

  /** Liste des contre-indications visibles, filtrable par DCI et/ou condition. */
  async listerContreIndications(
    tenantId: string | null,
    filtres?: { dci?: string; condition?: string },
  ): Promise<ContreIndication[]> {
    const qb = this.contreIndicationRepo.createQueryBuilder('c')
      .where('(c.tenantId IS NULL OR c.tenantId = :tid)', { tid: tenantId ?? '__none__' });

    if (filtres?.dci) {
      qb.andWhere('c.dci LIKE :d', { d: `%${normaliserDci(filtres.dci)}%` });
    }
    if (filtres?.condition) {
      qb.andWhere('c.condition LIKE :cond', { cond: `%${normaliserDci(filtres.condition)}%` });
    }

    return qb.orderBy('c.dci', 'ASC').addOrderBy('c.gravite', 'ASC').getMany();
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  RÉFÉRENTIEL — écriture (admin) ; les entrées créées sont propres au tenant
  // ══════════════════════════════════════════════════════════════════════════

  async creerInteraction(dto: CreateInteractionDto, tenantId: string | null): Promise<InteractionMedicamenteuse> {
    const [dciA, dciB] = ordonnerPaire(dto.dciA, dto.dciB);
    const interaction = this.interactionRepo.create({
      dciA, dciB,
      severite: dto.severite,
      mecanisme: dto.mecanisme ?? null,
      effet: dto.effet ?? null,
      conduiteATenir: dto.conduiteATenir ?? null,
      source: dto.source ?? null,
      tenantId: tenantId ?? null,
    });
    return this.interactionRepo.save(interaction);
  }

  async majInteraction(id: string, dto: UpdateInteractionDto): Promise<InteractionMedicamenteuse> {
    const interaction = await this.interactionRepo.findOne({ where: { id } });
    if (!interaction) throw new NotFoundException('Interaction introuvable');

    // Si l'une des deux DCI change, on ré-ordonne la paire.
    if (dto.dciA !== undefined || dto.dciB !== undefined) {
      const [dciA, dciB] = ordonnerPaire(dto.dciA ?? interaction.dciA, dto.dciB ?? interaction.dciB);
      interaction.dciA = dciA;
      interaction.dciB = dciB;
    }
    if (dto.severite !== undefined) interaction.severite = dto.severite;
    if (dto.mecanisme !== undefined) interaction.mecanisme = dto.mecanisme;
    if (dto.effet !== undefined) interaction.effet = dto.effet;
    if (dto.conduiteATenir !== undefined) interaction.conduiteATenir = dto.conduiteATenir;
    if (dto.source !== undefined) interaction.source = dto.source;

    return this.interactionRepo.save(interaction);
  }

  async supprimerInteraction(id: string, tenantId: string | null): Promise<{ deleted: boolean }> {
    const interaction = await this.interactionRepo.findOne({ where: { id } });
    if (!interaction) throw new NotFoundException('Interaction introuvable');
    // Protection : on ne supprime pas le référentiel global depuis un tenant.
    if (interaction.tenantId === null && tenantId !== null) {
      throw new NotFoundException('Interaction du référentiel global non modifiable');
    }
    await this.interactionRepo.remove(interaction);
    return { deleted: true };
  }

  async creerContreIndication(dto: CreateContreIndicationDto, tenantId: string | null): Promise<ContreIndication> {
    const ci = this.contreIndicationRepo.create({
      dci: normaliserDci(dto.dci),
      condition: normaliserDci(dto.condition),
      gravite: dto.gravite,
      description: dto.description ?? null,
      source: dto.source ?? null,
      tenantId: tenantId ?? null,
    });
    return this.contreIndicationRepo.save(ci);
  }

  /** Statistiques simples sur le référentiel visible. */
  async getStats(tenantId: string | null): Promise<{
    totalInteractions: number;
    parSeverite: Record<string, number>;
    totalContreIndications: number;
  }> {
    const referentiel = await this.chargerReferentiel(tenantId);
    const parSeverite: Record<string, number> = {
      contre_indication: 0, majeure: 0, moderee: 0, mineure: 0,
    };
    for (const it of referentiel) parSeverite[it.severite] = (parSeverite[it.severite] ?? 0) + 1;
    const totalContreIndications = await this.contreIndicationRepo.createQueryBuilder('c')
      .where('(c.tenantId IS NULL OR c.tenantId = :tid)', { tid: tenantId ?? '__none__' })
      .getCount();
    return { totalInteractions: referentiel.length, parSeverite, totalContreIndications };
  }
}
