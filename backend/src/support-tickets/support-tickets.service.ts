import { Injectable, Logger, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { SupportTicket, TicketStatut } from './entities/support-ticket.entity';
import { CreateTicketDto, RepondreTicketDto, UpdateTicketStatutDto } from './dto/ticket.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class SupportTicketsService {
  private readonly logger = new Logger(SupportTicketsService.name);

  constructor(
    @InjectRepository(SupportTicket)
    private readonly repo: Repository<SupportTicket>,
    private readonly mailService: MailService,
  ) {}

  /** Extrait un prénom exploitable depuis un nom complet « Prénom Nom ». */
  private prenomFrom(nomComplet?: string | null): string {
    const first = (nomComplet ?? '').trim().split(/\s+/)[0];
    return first || 'Cher client';
  }

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
    const saved = await this.repo.save(ticket);

    // Accusé de réception — best-effort, ne bloque jamais la création du ticket.
    if (user.email) {
      this.mailService
        .envoyerTicketCree({
          to: user.email,
          prenom: user.prenom || this.prenomFrom(`${user.prenom} ${user.nom}`),
          numero: saved.numero,
          objet: saved.sujet,
        })
        .catch((err) =>
          this.logger.error(`Email ticket créé ${saved.numero} échoué: ${err.message}`),
        );
    }

    return saved;
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
    const passeAResolu =
      dto.statut === TicketStatut.RESOLU && ticket.statut !== TicketStatut.RESOLU;
    if (dto.statut === TicketStatut.RESOLU) updates.resoluAt = new Date();
    await this.repo.update(ticket.id, updates);

    // Notification de résolution — envoyée UNE seule fois (transition → RESOLU),
    // best-effort, ne bloque jamais la mise à jour du statut.
    if (passeAResolu && ticket.auteurEmail) {
      this.mailService
        .envoyerTicketResolu({
          to: ticket.auteurEmail,
          prenom: this.prenomFrom(ticket.auteurNom),
          numero: ticket.numero,
        })
        .catch((err) =>
          this.logger.error(`Email ticket résolu ${ticket.numero} échoué: ${err.message}`),
        );
    }

    return this.repo.findOne({ where: { id } });
  }
}
