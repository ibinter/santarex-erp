import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OffreSaas } from './entities/offre-saas.entity';
import { CreateOffreSaasDto } from './dto/create-offre-saas.dto';
import { UpdateOffreSaasDto } from './dto/update-offre-saas.dto';

@Injectable()
export class OffresSaasService {
  constructor(
    @InjectRepository(OffreSaas)
    private readonly offreRepository: Repository<OffreSaas>,
  ) {}

  async create(dto: CreateOffreSaasDto): Promise<OffreSaas> {
    const existing = await this.offreRepository.findOne({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Une offre avec le code "${dto.code}" existe déjà`);
    return this.offreRepository.save(this.offreRepository.create(dto));
  }

  async findAll(visibleOnly = false): Promise<OffreSaas[]> {
    const where: any = { estActif: true };
    if (visibleOnly) where.estVisible = true;
    return this.offreRepository.find({ where, order: { ordre: 'ASC', prix: 'ASC' } });
  }

  async findOne(id: string): Promise<OffreSaas> {
    const offre = await this.offreRepository.findOne({ where: { id } });
    if (!offre) throw new NotFoundException('Offre introuvable');
    return offre;
  }

  async findByCode(code: string): Promise<OffreSaas> {
    const offre = await this.offreRepository.findOne({ where: { code } });
    if (!offre) throw new NotFoundException(`Offre "${code}" introuvable`);
    return offre;
  }

  async update(id: string, dto: UpdateOffreSaasDto): Promise<OffreSaas> {
    const offre = await this.findOne(id);
    Object.assign(offre, dto);
    return this.offreRepository.save(offre);
  }

  async desactiver(id: string): Promise<OffreSaas> {
    const offre = await this.findOne(id);
    offre.estActif = false;
    return this.offreRepository.save(offre);
  }
}
