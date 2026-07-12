import { IsString, IsEnum, IsOptional } from 'class-validator';
import { TicketCategorie, TicketPriorite, TicketStatut } from '../entities/support-ticket.entity';

export class CreateTicketDto {
  @IsString()
  sujet: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsEnum(TicketCategorie)
  categorie?: TicketCategorie;

  @IsOptional()
  @IsEnum(TicketPriorite)
  priorite?: TicketPriorite;
}

export class RepondreTicketDto {
  @IsString()
  message: string;
}

export class UpdateTicketStatutDto {
  @IsEnum(TicketStatut)
  statut: TicketStatut;

  @IsOptional()
  @IsEnum(TicketPriorite)
  priorite?: TicketPriorite;
}
