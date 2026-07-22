import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SensMessage {
  ENTRANT = 'entrant',
  SORTANT = 'sortant',
}

export enum ProtocoleMessage {
  HL7 = 'hl7',
  DICOM = 'dicom',
  REST = 'rest',
}

export enum StatutMessage {
  RECU = 'recu',
  TRAITE = 'traite',
  ERREUR = 'erreur',
}

/**
 * Journal d'un message d'interopérabilité (entrant ou sortant), tous protocoles
 * confondus. Sert de piste d'audit et de file de retraitement.
 */
@Entity('interop_messages')
export class MessageInterop {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Établissement propriétaire (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ enum: SensMessage })
  @Column({ type: 'enum', enum: SensMessage })
  sens: SensMessage;

  @ApiProperty({ enum: ProtocoleMessage })
  @Column({ type: 'enum', enum: ProtocoleMessage })
  protocole: ProtocoleMessage;

  @ApiPropertyOptional({ description: 'Type / événement métier (ex. resultat.pret, ORU^R01)' })
  @Column({ nullable: true })
  type: string;

  @ApiProperty({ description: 'Contenu brut du message (texte HL7, JSON REST…)' })
  @Column({ type: 'text' })
  contenu: string;

  @ApiProperty({ enum: StatutMessage, default: StatutMessage.RECU })
  @Column({ type: 'enum', enum: StatutMessage, default: StatutMessage.RECU })
  statut: StatutMessage;

  @ApiPropertyOptional({ description: 'Message d\'erreur si le traitement a échoué' })
  @Column({ type: 'text', nullable: true })
  erreur: string;

  @ApiPropertyOptional({
    description: 'Données extraites / résultat de parsing (JSON)',
    type: 'object',
  })
  @Column({ type: 'jsonb', nullable: true })
  donneesJson: Record<string, unknown>;

  @ApiProperty()
  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
