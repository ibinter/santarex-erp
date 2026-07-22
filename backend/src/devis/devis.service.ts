import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DevisPatient, StatutDevis } from './entities/devis-patient.entity';
import { LigneDevis, TypeLigneDevis } from './entities/ligne-devis.entity';
import { CreateDevisDto, CreateLigneDevisDto } from './dto/create-devis.dto';
import { UpdateDevisDto } from './dto/update-devis.dto';

@Injectable()
export class DevisService {
  constructor(
    @InjectRepository(DevisPatient)
    private devisRepo: Repository<DevisPatient>,
    @InjectRepository(LigneDevis)
    private ligneRepo: Repository<LigneDevis>,
  ) {}

  private round(v: number): number {
    return Math.round(v * 100) / 100;
  }

  async genererNumero(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DEV-P-${year}-`;
    const dernier = await this.devisRepo
      .createQueryBuilder('d')
      .where('d.tenantId = :tenantId', { tenantId })
      .andWhere('d.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('d.numero', 'DESC')
      .getOne();

    let sequence = 1;
    if (dernier) {
      const parts = dernier.numero.split('-');
      sequence = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `${prefix}${String(sequence).padStart(4, '0')}`;
  }

  async create(dto: CreateDevisDto, tenantId: string, userId: string): Promise<DevisPatient> {
    const numero = await this.genererNumero(tenantId);
    const dateValidite = dto.dateValidite
      ? new Date(dto.dateValidite)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const devis = this.devisRepo.create({
      numero,
      patientId: dto.patientId,
      objet: dto.objet,
      dateValidite,
      remisePourcent: dto.remisePourcent ?? 0,
      devise: dto.devise ?? 'XOF',
      notes: dto.notes,
      tenantId,
      createdById: userId,
    });

    const saved = await this.devisRepo.save(devis);

    if (dto.lignes && dto.lignes.length > 0) {
      for (const ligneDto of dto.lignes) {
        await this.addLigneInterne(saved.id, ligneDto, tenantId);
      }
    }

    return this.recalculerTotaux(saved.id, tenantId);
  }

  private async addLigneInterne(
    devisId: string,
    dto: CreateLigneDevisDto,
    tenantId: string,
  ): Promise<LigneDevis> {
    const montantLigne = this.round(dto.quantite * dto.prixUnitaire);
    const ligne = this.ligneRepo.create({
      devisId,
      type: dto.type ?? TypeLigneDevis.AUTRE,
      designation: dto.designation,
      quantite: dto.quantite,
      prixUnitaire: dto.prixUnitaire,
      montantLigne,
      tenantId,
    });
    return this.ligneRepo.save(ligne);
  }

  async addLigne(devisId: string, dto: CreateLigneDevisDto, tenantId: string): Promise<DevisPatient> {
    const devis = await this.findOne(devisId, tenantId);
    if (devis.statut !== StatutDevis.BROUILLON) {
      throw new BadRequestException('Seul un devis en brouillon peut être modifié');
    }
    await this.addLigneInterne(devisId, dto, tenantId);
    return this.recalculerTotaux(devisId, tenantId);
  }

  async removeLigne(ligneId: string, devisId: string, tenantId: string): Promise<DevisPatient> {
    const devis = await this.findOne(devisId, tenantId);
    if (devis.statut !== StatutDevis.BROUILLON) {
      throw new BadRequestException('Seul un devis en brouillon peut être modifié');
    }
    const ligne = await this.ligneRepo.findOne({ where: { id: ligneId, devisId, tenantId } });
    if (!ligne) throw new NotFoundException('Ligne de devis non trouvée');
    await this.ligneRepo.remove(ligne);
    return this.recalculerTotaux(devisId, tenantId);
  }

  async recalculerTotaux(devisId: string, tenantId: string): Promise<DevisPatient> {
    const devis = await this.devisRepo.findOne({
      where: { id: devisId, tenantId },
      relations: ['lignes'],
    });
    if (!devis) throw new NotFoundException('Devis non trouvé');

    const montantHT = devis.lignes.reduce((sum, l) => sum + Number(l.montantLigne), 0);
    const remisePourcent = Number(devis.remisePourcent) || 0;
    const montantRemise = montantHT * (remisePourcent / 100);
    const montantTTC = montantHT - montantRemise;

    await this.devisRepo.update(devisId, {
      montantHT: this.round(montantHT),
      montantRemise: this.round(montantRemise),
      montantTTC: this.round(montantTTC),
    });

    return this.findOne(devisId, tenantId);
  }

  async update(id: string, dto: UpdateDevisDto, tenantId: string): Promise<DevisPatient> {
    const devis = await this.findOne(id, tenantId);
    if (devis.statut !== StatutDevis.BROUILLON) {
      throw new BadRequestException('Seul un devis en brouillon peut être modifié');
    }
    const { lignes, dateValidite, ...rest } = dto;
    await this.devisRepo.update(id, {
      ...rest,
      ...(dateValidite ? { dateValidite: new Date(dateValidite) } : {}),
    });
    return this.recalculerTotaux(id, tenantId);
  }

  async envoyer(id: string, tenantId: string): Promise<DevisPatient> {
    const devis = await this.findOne(id, tenantId);
    if (devis.statut !== StatutDevis.BROUILLON) {
      throw new BadRequestException('Seul un devis en brouillon peut être envoyé');
    }
    if (!devis.lignes || devis.lignes.length === 0) {
      throw new BadRequestException('Impossible d\'envoyer un devis sans ligne');
    }
    await this.devisRepo.update(id, { statut: StatutDevis.ENVOYE });
    return this.findOne(id, tenantId);
  }

  async repondre(
    id: string,
    reponse: string,
    motifRefus: string | undefined,
    tenantId: string,
  ): Promise<DevisPatient> {
    const devis = await this.findOne(id, tenantId);
    if (devis.statut !== StatutDevis.ENVOYE) {
      throw new BadRequestException('Seul un devis envoyé peut recevoir une réponse');
    }
    if (reponse === 'accepte') {
      await this.devisRepo.update(id, { statut: StatutDevis.ACCEPTE });
    } else if (reponse === 'refuse') {
      await this.devisRepo.update(id, {
        statut: StatutDevis.REFUSE,
        motifRefus: motifRefus ?? null,
      });
    } else {
      throw new BadRequestException('Réponse invalide (accepte | refuse)');
    }
    return this.findOne(id, tenantId);
  }

  /**
   * Convertit un devis accepté en facture.
   *
   * NOTE / TODO INTÉGRATION FACTURATION :
   * Ce module ne modifie pas `facturation`. La création réelle de la facture doit
   * être réalisée par `FacturationService.createFacture(...)` côté appelant (ou via
   * un futur injection croisée), à partir du payload retourné dans `factureAReprendre`.
   * Ici on se contente de marquer le devis comme `facture` et d'enregistrer le
   * `factureId` si l'appelant nous le fournit. Le mapping des types de lignes est
   * fourni ci-dessous pour faciliter la reprise.
   */
  async convertirEnFacture(
    id: string,
    tenantId: string,
    factureId?: string,
  ): Promise<{ devis: DevisPatient; factureAReprendre: any }> {
    const devis = await this.findOne(id, tenantId);
    if (devis.statut !== StatutDevis.ACCEPTE) {
      throw new BadRequestException('Seul un devis accepté peut être converti en facture');
    }
    if (devis.factureId) {
      throw new BadRequestException('Ce devis a déjà été converti en facture');
    }

    // Mapping type de ligne devis -> type de ligne facture (à reprendre par FacturationService).
    const mapType: Record<TypeLigneDevis, string> = {
      [TypeLigneDevis.CONSULTATION]: 'consultation',
      [TypeLigneDevis.ACTE]: 'acte_chirurgical',
      [TypeLigneDevis.MEDICAMENT]: 'medicament',
      [TypeLigneDevis.HOSPITALISATION]: 'hospitalisation',
      [TypeLigneDevis.AUTRE]: 'autre',
    };

    // Payload prêt à passer à FacturationService.createFacture (structure CreateFactureDto).
    const factureAReprendre = {
      patientId: devis.patientId,
      devise: devis.devise,
      notes: `Devis ${devis.numero} — ${devis.objet}`,
      lignes: (devis.lignes ?? []).map((l) => ({
        type: mapType[l.type] ?? 'autre',
        libelle: l.designation,
        quantite: Number(l.quantite),
        prixUnitaire: Number(l.prixUnitaire),
        remisePourcent: Number(devis.remisePourcent) || 0,
      })),
    };

    await this.devisRepo.update(id, {
      statut: StatutDevis.FACTURE,
      factureId: factureId ?? null,
    });

    const updated = await this.findOne(id, tenantId);
    return { devis: updated, factureAReprendre };
  }

  async findAll(
    tenantId: string,
    filters: { patientId?: string; statut?: StatutDevis },
    pagination: { page?: number; limit?: number },
  ): Promise<{ data: DevisPatient[]; total: number; page: number; limit: number }> {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.devisRepo
      .createQueryBuilder('d')
      .leftJoinAndSelect('d.lignes', 'lignes')
      .where('d.tenantId = :tenantId', { tenantId });

    if (filters.patientId) qb.andWhere('d.patientId = :patientId', { patientId: filters.patientId });
    if (filters.statut) qb.andWhere('d.statut = :statut', { statut: filters.statut });

    const [data, total] = await qb
      .orderBy('d.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return { data, total, page, limit };
  }

  async findOne(id: string, tenantId: string): Promise<DevisPatient> {
    const devis = await this.devisRepo.findOne({
      where: { id, tenantId },
      relations: ['lignes'],
    });
    if (!devis) throw new NotFoundException(`Devis ${id} non trouvé`);
    return devis;
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const devis = await this.findOne(id, tenantId);
    if (devis.statut !== StatutDevis.BROUILLON) {
      throw new BadRequestException('Seul un devis en brouillon peut être supprimé');
    }
    await this.devisRepo.remove(devis);
  }

  async getStats(tenantId: string) {
    const rows = await this.devisRepo
      .createQueryBuilder('d')
      .select('d.statut', 'statut')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(d.montantTTC), 0)', 'montant')
      .where('d.tenantId = :tenantId', { tenantId })
      .groupBy('d.statut')
      .getRawMany();

    const parStatut: Record<string, { count: number; montant: number }> = {};
    for (const s of Object.values(StatutDevis)) {
      parStatut[s] = { count: 0, montant: 0 };
    }
    let total = 0;
    for (const r of rows) {
      parStatut[r.statut] = { count: Number(r.count), montant: Number(r.montant) };
      total += Number(r.count);
    }

    const accepte = parStatut[StatutDevis.ACCEPTE].count + parStatut[StatutDevis.FACTURE].count;
    const traites =
      accepte + parStatut[StatutDevis.REFUSE].count + parStatut[StatutDevis.EXPIRE].count;
    const tauxAcceptation = traites > 0 ? Math.round((accepte / traites) * 10000) / 100 : 0;

    // Montant en attente = devis envoyés non encore répondus.
    const montantEnAttente = parStatut[StatutDevis.ENVOYE].montant;

    return {
      total,
      parStatut,
      tauxAcceptation,
      montantEnAttente,
    };
  }
}
