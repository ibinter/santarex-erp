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
