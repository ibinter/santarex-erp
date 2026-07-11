import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Antecedent } from './entities/antecedent.entity';
import { Allergie } from './entities/allergie.entity';
import { DocumentMedical } from './entities/document-medical.entity';
import { CreateAntecedentDto } from './dto/create-antecedent.dto';
import { CreateAllergieDto } from './dto/create-allergie.dto';

@Injectable()
export class DmeService {
  constructor(
    @InjectRepository(Antecedent)
    private antecedentRepository: Repository<Antecedent>,
    @InjectRepository(Allergie)
    private allergieRepository: Repository<Allergie>,
    @InjectRepository(DocumentMedical)
    private documentRepository: Repository<DocumentMedical>,
  ) {}

  async getDossierComplet(patientId: string, tenantId: string) {
    const [antecedents, allergies, documents] = await Promise.all([
      this.antecedentRepository.find({ where: { patientId, tenantId } }),
      this.allergieRepository.find({ where: { patientId, tenantId } }),
      this.documentRepository.find({ where: { patientId, tenantId } }),
    ]);

    return {
      patientId,
      antecedents,
      allergies,
      consultations: [],
      documents,
    };
  }

  async getAntecedents(patientId: string, tenantId: string) {
    return this.antecedentRepository.find({ where: { patientId, tenantId }, order: { createdAt: 'DESC' } });
  }

  async addAntecedent(
    dto: CreateAntecedentDto,
    patientId: string,
    tenantId: string,
    userId: string,
  ) {
    const antecedent = this.antecedentRepository.create({
      ...dto,
      dateDebut: dto.dateDebut ? new Date(dto.dateDebut) : undefined,
      dateFin: dto.dateFin ? new Date(dto.dateFin) : undefined,
      patientId,
      tenantId,
      createdById: userId,
    });
    return this.antecedentRepository.save(antecedent);
  }

  async updateAntecedent(
    id: string,
    dto: Partial<CreateAntecedentDto>,
    tenantId: string,
  ) {
    const antecedent = await this.antecedentRepository.findOne({ where: { id, tenantId } });
    if (!antecedent) throw new NotFoundException(`Antécédent ${id} introuvable`);
    Object.assign(antecedent, dto);
    return this.antecedentRepository.save(antecedent);
  }

  async deleteAntecedent(id: string, tenantId: string) {
    const antecedent = await this.antecedentRepository.findOne({ where: { id, tenantId } });
    if (!antecedent) throw new NotFoundException(`Antécédent ${id} introuvable`);
    await this.antecedentRepository.remove(antecedent);
    return { message: 'Antécédent supprimé avec succès' };
  }

  async getAllergies(patientId: string, tenantId: string) {
    return this.allergieRepository.find({ where: { patientId, tenantId }, order: { createdAt: 'DESC' } });
  }

  async addAllergie(
    dto: CreateAllergieDto,
    patientId: string,
    tenantId: string,
  ) {
    const allergie = this.allergieRepository.create({
      ...dto,
      patientId,
      tenantId,
    });
    return this.allergieRepository.save(allergie);
  }

  async updateAllergie(
    id: string,
    dto: Partial<CreateAllergieDto>,
    tenantId: string,
  ) {
    const allergie = await this.allergieRepository.findOne({ where: { id, tenantId } });
    if (!allergie) throw new NotFoundException(`Allergie ${id} introuvable`);
    Object.assign(allergie, dto);
    return this.allergieRepository.save(allergie);
  }

  async getDocuments(patientId: string, tenantId: string) {
    return this.documentRepository.find({
      where: { patientId, tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async addDocument(
    dto: Partial<DocumentMedical>,
    patientId: string,
    tenantId: string,
    userId: string,
  ) {
    const document = this.documentRepository.create({
      ...dto,
      patientId,
      tenantId,
      createdById: userId,
    });
    return this.documentRepository.save(document);
  }
}
