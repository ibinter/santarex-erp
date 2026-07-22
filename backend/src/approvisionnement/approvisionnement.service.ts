import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Fournisseur, TypeFournisseur } from './entities/fournisseur.entity';
import { BonCommande, StatutBonCommande } from './entities/bon-commande.entity';
import { LigneCommande } from './entities/ligne-commande.entity';
import { CreateFournisseurDto, UpdateFournisseurDto } from './dto/fournisseur.dto';
import {
  CreateBonCommandeDto,
  UpdateBonCommandeDto,
  LigneCommandeDto,
  ReceptionDto,
} from './dto/bon-commande.dto';

@Injectable()
export class ApprovisionnementService {
  constructor(
    @InjectRepository(Fournisseur)
    private readonly fournisseurRepo: Repository<Fournisseur>,
    @InjectRepository(BonCommande)
    private readonly bonRepo: Repository<BonCommande>,
    @InjectRepository(LigneCommande)
    private readonly ligneRepo: Repository<LigneCommande>,
  ) {}

  // ────────────────────────────────────────────────────────────────
  // Fournisseurs
  // ────────────────────────────────────────────────────────────────
  async createFournisseur(dto: CreateFournisseurDto, tenantId: string): Promise<Fournisseur> {
    const fournisseur = this.fournisseurRepo.create({ ...dto, tenantId });
    return this.fournisseurRepo.save(fournisseur);
  }

  async findAllFournisseurs(
    tenantId: string,
    filters: { type?: TypeFournisseur; search?: string; actif?: boolean } = {},
  ): Promise<Fournisseur[]> {
    const qb = this.fournisseurRepo
      .createQueryBuilder('f')
      .where('f.tenantId = :tenantId', { tenantId });

    if (filters.type) qb.andWhere('f.type = :type', { type: filters.type });
    if (filters.actif !== undefined) qb.andWhere('f.actif = :actif', { actif: filters.actif });
    if (filters.search) {
      qb.andWhere('(f.nom ILIKE :s OR f.contact ILIKE :s OR f.ville ILIKE :s OR f.email ILIKE :s)', {
        s: `%${filters.search}%`,
      });
    }

    return qb.orderBy('f.nom', 'ASC').getMany();
  }

  async findOneFournisseur(id: string, tenantId: string): Promise<Fournisseur> {
    const f = await this.fournisseurRepo.findOne({ where: { id, tenantId } });
    if (!f) throw new NotFoundException(`Fournisseur ${id} introuvable`);
    return f;
  }

  async updateFournisseur(id: string, dto: UpdateFournisseurDto, tenantId: string): Promise<Fournisseur> {
    const f = await this.findOneFournisseur(id, tenantId);
    Object.assign(f, dto);
    return this.fournisseurRepo.save(f);
  }

  // ────────────────────────────────────────────────────────────────
  // Génération du numéro de bon de commande : BC-AAAA-NNNN
  // ────────────────────────────────────────────────────────────────
  private async genererNumero(tenantId: string): Promise<string> {
    const annee = new Date().getFullYear();
    const prefixe = `BC-${annee}-`;
    // Compte les bons du tenant pour l'année courante.
    const count = await this.bonRepo
      .createQueryBuilder('b')
      .where('b.tenantId = :tenantId', { tenantId })
      .andWhere('b.numero LIKE :prefixe', { prefixe: `${prefixe}%` })
      .getCount();
    const seq = String(count + 1).padStart(4, '0');
    return `${prefixe}${seq}`;
  }

  // ────────────────────────────────────────────────────────────────
  // Bons de commande
  // ────────────────────────────────────────────────────────────────
  async createBonCommande(dto: CreateBonCommandeDto, tenantId: string, userId?: string): Promise<BonCommande> {
    // Vérifie que le fournisseur existe (scoping tenant).
    await this.findOneFournisseur(dto.fournisseurId, tenantId);

    const numero = await this.genererNumero(tenantId);
    const bon = this.bonRepo.create({
      numero,
      fournisseurId: dto.fournisseurId,
      dateCommande: dto.dateCommande ? new Date(dto.dateCommande) : new Date(),
      dateLivraisonPrevue: dto.dateLivraisonPrevue ? new Date(dto.dateLivraisonPrevue) : null,
      statut: StatutBonCommande.BROUILLON,
      notes: dto.notes,
      devise: dto.devise ?? 'XOF',
      montantTotal: 0,
      tenantId,
      createdById: userId,
    });
    const saved = await this.bonRepo.save(bon);

    await this.remplacerLignes(saved.id, dto.lignes, tenantId);
    await this.recalculerMontant(saved.id, tenantId);

    return this.findOneBonCommande(saved.id, tenantId);
  }

  /** Recrée l'intégralité des lignes d'un bon (utilisé à la création et à l'édition brouillon). */
  private async remplacerLignes(
    bonCommandeId: string,
    lignes: LigneCommandeDto[],
    tenantId: string,
  ): Promise<void> {
    await this.ligneRepo.delete({ bonCommandeId, tenantId });
    const entites = lignes.map((l) =>
      this.ligneRepo.create({
        bonCommandeId,
        designation: l.designation,
        medicamentId: l.medicamentId ?? null,
        quantiteCommandee: l.quantiteCommandee,
        quantiteRecue: 0,
        prixUnitaire: l.prixUnitaire,
        montantLigne: Number((l.quantiteCommandee * l.prixUnitaire).toFixed(2)),
        tenantId,
      }),
    );
    await this.ligneRepo.save(entites);
  }

  /** Recalcule montantTotal du bon à partir de ses lignes. */
  private async recalculerMontant(bonCommandeId: string, tenantId: string): Promise<void> {
    const lignes = await this.ligneRepo.find({ where: { bonCommandeId, tenantId } });
    const total = lignes.reduce((acc, l) => acc + Number(l.montantLigne), 0);
    await this.bonRepo.update({ id: bonCommandeId, tenantId }, { montantTotal: Number(total.toFixed(2)) });
  }

  async findAllBonsCommande(
    tenantId: string,
    filters: { statut?: StatutBonCommande; fournisseurId?: string; search?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ): Promise<{ data: any[]; total: number; page: number; limit: number }> {
    const { page = 1, limit = 20 } = pagination;
    const skip = (page - 1) * limit;

    const qb = this.bonRepo.createQueryBuilder('b').where('b.tenantId = :tenantId', { tenantId });
    if (filters.statut) qb.andWhere('b.statut = :statut', { statut: filters.statut });
    if (filters.fournisseurId) qb.andWhere('b.fournisseurId = :fid', { fid: filters.fournisseurId });
    if (filters.search) qb.andWhere('b.numero ILIKE :s', { s: `%${filters.search}%` });

    const [bons, total] = await qb
      .orderBy('b.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    const data = await this.enrichirBons(bons, tenantId);
    return { data, total, page, limit };
  }

  /** Hydrate en bulk le fournisseur de chaque bon (pas de N+1). */
  private async enrichirBons(bons: BonCommande[], tenantId: string): Promise<any[]> {
    if (bons.length === 0) return [];
    const fIds = [...new Set(bons.map((b) => b.fournisseurId).filter(Boolean))];
    const fournisseurs = fIds.length
      ? await this.fournisseurRepo.find({ where: { id: In(fIds), tenantId } })
      : [];
    const fMap = new Map(fournisseurs.map((f) => [f.id, f]));
    return bons.map((b) => ({
      ...b,
      fournisseur: fMap.get(b.fournisseurId)
        ? { id: b.fournisseurId, nom: fMap.get(b.fournisseurId)!.nom, type: fMap.get(b.fournisseurId)!.type }
        : null,
    }));
  }

  async findOneBonCommande(id: string, tenantId: string): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de commande ${id} introuvable`);
    const lignes = await this.ligneRepo.find({
      where: { bonCommandeId: id, tenantId },
      order: { createdAt: 'ASC' },
    });
    const fournisseur = await this.fournisseurRepo.findOne({
      where: { id: bon.fournisseurId, tenantId },
    });
    return {
      ...bon,
      fournisseur: fournisseur
        ? { id: fournisseur.id, nom: fournisseur.nom, type: fournisseur.type }
        : null,
      lignes,
    };
  }

  async updateBonCommande(id: string, dto: UpdateBonCommandeDto, tenantId: string): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de commande ${id} introuvable`);
    if (bon.statut !== StatutBonCommande.BROUILLON) {
      throw new BadRequestException('Seul un bon en brouillon peut être modifié.');
    }
    if (dto.fournisseurId) {
      await this.findOneFournisseur(dto.fournisseurId, tenantId);
      bon.fournisseurId = dto.fournisseurId;
    }
    if (dto.dateCommande) bon.dateCommande = new Date(dto.dateCommande);
    if (dto.dateLivraisonPrevue !== undefined) {
      bon.dateLivraisonPrevue = dto.dateLivraisonPrevue ? new Date(dto.dateLivraisonPrevue) : null;
    }
    if (dto.notes !== undefined) bon.notes = dto.notes;
    await this.bonRepo.save(bon);

    if (dto.lignes) {
      await this.remplacerLignes(id, dto.lignes, tenantId);
      await this.recalculerMontant(id, tenantId);
    }
    return this.findOneBonCommande(id, tenantId);
  }

  // ────────────────────────────────────────────────────────────────
  // Transitions de statut
  // ────────────────────────────────────────────────────────────────
  async envoyer(id: string, tenantId: string): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de commande ${id} introuvable`);
    if (bon.statut !== StatutBonCommande.BROUILLON) {
      throw new BadRequestException('Seul un bon en brouillon peut être envoyé.');
    }
    const nbLignes = await this.ligneRepo.count({ where: { bonCommandeId: id, tenantId } });
    if (nbLignes === 0) {
      throw new BadRequestException('Impossible d\'envoyer un bon sans ligne.');
    }
    bon.statut = StatutBonCommande.ENVOYEE;
    await this.bonRepo.save(bon);
    return this.findOneBonCommande(id, tenantId);
  }

  async annuler(id: string, tenantId: string): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de commande ${id} introuvable`);
    if (bon.statut === StatutBonCommande.RECUE) {
      throw new BadRequestException('Un bon entièrement reçu ne peut être annulé.');
    }
    bon.statut = StatutBonCommande.ANNULEE;
    await this.bonRepo.save(bon);
    return this.findOneBonCommande(id, tenantId);
  }

  /**
   * Réception (totale ou partielle) : incrémente quantiteRecue de chaque ligne,
   * puis calcule le statut résultant (partiellement_recue / recue).
   *
   * IMPORTANT — INTÉGRATION STOCK PHARMACIE :
   * À la réception, on connaît, pour chaque ligne liée à un médicament
   * (`ligne.medicamentId != null`), la quantité reçue. On DOIT à terme
   * incrémenter le stock pharmacie correspondant (entrée de lot). Ce module
   * NE MODIFIE PAS le module pharmacie (autre équipe) : on se contente de
   * calculer et d'exposer `receptionsStock` ci-dessous.
   *
   * TODO(intégration stock) : câbler l'appel à
   * PharmacieService.entreeStock(medicamentId, { quantite, numeroLot,
   * datePeremption, fournisseur, prixAchat }, tenantId, userId) pour chaque
   * entrée de `receptionsStock`. Nécessite d'importer PharmacieModule /
   * PharmacieService et de faire remonter numéro de lot + péremption
   * (champs à ajouter au ReceptionDto lorsque l'intégration sera activée).
   */
  async receptionner(
    id: string,
    dto: ReceptionDto,
    tenantId: string,
    userId?: string,
  ): Promise<any> {
    const bon = await this.bonRepo.findOne({ where: { id, tenantId } });
    if (!bon) throw new NotFoundException(`Bon de commande ${id} introuvable`);
    if (![StatutBonCommande.ENVOYEE, StatutBonCommande.PARTIELLEMENT_RECUE].includes(bon.statut)) {
      throw new BadRequestException(
        'Seul un bon envoyé ou partiellement reçu peut être réceptionné.',
      );
    }

    const lignes = await this.ligneRepo.find({ where: { bonCommandeId: id, tenantId } });
    const ligneMap = new Map(lignes.map((l) => [l.id, l]));

    // Entrées de stock à câbler ultérieurement (lignes liées à un médicament).
    const receptionsStock: { medicamentId: string; quantite: number; designation: string }[] = [];

    for (const rec of dto.lignes) {
      const ligne = ligneMap.get(rec.ligneId);
      if (!ligne) {
        throw new BadRequestException(`Ligne ${rec.ligneId} absente de ce bon.`);
      }
      const nouvelleQte = ligne.quantiteRecue + rec.quantiteRecue;
      if (nouvelleQte > ligne.quantiteCommandee) {
        throw new BadRequestException(
          `Ligne "${ligne.designation}" : quantité reçue (${nouvelleQte}) supérieure à la quantité commandée (${ligne.quantiteCommandee}).`,
        );
      }
      ligne.quantiteRecue = nouvelleQte;
      await this.ligneRepo.save(ligne);

      if (ligne.medicamentId && rec.quantiteRecue > 0) {
        receptionsStock.push({
          medicamentId: ligne.medicamentId,
          quantite: rec.quantiteRecue,
          designation: ligne.designation,
        });
      }
    }

    // Recalcule le statut global du bon.
    const lignesMaj = await this.ligneRepo.find({ where: { bonCommandeId: id, tenantId } });
    const toutRecu = lignesMaj.every((l) => l.quantiteRecue >= l.quantiteCommandee);
    const rienRecu = lignesMaj.every((l) => l.quantiteRecue === 0);
    bon.statut = toutRecu
      ? StatutBonCommande.RECUE
      : rienRecu
        ? StatutBonCommande.ENVOYEE
        : StatutBonCommande.PARTIELLEMENT_RECUE;
    await this.bonRepo.save(bon);

    const detail = await this.findOneBonCommande(id, tenantId);
    return {
      ...detail,
      // Exposé pour câblage futur du stock pharmacie (cf. TODO ci-dessus).
      receptionsStock,
    };
  }

  // ────────────────────────────────────────────────────────────────
  // Statistiques
  // ────────────────────────────────────────────────────────────────
  async getStats(tenantId: string): Promise<any> {
    const [totalFournisseurs, fournisseursActifs] = await Promise.all([
      this.fournisseurRepo.count({ where: { tenantId } }),
      this.fournisseurRepo.count({ where: { tenantId, actif: true } }),
    ]);

    const bons = await this.bonRepo.find({ where: { tenantId } });
    const parStatut = (s: StatutBonCommande) => bons.filter((b) => b.statut === s).length;

    const enCours = bons.filter((b) =>
      [
        StatutBonCommande.ENVOYEE,
        StatutBonCommande.PARTIELLEMENT_RECUE,
      ].includes(b.statut),
    );
    // Montant engagé = total des bons non finalisés (envoyés/partiels) et non annulés.
    const montantEngage = enCours.reduce((acc, b) => acc + Number(b.montantTotal), 0);

    return {
      totalFournisseurs,
      fournisseursActifs,
      totalCommandes: bons.length,
      commandes: {
        brouillon: parStatut(StatutBonCommande.BROUILLON),
        envoyee: parStatut(StatutBonCommande.ENVOYEE),
        partiellementRecue: parStatut(StatutBonCommande.PARTIELLEMENT_RECUE),
        recue: parStatut(StatutBonCommande.RECUE),
        annulee: parStatut(StatutBonCommande.ANNULEE),
      },
      commandesEnCours: enCours.length,
      montantEngageXOF: Number(montantEngage.toFixed(2)),
    };
  }
}
