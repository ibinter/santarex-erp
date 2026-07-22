import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutSejourMorgue {
  EN_CHAMBRE = 'en_chambre',
  REMIS = 'remis',
}

@Entity('morgue_sejours')
export class SejourMorgue {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du décès associé' })
  @Index()
  @Column()
  decesId: string;

  @ApiProperty({ description: 'ID du casier occupé' })
  @Index()
  @Column()
  casierId: string;

  @ApiProperty({ description: 'Date et heure d\'entrée en chambre froide' })
  @Column({ type: 'timestamp' })
  dateEntree: Date;

  @ApiPropertyOptional({ description: 'Date et heure de sortie / remise du corps' })
  @Column({ type: 'timestamp', nullable: true })
  dateSortie: Date | null;

  @ApiProperty({ enum: StatutSejourMorgue, default: StatutSejourMorgue.EN_CHAMBRE, description: 'Statut du séjour morgue' })
  @Column({ type: 'enum', enum: StatutSejourMorgue, default: StatutSejourMorgue.EN_CHAMBRE })
  statut: StatutSejourMorgue;

  @ApiProperty({ description: 'Tarif journalier de conservation (FCFA)' })
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  tarifJournalier: number;

  @ApiPropertyOptional({ description: 'Frais de conservation calculés à la remise (FCFA)' })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  fraisConservation: number | null;

  @ApiPropertyOptional({ description: 'Nom de la personne à qui le corps est remis' })
  @Column({ nullable: true })
  personneRemiseNom: string | null;

  @ApiPropertyOptional({ description: 'Lien de la personne avec le défunt' })
  @Column({ nullable: true })
  personneRemiseLien: string | null;

  @ApiPropertyOptional({ description: 'Pièce d\'identité de la personne recevant le corps' })
  @Column({ nullable: true })
  personneRemisePiece: string | null;

  @ApiPropertyOptional({ description: 'Référence de l\'agent ayant procédé à la remise' })
  @Column({ nullable: true })
  agentRef: string | null;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur créateur' })
  @Column({ nullable: true })
  createdById: string | null;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
