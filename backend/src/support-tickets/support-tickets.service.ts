import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SupportTicket, TicketStatut } from './entities/support-ticket.entity';
import { CreateTicketDto, RepondreTicketDto, UpdateTicketStatutDto } from './dto/ticket.dto';

@Injectable()
export class SupportTicketsService {
  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
  ) {}

  private genNumero(): string {
    const ts = Date.now().toString().slice(-6);
    return `TKT-${ts}`;
  }

  async creer(dto: CreateTicketDto, user: { id: string; nom: string; prenom: string; email: string; tenantId: string }): Promise<SupportTicket> {
    const ticket = this.repo.create({
      numero: this.genNumero(),
      tenantId: user.tenantId,
      auteurId: user.id,
      auteurNom: `${user.prenom} ${user.nom}`,
      auteurEmail: user.email,
      sujet: dto.sujet,
      message: dto.message,
      categorie: dto.categorie,
      priorite: dto.priorite,
      reponses: [],
    });
    return this.repo.save(ticket);
  }

  async findAll(tenantId: string, isSuperAdmin = false): Promise<SupportTicket[]> {
    const where = isSuperAdmin ? {} : { tenantId };
    return this.repo.find({ where, order: { updatedAt: 'DESC' }, take: 100 });
  }

  async findOne(id: string, tenantId: string, isSuperAdmin = false): Promise<SupportTicket> {
    const ticket = await this.repo.findOne({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket introuvable');
    if (!isSuperAdmin && ticket.tenantId !== tenantId) throw new ForbiddenException();
    return ticket;
  }

  async repondre(id: string, dto: RepondreTicketDto, user: { id: string; nom: string; prenom: string; tenantId: string; role: string }): Promise<SupportTicket> {
    const isSuperAdmin = user.role === 'superadmin';
    const ticket = await this.findOne(id, user.tenantId, isSuperAdmin);

    const reponse = {
      id: uuidv4(),
      auteurId: user.id,
      auteurNom: `${user.prenom} ${user.nom}`,
      estAdmin: isSuperAdmin,
      message: dto.message,
      createdAt: new Date().toISOString(),
    };

    const reponses = [...(ticket.reponses ?? []), reponse];
    const statut = isSuperAdmin && ticket.statut === TicketStatut.OUVERT ? TicketStatut.EN_COURS : ticket.statut;

    await this.repo.update(id, { reponses, statut });
    return this.repo.findOne({ where: { id } });
  }

  async updateStatut(id: string, dto: UpdateTicketStatutDto, tenantId: string): Promise<SupportTicket> {
    const ticket = await this.findOne(id, tenantId, true);
    const updates: Partial<SupportTicket> = { statut: dto.statut };
    if (dto.priorite) updates.priorite = dto.priorite;
    if (dto.statut === TicketStatut.RESOLU) updates.resoluAt = new Date();
    await this.repo.update(ticket.id, updates);
    return this.repo.findOne({ where: { id } });
  }
}
