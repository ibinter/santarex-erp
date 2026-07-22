import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  BordereauTiersPayant,
  StatutBordereau,
} from './entities/bordereau-tiers-payant.entity';
import { LigneBordereau } from './entities/ligne-bordereau.entity';
import { Assureur } from '../prise-en-charge/entities/assureur.entity';
import { CreateBordereauDto } from './dto/create-bordereau.dto';
import { CreateLigneDto } from './dto/create-ligne.dto';
import { EnregistrerPaiementDto } from './dto/enregistrer-paiement.dto';

@Injectable()
export class TiersPayantService {
  constructor(
    @InjectRepository(BordereauTiersPayant)
    private readonly bordereauRepo: Repository<BordereauTiersPayant>,
    @InjectRepository(LigneBordereau)
    private readonly ligneRepo: Repository<LigneBordereau>,
    @InjectRepository(Assureur)
    private readonly assureurRepo: Repository<Assureur>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Helpers
  // ────────────────────────────────────────────────────────────────
  private round2(v: number): number {
    return Math.round((Number(v) || 0) * 100) / 100;
  }

  private calculerMontantCouvert(montantTotal: number, taux: number): number {
    const m = Number(montantTotal) || 0;
    const t = Number(taux) || 0;
    return this.round2((m * t) / 100);
  }

  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const count = await this.bordereauRepo.count({ where: { tenantId } });
    const seq = String(count + 1).padStart(4, '0');
    return `BOR-${annee}-${seq}`;
  }

  private async findBordereauOrFail(
    id: string,
    tenantId: string,
  ): Promise<BordereauTiersPayant> {
    const bordereau = await this.bordereauRepo.findOne({
      where: { id, tenantId },
    });
    if (!bordereau) throw new NotFoundException(`Bordereau ${id} introuvable`);
    return bordereau;
  }

  /** Hydrate `assureur` (bulk, sans N+1) sur une liste de bordereaux. */
  private async enrichir(
    bordereaux: BordereauTiersPayant[],
    tenantId: string,
  ): Promise<any[]> {
    if (bordereaux.length === 0) return [];
    const assureurIds = [
      ...new Set(bordereaux.map((b) => b.assureurId).filter(Boolean)),
    ];
    const assureurs = assureurIds.length
      ? await this.assureurRepo.find({
          where: { id: In(assureurIds), tenantId },
        })
      : [];
    const aMap = new Map(assureurs.map((a) => [a.id, a]));
    return bordereaux.map((b) => {
      const a = aMap.get(b.assureurId);
      return {
        ...b,
        ecart: this.round2(
          (Number(b.montantTotalCouvert) || 0) - (Number(b.montantPaye) || 0),
        ),
        assureur: a ? { id: a.id, nom: a.nom, type: a.type } : null,
      };
    });
  }

  /** Recalcule montantTotalCouvert + nbActes depuis les lignes en base. */
  private async recalculerTotaux(bordereau: BordereauTiersPayant): Promise<void> {
    const lignes = await this.ligneRepo.find({
      where: { bordereauId: bordereau.id, tenantId: bordereau.tenantId },
    });
    bordereau.nbActes = lignes.length;
    bordereau.montantTotalCouvert = this.round2(
      lignes.reduce((acc, l) => acc + (Number(l.montantCouvert) || 0), 0),
    );
    await this.bordereauRepo.save(bordereau);
  }

  // ────────────────────────────────────────────────────────────────
  // Bordereaux — CRUD
  // ────────────────────────────────────────────────────────────────
  async create(
    dto: CreateBordereauDto,
    tenantId: string,
    userId: string,
  ): Promise<BordereauTiersPayant> {
    // Vérifie l'assureur (scoping tenant)
    const assureur = await this.assureurRepo.findOne({
      where: { id: dto.assureurId, tenantId },
    });
    if (!assureur)
      throw new NotFoundException(`Assureur ${dto.assureurId} introuvable`);

    const debut = new Date(dto.periodeDebut);
    const fin = new Date(dto.periodeFin);
    if (fin < debut) {
      throw new BadRequestException(
        'La fin de période doit être postérieure au début',
      );
    }

    const numero = await this.genererNumero(tenantId);
    const bordereau = this.bordereauRepo.create({
      numero,
      assureurId: dto.assureurId,
      periodeDebut: debut,
      periodeFin: fin,
      notes: dto.notes,
      statut: StatutBordereau.BROUILLON,
      montantTotalCouvert: 0,
      montantPaye: 0,
      nbActes: 0,
      tenantId,
      createdById: userId,
    });
    return this.bordereauRepo.save(bordereau);
  }

  async findAll(
    tenantId: string,
    filters: { assureurId?: string; statut?: StatutBordereau } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const qb = this.bordereauRepo
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId });

    if (filters.assureurId)
      qb.andWhere('b.assureurId = :assureurId', {
        assureurId: filters.assureurId,
      });
    if (filters.statut)
      qb.andWhere('b.statut = :statut', { statut: filters.statut });

    const [data, total] = await qb
      .orderBy('b.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { data: await this.enrichir(data, tenantId), total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<any> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    const lignes = await this.ligneRepo.find({
      where: { bordereauId: id, tenantId },
      order: { dateActe: 'ASC' },
    });
    const [enriched] = await this.enrichir([bordereau], tenantId);
    return { ...enriched, lignes };
  }

  async update(
    id: string,
    dto: Partial<CreateBordereauDto>,
    tenantId: string,
  ): Promise<BordereauTiersPayant> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.BROUILLON) {
      throw new BadRequestException(
        'Seul un bordereau au statut brouillon peut être modifié',
      );
    }
    if (dto.periodeDebut) bordereau.periodeDebut = new Date(dto.periodeDebut);
    if (dto.periodeFin) bordereau.periodeFin = new Date(dto.periodeFin);
    if (dto.notes !== undefined) bordereau.notes = dto.notes;
    return this.bordereauRepo.save(bordereau);
  }

  async remove(id: string, tenantId: string): Promise<{ deleted: boolean }> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.BROUILLON) {
      throw new BadRequestException(
        'Seul un bordereau au statut brouillon peut être supprimé',
      );
    }
    await this.ligneRepo.delete({ bordereauId: id, tenantId });
    await this.bordereauRepo.delete({ id, tenantId });
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // Lignes
  // ────────────────────────────────────────────────────────────────
  async findLignes(id: string, tenantId: string): Promise<LigneBordereau[]> {
    await this.findBordereauOrFail(id, tenantId);
    return this.ligneRepo.find({
      where: { bordereauId: id, tenantId },
      order: { dateActe: 'ASC' },
    });
  }

  async addLigne(
    id: string,
    dto: CreateLigneDto,
    tenantId: string,
  ): Promise<LigneBordereau> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.BROUILLON) {
      throw new BadRequestException(
        'Des lignes ne peuvent être ajoutées qu\'à un bordereau brouillon',
      );
    }
    const montantCouvert = this.calculerMontantCouvert(
      dto.montantTotal,
      dto.tauxCouverture,
    );
    const ligne = this.ligneRepo.create({
      bordereauId: id,
      factureRef: dto.factureRef,
      patientNom: dto.patientNom,
      acte: dto.acte,
      dateActe: new Date(dto.dateActe),
      montantTotal: dto.montantTotal,
      tauxCouverture: dto.tauxCouverture,
      montantCouvert,
      numeroBPC: dto.numeroBPC,
      tenantId,
    });
    const saved = await this.ligneRepo.save(ligne);
    await this.recalculerTotaux(bordereau);
    return saved;
  }

  async removeLigne(
    id: string,
    ligneId: string,
    tenantId: string,
  ): Promise<{ deleted: boolean }> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.BROUILLON) {
      throw new BadRequestException(
        'Des lignes ne peuvent être retirées que d\'un bordereau brouillon',
      );
    }
    const ligne = await this.ligneRepo.findOne({
      where: { id: ligneId, bordereauId: id, tenantId },
    });
    if (!ligne) throw new NotFoundException(`Ligne ${ligneId} introuvable`);
    await this.ligneRepo.delete({ id: ligneId, tenantId });
    await this.recalculerTotaux(bordereau);
    return { deleted: true };
  }

  // ────────────────────────────────────────────────────────────────
  // Transitions
  // ────────────────────────────────────────────────────────────────
  async emettre(id: string, tenantId: string): Promise<BordereauTiersPayant> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.BROUILLON) {
      throw new BadRequestException(
        'Seul un bordereau brouillon peut être émis',
      );
    }
    if (bordereau.nbActes === 0) {
      throw new BadRequestException(
        'Impossible d\'émettre un bordereau sans aucune ligne',
      );
    }
    bordereau.statut = StatutBordereau.EMIS;
    bordereau.dateEmission = new Date();
    return this.bordereauRepo.save(bordereau);
  }

  async envoyer(id: string, tenantId: string): Promise<BordereauTiersPayant> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (bordereau.statut !== StatutBordereau.EMIS) {
      throw new BadRequestException(
        'Seul un bordereau émis peut être marqué comme envoyé',
      );
    }
    bordereau.statut = StatutBordereau.ENVOYE;
    bordereau.dateEnvoi = new Date();
    return this.bordereauRepo.save(bordereau);
  }

  async rejeter(
    id: string,
    motif: string | undefined,
    tenantId: string,
  ): Promise<BordereauTiersPayant> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (
      ![StatutBordereau.EMIS, StatutBordereau.ENVOYE, StatutBordereau.PAYE_PARTIEL].includes(
        bordereau.statut,
      )
    ) {
      throw new BadRequestException(
        'Seul un bordereau émis, envoyé ou partiellement payé peut être rejeté',
      );
    }
    bordereau.statut = StatutBordereau.REJETE;
    bordereau.motifRejet = motif ?? null;
    return this.bordereauRepo.save(bordereau);
  }

  async enregistrerPaiement(
    id: string,
    dto: EnregistrerPaiementDto,
    tenantId: string,
  ): Promise<BordereauTiersPayant> {
    const bordereau = await this.findBordereauOrFail(id, tenantId);
    if (
      ![StatutBordereau.EMIS, StatutBordereau.ENVOYE, StatutBordereau.PAYE_PARTIEL].includes(
        bordereau.statut,
      )
    ) {
      throw new BadRequestException(
        'Un paiement ne peut être enregistré que sur un bordereau émis, envoyé ou partiellement payé',
      );
    }

    const increment = dto.increment !== false; // défaut true
    const dejaPaye = Number(bordereau.montantPaye) || 0;
    const nouveauPaye = increment
      ? this.round2(dejaPaye + (Number(dto.montant) || 0))
      : this.round2(Number(dto.montant) || 0);

    const total = Number(bordereau.montantTotalCouvert) || 0;
    if (nouveauPaye < 0) {
      throw new BadRequestException('Le montant payé ne peut être négatif');
    }

    bordereau.montantPaye = nouveauPaye;
    bordereau.datePaiement = dto.datePaiement
      ? new Date(dto.datePaiement)
      : new Date();
    if (dto.reference !== undefined) bordereau.reference = dto.reference;

    // Statut selon couverture du paiement
    if (nouveauPaye >= total && total > 0) {
      bordereau.statut = StatutBordereau.PAYE;
    } else if (nouveauPaye > 0) {
      bordereau.statut = StatutBordereau.PAYE_PARTIEL;
    }

    return this.bordereauRepo.save(bordereau);
  }

  // ────────────────────────────────────────────────────────────────
  // Stats
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const bordereaux = await this.bordereauRepo
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId })
      .getMany();

    const parStatut: Record<string, number> = {
      brouillon: 0,
      emis: 0,
      envoye: 0,
      paye_partiel: 0,
      paye: 0,
      rejete: 0,
    };
    let montantTotalCouvert = 0;
    let montantPaye = 0;
    let montantEnAttente = 0;

    // Créances (attente) regroupées par assureur
    const creancesMap = new Map<
      string,
      { assureurId: string; montantCouvert: number; montantPaye: number; enAttente: number; nbBordereaux: number }
    >();

    for (const b of bordereaux) {
      parStatut[b.statut] = (parStatut[b.statut] ?? 0) + 1;
      const couvert = Number(b.montantTotalCouvert) || 0;
      const paye = Number(b.montantPaye) || 0;
      montantTotalCouvert += couvert;
      montantPaye += paye;

      // En attente = ce qui reste dû sur les bordereaux non soldés / non rejetés
      const enAttenteBordereau =
        b.statut === StatutBordereau.REJETE || b.statut === StatutBordereau.PAYE
          ? 0
          : Math.max(0, couvert - paye);
      montantEnAttente += enAttenteBordereau;

      if (
        [
          StatutBordereau.EMIS,
          StatutBordereau.ENVOYE,
          StatutBordereau.PAYE_PARTIEL,
        ].includes(b.statut)
      ) {
        const c =
          creancesMap.get(b.assureurId) ?? {
            assureurId: b.assureurId,
            montantCouvert: 0,
            montantPaye: 0,
            enAttente: 0,
            nbBordereaux: 0,
          };
        c.montantCouvert += couvert;
        c.montantPaye += paye;
        c.enAttente += Math.max(0, couvert - paye);
        c.nbBordereaux += 1;
        creancesMap.set(b.assureurId, c);
      }
    }

    // Hydrate le nom d'assureur sur les créances
    const assureurIds = [...creancesMap.keys()];
    const assureurs = assureurIds.length
      ? await this.assureurRepo.find({
          where: { id: In(assureurIds), tenantId },
        })
      : [];
    const aMap = new Map(assureurs.map((a) => [a.id, a]));
    const creancesParAssureur = [...creancesMap.values()]
      .map((c) => ({
        ...c,
        montantCouvert: this.round2(c.montantCouvert),
        montantPaye: this.round2(c.montantPaye),
        enAttente: this.round2(c.enAttente),
        assureurNom: aMap.get(c.assureurId)?.nom ?? '—',
      }))
      .sort((a, b) => b.enAttente - a.enAttente);

    const nbImpayes = bordereaux.filter((b) =>
      [
        StatutBordereau.EMIS,
        StatutBordereau.ENVOYE,
        StatutBordereau.PAYE_PARTIEL,
      ].includes(b.statut),
    ).length;

    return {
      totalBordereaux: bordereaux.length,
      parStatut,
      montantTotalCouvert: this.round2(montantTotalCouvert),
      montantPaye: this.round2(montantPaye),
      montantEnAttente: this.round2(montantEnAttente),
      nbImpayes,
      creancesParAssureur,
    };
  }
}
