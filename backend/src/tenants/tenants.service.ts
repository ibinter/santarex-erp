import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant, TenantStatut } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException(`Un tenant avec le slug "${dto.slug}" existe déjà`);
    }
    const tenant = this.tenantRepository.create({ ...dto, pays: dto.pays || 'CI' });
    return this.tenantRepository.save(tenant);
  }

  /** Annule une création d'établissement restée incomplète (inscription échouée). */
  private lireParametres(t: Tenant): Record<string, any> {
    try { return t.parametresJson ? JSON.parse(t.parametresJson) : {}; } catch { return {}; }
  }

  /** Paramètres de l'établissement courant (coordonnées + préférences). */
  async getSettings(slug: string) {
    const t = await this.findBySlug(slug);
    const p = this.lireParametres(t);
    return {
      nomEtablissement: t.nom ?? '',
      ville: t.ville ?? '',
      pays: t.pays ?? '',
      telephone: t.telephone ?? '',
      email: t.email ?? '',
      twoFaEnabled: p.twoFaEnabled ?? false,
      sessionTimeoutMinutes: p.sessionTimeoutMinutes ?? 60,
      notifStock: p.notifStock ?? true,
      notifRdv: p.notifRdv ?? true,
      notifLabo: p.notifLabo ?? true,
      notifFacture: p.notifFacture ?? false,
    };
  }

  async updateSettings(slug: string, dto: Record<string, any>) {
    const t = await this.findBySlug(slug);
    if (dto.nomEtablissement !== undefined) t.nom = dto.nomEtablissement;
    if (dto.ville !== undefined) t.ville = dto.ville;
    if (dto.pays !== undefined) t.pays = dto.pays;
    if (dto.telephone !== undefined) t.telephone = dto.telephone;
    if (dto.email !== undefined) t.email = dto.email;
    const p = this.lireParametres(t);
    for (const k of ['twoFaEnabled', 'sessionTimeoutMinutes', 'notifStock', 'notifRdv', 'notifLabo', 'notifFacture']) {
      if (dto[k] !== undefined) p[k] = dto[k];
    }
    t.parametresJson = JSON.stringify(p);
    await this.tenantRepository.save(t);
    return this.getSettings(slug);
  }

  async removeBySlug(slug: string): Promise<void> {
    await this.tenantRepository.delete({ slug });
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const [data, total] = await this.tenantRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant introuvable');
    return tenant;
  }

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({ where: { slug } });
    if (!tenant) throw new NotFoundException(`Tenant "${slug}" introuvable`);
    return tenant;
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.findOne(id);
    Object.assign(tenant, dto);
    return this.tenantRepository.save(tenant);
  }

  async suspendre(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.statut = TenantStatut.SUSPENDU;
    return this.tenantRepository.save(tenant);
  }

  async activer(id: string): Promise<Tenant> {
    const tenant = await this.findOne(id);
    tenant.statut = TenantStatut.ACTIF;
    return this.tenantRepository.save(tenant);
  }

  async stats(): Promise<Record<string, number>> {
    const total = await this.tenantRepository.count();
    const actifs = await this.tenantRepository.count({ where: { statut: TenantStatut.ACTIF } });
    const suspendus = await this.tenantRepository.count({ where: { statut: TenantStatut.SUSPENDU } });
    const essai = await this.tenantRepository.count({ where: { statut: TenantStatut.ESSAI } });
    return { total, actifs, suspendus, essai };
  }
}
