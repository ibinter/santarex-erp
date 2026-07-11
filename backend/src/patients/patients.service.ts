import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, ILike } from 'typeorm';
import { Patient, PatientStatut } from './entities/patient.entity';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private readonly patientRepository: Repository<Patient>,
  ) {}

  async create(dto: CreatePatientDto, tenantId: string, userId: string): Promise<Patient> {
    const ipp = await this.generateIpp(tenantId);

    const patient = this.patientRepository.create({
      ...dto,
      ipp,
      tenantId,
      createdById: userId,
      pays: dto.pays || 'CI',
    });

    return this.patientRepository.save(patient);
  }

  async findAll(
    tenantId: string,
    paginationDto: PaginationDto,
  ): Promise<{ data: Patient[]; total: number; page: number; limit: number; totalPages: number }> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.patientRepository.findAndCount({
      where: { tenantId, statut: PatientStatut.ACTIF },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, tenantId: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { id, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient avec l'identifiant "${id}" introuvable`);
    }

    return patient;
  }

  async findByIpp(ipp: string, tenantId: string): Promise<Patient> {
    const patient = await this.patientRepository.findOne({
      where: { ipp, tenantId },
    });

    if (!patient) {
      throw new NotFoundException(`Patient avec l'IPP "${ipp}" introuvable`);
    }

    return patient;
  }

  async search(
    query: string,
    tenantId: string,
    paginationDto: PaginationDto = { page: 1, limit: 20 },
  ): Promise<{ data: Patient[]; total: number }> {
    const { page = 1, limit = 20 } = paginationDto;
    const skip = (page - 1) * limit;

    const qb = this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.tenantId = :tenantId', { tenantId })
      .andWhere(
        '(LOWER(patient.nom) LIKE LOWER(:q) OR LOWER(patient.prenom) LIKE LOWER(:q) OR patient.telephone LIKE :q OR patient.ipp LIKE :q)',
        { q: `%${query}%` },
      )
      .orderBy('patient.nom', 'ASC')
      .skip(skip)
      .take(limit);

    const [data, total] = await qb.getManyAndCount();
    return { data, total };
  }

  async update(id: string, dto: UpdatePatientDto, tenantId: string): Promise<Patient> {
    const patient = await this.findOne(id, tenantId);
    Object.assign(patient, dto);
    return this.patientRepository.save(patient);
  }

  async softDelete(id: string, tenantId: string): Promise<{ message: string }> {
    const patient = await this.findOne(id, tenantId);
    patient.statut = PatientStatut.INACTIF;
    await this.patientRepository.save(patient);
    return { message: `Dossier patient "${patient.nom} ${patient.prenom}" désactivé avec succès` };
  }

  async generateIpp(tenantId: string): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `${year}-`;

    // Find the last IPP for this tenant in the current year
    const lastPatient = await this.patientRepository
      .createQueryBuilder('patient')
      .where('patient.tenantId = :tenantId', { tenantId })
      .andWhere('patient.ipp LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('patient.ipp', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastPatient?.ipp) {
      const lastNumber = parseInt(lastPatient.ipp.split('-')[1], 10);
      if (!isNaN(lastNumber)) {
        nextNumber = lastNumber + 1;
      }
    }

    const paddedNumber = String(nextNumber).padStart(5, '0');
    return `${prefix}${paddedNumber}`;
  }
}
