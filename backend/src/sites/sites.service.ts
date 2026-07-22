import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull } from 'typeorm';
import { Site, StatutSite } from './entities/site.entity';
import { AffectationSite } from './entities/affectation-site.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { CreateAffectationDto } from './dto/create-affectation.dto';

@Injectable()
export class SitesService {
  constructor(
    @InjectRepository(Site)
    private readonly siteRepo: Repository<Site>,
    @InjectRepository(AffectationSite)
    private readonly affectationRepo: Repository<AffectationSite>,
  ) {}

  // ── Sites (CRUD, scoping tenant) ─────────────────────────────────────────

  findAll(tenantId: string): Promise<Site[]> {
    return this.siteRepo.find({
      where: { tenantId },
      order: { estPrincipal: 'DESC', nom: 'ASC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Site> {
    const site = await this.siteRepo.findOne({ where: { id, tenantId } });
    if (!site) throw new NotFoundException('Site introuvable');
    return site;
  }

  async create(dto: CreateSiteDto, tenantId: string): Promise<Site> {
    const existing = await this.siteRepo.findOne({
      where: { tenantId, code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Un site avec ce code existe déjà');
    }

    const site = this.siteRepo.create({ ...dto, tenantId });

    // Un seul site principal par tenant.
    if (dto.estPrincipal) {
      await this.clearPrincipal(tenantId);
    } else {
      // Le tout premier site créé devient principal par défaut.
      const count = await this.siteRepo.count({ where: { tenantId } });
      if (count === 0) site.estPrincipal = true;
    }

    return this.siteRepo.save(site);
  }

  async update(id: string, dto: UpdateSiteDto, tenantId: string): Promise<Site> {
    const site = await this.findOne(id, tenantId);

    if (dto.code && dto.code !== site.code) {
      const clash = await this.siteRepo.findOne({
        where: { tenantId, code: dto.code },
      });
      if (clash) throw new ConflictException('Un site avec ce code existe déjà');
    }

    if (dto.estPrincipal === true && !site.estPrincipal) {
      await this.clearPrincipal(tenantId);
    }

    Object.assign(site, dto);
    return this.siteRepo.save(site);
  }

  async remove(id: string, tenantId: string): Promise<{ deleted: true }> {
    const site = await this.findOne(id, tenantId);
    await this.siteRepo.remove(site);
    return { deleted: true };
  }

  private async clearPrincipal(tenantId: string): Promise<void> {
    await this.siteRepo.update({ tenantId, estPrincipal: true }, {
      estPrincipal: false,
    });
  }

  // ── Affectations du personnel ────────────────────────────────────────────

  async findAffectations(
    siteId: string,
    tenantId: string,
  ): Promise<AffectationSite[]> {
    await this.findOne(siteId, tenantId); // valide l'appartenance au tenant
    return this.affectationRepo.find({
      where: { siteId, tenantId },
      order: { dateDebut: 'DESC' },
    });
  }

  async addAffectation(
    siteId: string,
    dto: CreateAffectationDto,
    tenantId: string,
  ): Promise<AffectationSite> {
    await this.findOne(siteId, tenantId);
    const affectation = this.affectationRepo.create({
      siteId,
      userId: dto.userId,
      fonction: dto.fonction,
      dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : new Date(),
      dateFin: dto.dateFin ? new Date(dto.dateFin) : null,
      tenantId,
    });
    return this.affectationRepo.save(affectation);
  }

  async removeAffectation(
    siteId: string,
    affectationId: string,
    tenantId: string,
  ): Promise<{ deleted: true }> {
    await this.findOne(siteId, tenantId);
    const affectation = await this.affectationRepo.findOne({
      where: { id: affectationId, siteId, tenantId },
    });
    if (!affectation) throw new NotFoundException('Affectation introuvable');
    await this.affectationRepo.remove(affectation);
    return { deleted: true };
  }

  // ── Vue consolidée / stats réseau ────────────────────────────────────────

  /**
   * Détail par site : lits + effectif affecté (affectations en cours =
   * dateFin NULL). Utilisé par le tableau de bord réseau.
   */
  async consolidation(tenantId: string) {
    const sites = await this.siteRepo.find({ where: { tenantId } });

    const parSite = await Promise.all(
      sites.map(async (site) => {
        const personnelActif = await this.affectationRepo.count({
          where: { tenantId, siteId: site.id, dateFin: IsNull() },
        });
        return {
          id: site.id,
          code: site.code,
          nom: site.nom,
          type: site.type,
          ville: site.ville,
          statut: site.statut,
          estPrincipal: site.estPrincipal,
          capaciteLits: site.capaciteLits,
          personnelActif,
        };
      }),
    );

    return {
      nbSites: sites.length,
      litsTotal: sites.reduce((sum, s) => sum + (s.capaciteLits ?? 0), 0),
      personnelTotal: parSite.reduce((sum, s) => sum + s.personnelActif, 0),
      sites: parSite,
    };
  }

  /** Compteurs agrégés pour le réseau du tenant. */
  async stats(tenantId: string) {
    const sites = await this.siteRepo.find({ where: { tenantId } });
    const sitesActifs = sites.filter((s) => s.statut === StatutSite.ACTIF).length;
    const litsTotal = sites.reduce((sum, s) => sum + (s.capaciteLits ?? 0), 0);
    const personnelTotal = await this.affectationRepo.count({
      where: { tenantId, dateFin: IsNull() },
    });

    const parType: Record<string, number> = {};
    for (const s of sites) {
      parType[s.type] = (parType[s.type] ?? 0) + 1;
    }

    return {
      nbSites: sites.length,
      sitesActifs,
      sitesInactifs: sites.length - sitesActifs,
      litsTotal,
      personnelTotal,
      parType,
    };
  }
}
