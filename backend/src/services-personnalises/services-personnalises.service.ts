import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ServicePersonnalise,
  CategorieService,
  ChampDefinition,
  TypeChamp,
} from './entities/service-personnalise.entity';
import {
  EnregistrementService,
  StatutEnregistrement,
} from './entities/enregistrement-service.entity';
import {
  CreateServicePersonnaliseDto,
  UpdateServicePersonnaliseDto,
  CreateEnregistrementDto,
  UpdateEnregistrementDto,
} from './dto/service-personnalise.dto';

@Injectable()
export class ServicesPersonnalisesService {
  private readonly logger = new Logger(ServicesPersonnalisesService.name);

  constructor(
    @InjectRepository(ServicePersonnalise)
    private readonly servicesRepo: Repository<ServicePersonnalise>,
    @InjectRepository(EnregistrementService)
    private readonly enregistrementsRepo: Repository<EnregistrementService>,
  ) {}

  // ════════════════════════════════════════════════════════════════
  //  Définitions de services personnalisés (réservé admin/directeur)
  // ════════════════════════════════════════════════════════════════

  /**
   * Normalise et valide le schéma de champs fourni par le constructeur :
   *  - identifiants de champ uniques et non vides,
   *  - un type `liste` doit fournir au moins une option.
   */
  private validerSchema(champs: ChampDefinition[]): ChampDefinition[] {
    if (!Array.isArray(champs)) {
      throw new BadRequestException('Le schéma de champs est invalide.');
    }
    const ids = new Set<string>();
    return champs.map((c, i) => {
      const id = (c.id ?? '').trim();
      const libelle = (c.libelle ?? '').trim();
      if (!id) throw new BadRequestException(`Champ #${i + 1} : identifiant manquant.`);
      if (!libelle) throw new BadRequestException(`Champ « ${id} » : libellé manquant.`);
      if (ids.has(id)) {
        throw new BadRequestException(`Identifiant de champ dupliqué : « ${id} ».`);
      }
      ids.add(id);
      if (!Object.values(TypeChamp).includes(c.type)) {
        throw new BadRequestException(`Champ « ${id} » : type inconnu.`);
      }
      let options: string[] | undefined;
      if (c.type === TypeChamp.LISTE) {
        options = (c.options ?? []).map((o) => `${o}`.trim()).filter(Boolean);
        if (options.length === 0) {
          throw new BadRequestException(
            `Champ « ${libelle} » : une liste doit contenir au moins une option.`,
          );
        }
      }
      return { id, libelle, type: c.type, options, requis: !!c.requis };
    });
  }

  async creerService(
    dto: CreateServicePersonnaliseDto,
    tenantId: string,
    userId: string,
  ): Promise<ServicePersonnalise> {
    const champsSchema = this.validerSchema(
      (dto.champsSchema ?? []) as ChampDefinition[],
    );
    const service = this.servicesRepo.create({
      tenantId,
      nom: dto.nom.trim(),
      description: dto.description?.trim() || null,
      categorie: dto.categorie,
      icone: dto.icone?.trim() || null,
      champsSchema,
      actif: dto.actif ?? true,
      creePar: userId,
    });
    const saved = await this.servicesRepo.save(service);
    this.logger.log(
      `Service personnalisé « ${saved.nom} » créé (${champsSchema.length} champs, tenant=${tenantId})`,
    );
    return saved;
  }

  async findAllServices(
    tenantId: string,
    filters: { categorie?: CategorieService; actif?: boolean; search?: string } = {},
  ): Promise<ServicePersonnalise[]> {
    const qb = this.servicesRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId });
    if (filters.categorie) {
      qb.andWhere('s.categorie = :categorie', { categorie: filters.categorie });
    }
    if (filters.actif !== undefined) {
      qb.andWhere('s.actif = :actif', { actif: filters.actif });
    }
    if (filters.search) {
      qb.andWhere('(s.nom ILIKE :q OR s.description ILIKE :q)', {
        q: `%${filters.search}%`,
      });
    }
    return qb.orderBy('s.createdAt', 'DESC').getMany();
  }

  async findOneService(id: string, tenantId: string): Promise<ServicePersonnalise> {
    const service = await this.servicesRepo.findOne({ where: { id, tenantId } });
    if (!service) {
      throw new NotFoundException(`Service personnalisé ${id} introuvable`);
    }
    return service;
  }

  async updateService(
    id: string,
    dto: UpdateServicePersonnaliseDto,
    tenantId: string,
  ): Promise<ServicePersonnalise> {
    const service = await this.findOneService(id, tenantId);
    if (dto.nom !== undefined) service.nom = dto.nom.trim();
    if (dto.description !== undefined) service.description = dto.description?.trim() || null;
    if (dto.categorie !== undefined) service.categorie = dto.categorie;
    if (dto.icone !== undefined) service.icone = dto.icone?.trim() || null;
    if (dto.champsSchema !== undefined) {
      service.champsSchema = this.validerSchema(
        dto.champsSchema as ChampDefinition[],
      );
    }
    if (dto.actif !== undefined) service.actif = dto.actif;
    return this.servicesRepo.save(service);
  }

  async removeService(id: string, tenantId: string): Promise<{ deleted: true }> {
    const service = await this.findOneService(id, tenantId);
    // On retire aussi les enregistrements rattachés (scoping tenant strict).
    await this.enregistrementsRepo.delete({
      tenantId,
      servicePersonnaliseId: service.id,
    });
    await this.servicesRepo.remove(service);
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════
  //  Enregistrements (tous rôles)
  // ════════════════════════════════════════════════════════════════

  /**
   * Valide les valeurs saisies contre le schéma de champs du service :
   *  - présence des champs requis,
   *  - cohérence de type (nombre, booléen, date, option de liste),
   *  - rejet des clés inconnues (hors schéma).
   * Retourne l'objet de valeurs nettoyé prêt à être persisté.
   */
  private validerValeurs(
    champs: ChampDefinition[],
    valeurs: Record<string, unknown>,
  ): Record<string, unknown> {
    const v = valeurs ?? {};
    const connus = new Set(champs.map((c) => c.id));
    for (const cle of Object.keys(v)) {
      if (!connus.has(cle)) {
        throw new BadRequestException(`Champ inconnu : « ${cle} ».`);
      }
    }
    const propre: Record<string, unknown> = {};
    for (const champ of champs) {
      const brut = v[champ.id];
      const vide =
        brut === undefined ||
        brut === null ||
        (typeof brut === 'string' && brut.trim() === '');

      if (vide) {
        if (champ.requis) {
          throw new BadRequestException(`Le champ « ${champ.libelle} » est requis.`);
        }
        continue;
      }

      switch (champ.type) {
        case TypeChamp.NOMBRE: {
          const n = typeof brut === 'number' ? brut : Number(brut);
          if (Number.isNaN(n)) {
            throw new BadRequestException(
              `Le champ « ${champ.libelle} » doit être un nombre.`,
            );
          }
          propre[champ.id] = n;
          break;
        }
        case TypeChamp.BOOLEEN: {
          propre[champ.id] =
            brut === true || brut === 'true' || brut === 1 || brut === '1';
          break;
        }
        case TypeChamp.DATE: {
          const d = new Date(brut as string);
          if (Number.isNaN(d.getTime())) {
            throw new BadRequestException(
              `Le champ « ${champ.libelle} » doit être une date valide.`,
            );
          }
          propre[champ.id] = (brut as string).trim();
          break;
        }
        case TypeChamp.LISTE: {
          const val = `${brut}`.trim();
          if ((champ.options ?? []).length && !champ.options!.includes(val)) {
            throw new BadRequestException(
              `Le champ « ${champ.libelle} » : valeur hors des options autorisées.`,
            );
          }
          propre[champ.id] = val;
          break;
        }
        case TypeChamp.PATIENT:
        case TypeChamp.TEXTE:
        default: {
          propre[champ.id] = `${brut}`.trim();
          break;
        }
      }
    }
    return propre;
  }

  async creerEnregistrement(
    servicePersonnaliseId: string,
    dto: CreateEnregistrementDto,
    tenantId: string,
    userId: string,
  ): Promise<EnregistrementService> {
    const service = await this.findOneService(servicePersonnaliseId, tenantId);
    if (!service.actif) {
      throw new BadRequestException(
        'Ce service est désactivé — aucune saisie possible.',
      );
    }
    const valeurs = this.validerValeurs(service.champsSchema ?? [], dto.valeurs);
    const enregistrement = this.enregistrementsRepo.create({
      tenantId,
      servicePersonnaliseId: service.id,
      patientId: dto.patientId ?? null,
      valeurs,
      statut: dto.statut ?? StatutEnregistrement.VALIDE,
      creePar: userId,
      date: dto.date ? new Date(dto.date) : new Date(),
    });
    return this.enregistrementsRepo.save(enregistrement);
  }

  async findEnregistrements(
    servicePersonnaliseId: string,
    tenantId: string,
    filters: { patientId?: string; statut?: StatutEnregistrement } = {},
  ): Promise<EnregistrementService[]> {
    // Garantit que le service appartient bien au tenant courant.
    await this.findOneService(servicePersonnaliseId, tenantId);
    const qb = this.enregistrementsRepo
      .createQueryBuilder('e')
      .where('e.tenantId = :tenantId', { tenantId })
      .andWhere('e.servicePersonnaliseId = :sid', { sid: servicePersonnaliseId });
    if (filters.patientId) {
      qb.andWhere('e.patientId = :pid', { pid: filters.patientId });
    }
    if (filters.statut) {
      qb.andWhere('e.statut = :statut', { statut: filters.statut });
    }
    return qb.orderBy('e.date', 'DESC').getMany();
  }

  async findOneEnregistrement(
    servicePersonnaliseId: string,
    id: string,
    tenantId: string,
  ): Promise<EnregistrementService> {
    const enr = await this.enregistrementsRepo.findOne({
      where: { id, tenantId, servicePersonnaliseId },
    });
    if (!enr) throw new NotFoundException(`Enregistrement ${id} introuvable`);
    return enr;
  }

  async updateEnregistrement(
    servicePersonnaliseId: string,
    id: string,
    dto: UpdateEnregistrementDto,
    tenantId: string,
  ): Promise<EnregistrementService> {
    const service = await this.findOneService(servicePersonnaliseId, tenantId);
    const enr = await this.findOneEnregistrement(servicePersonnaliseId, id, tenantId);
    if (dto.valeurs !== undefined) {
      enr.valeurs = this.validerValeurs(service.champsSchema ?? [], dto.valeurs);
    }
    if (dto.patientId !== undefined) enr.patientId = dto.patientId ?? null;
    if (dto.statut !== undefined) enr.statut = dto.statut;
    if (dto.date !== undefined) enr.date = new Date(dto.date);
    return this.enregistrementsRepo.save(enr);
  }

  async removeEnregistrement(
    servicePersonnaliseId: string,
    id: string,
    tenantId: string,
  ): Promise<{ deleted: true }> {
    const enr = await this.findOneEnregistrement(servicePersonnaliseId, id, tenantId);
    await this.enregistrementsRepo.remove(enr);
    return { deleted: true };
  }

  // ════════════════════════════════════════════════════════════════
  //  Statistiques
  // ════════════════════════════════════════════════════════════════
  async getStats(tenantId: string): Promise<{
    totalServices: number;
    servicesActifs: number;
    totalEnregistrements: number;
    parCategorie: Record<string, number>;
    enregistrementsDuMois: number;
  }> {
    const services = await this.servicesRepo.find({ where: { tenantId } });
    const totalServices = services.length;
    const servicesActifs = services.filter((s) => s.actif).length;

    const parCategorie: Record<string, number> = {};
    for (const c of Object.values(CategorieService)) parCategorie[c] = 0;
    for (const s of services) {
      parCategorie[s.categorie] = (parCategorie[s.categorie] ?? 0) + 1;
    }

    const totalEnregistrements = await this.enregistrementsRepo.count({
      where: { tenantId },
    });

    const debutMois = new Date();
    debutMois.setDate(1);
    debutMois.setHours(0, 0, 0, 0);
    const tousEnr = await this.enregistrementsRepo.find({ where: { tenantId } });
    const enregistrementsDuMois = tousEnr.filter(
      (e) => new Date(e.createdAt) >= debutMois,
    ).length;

    return {
      totalServices,
      servicesActifs,
      totalEnregistrements,
      parCategorie,
      enregistrementsDuMois,
    };
  }
}
