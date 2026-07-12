import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Licence, LicenceStatut, LicenceModePaiement } from './entities/licence.entity';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateLicenceDto } from './dto/create-licence.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicencesService {
  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepository: Repository<Licence>,
    private readonly offresSaasService: OffresSaasService,
    private readonly tenantsService: TenantsService,
  ) {}

  private generateCle(): string {
    const part = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 5);
    return `SRX-${part()}-${part()}-${part()}`;
  }

  async creer(dto: CreateLicenceDto, activeParId?: string): Promise<Licence> {
    const offre = await this.offresSaasService.findOne(dto.offreId);
    await this.tenantsService.findBySlug(dto.tenantSlug);

    const dateDebut = new Date(dto.dateDebut);
    let dateExpiration: Date;

    if (dto.dateExpiration) {
      dateExpiration = new Date(dto.dateExpiration);
    } else {
      dateExpiration = new Date(dateDebut);
      dateExpiration.setMonth(dateExpiration.getMonth() + 1);
    }

    const joursEssai = dto.joursEssai ?? 0;
    const statut = joursEssai > 0 ? LicenceStatut.ESSAI : LicenceStatut.ACTIVE;

    const licence = this.licenceRepository.create({
      cle: this.generateCle(),
      tenantSlug: dto.tenantSlug,
      offreId: dto.offreId,
      offreCode: offre.code,
      statut,
      dateDebut,
      dateExpiration,
      maxUtilisateurs: dto.maxUtilisateurs ?? offre.maxUtilisateurs,
      montantPaye: dto.montantPaye ?? 0,
      modePaiement: dto.modePaiement ?? LicenceModePaiement.MANUEL,
      refTransaction: dto.refTransaction,
      joursEssai,
      activeParId,
      notes: dto.notes,
      modulesActivesJson: offre.modulesInclus,
    });

    return this.licenceRepository.save(licence);
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const [data, total] = await this.licenceRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByTenant(tenantSlug: string): Promise<Licence[]> {
    return this.licenceRepository.find({
      where: { tenantSlug },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(tenantSlug: string): Promise<Licence | null> {
    const now = new Date();
    return this.licenceRepository
      .createQueryBuilder('l')
      .where('l.tenantSlug = :tenantSlug', { tenantSlug })
      .andWhere('l.statut IN (:...statuts)', { statuts: [LicenceStatut.ACTIVE, LicenceStatut.ESSAI] })
      .andWhere('l.dateExpiration > :now', { now })
      .orderBy('l.dateExpiration', 'DESC')
      .getOne();
  }

  async verifier(tenantSlug: string): Promise<{ valide: boolean; licence?: Licence; message: string }> {
    const licence = await this.findActive(tenantSlug);
    if (!licence) {
      return { valide: false, message: 'Aucune licence active pour cet établissement' };
    }
    const joursRestants = Math.ceil(
      (licence.dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return {
      valide: true,
      licence,
      message: `Licence valide — expire dans ${joursRestants} jour(s)`,
    };
  }

  async suspendre(id: string): Promise<Licence> {
    const l = await this.findOne(id);
    l.statut = LicenceStatut.SUSPENDUE;
    return this.licenceRepository.save(l);
  }

  async renouveler(id: string, mois = 1): Promise<Licence> {
    const l = await this.findOne(id);
    const base = l.dateExpiration > new Date() ? l.dateExpiration : new Date();
    const nouvelleExpiration = new Date(base);
    nouvelleExpiration.setMonth(nouvelleExpiration.getMonth() + mois);
    l.dateExpiration = nouvelleExpiration;
    l.dateDernierRenouvellement = new Date();
    l.statut = LicenceStatut.ACTIVE;
    return this.licenceRepository.save(l);
  }

  async findOne(id: string): Promise<Licence> {
    const l = await this.licenceRepository.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Licence introuvable');
    return l;
  }

  async stats(): Promise<Record<string, number>> {
    const total = await this.licenceRepository.count();
    const actives = await this.licenceRepository.count({ where: { statut: LicenceStatut.ACTIVE } });
    const essai = await this.licenceRepository.count({ where: { statut: LicenceStatut.ESSAI } });
    const suspendues = await this.licenceRepository.count({ where: { statut: LicenceStatut.SUSPENDUE } });
    return { total, actives, essai, suspendues };
  }
}
