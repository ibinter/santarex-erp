import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LigneEcriture } from './ligne-ecriture.entity';

export enum StatutEcriture {
  BROUILLON = 'brouillon',
  VALIDEE = 'validee',
}

/**
 * Écriture comptable (multi-lignes, partie double), scopée par tenant.
 * L'écriture doit être équilibrée : Σ débit = Σ crédit (contrôlé au service).
 */
@Entity('compta_ecritures')
@Index(['tenantId', 'numero'], { unique: true })
export class EcritureComptable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro auto (ex. 'EC-2026-00001'). */
  @Column()
  numero: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  /** Code du journal (ex. 'ACH', 'VTE', 'BAN', 'CAI', 'OD'). */
  @Column({ default: 'OD' })
  @Index()
  journal: string;

  @Column()
  libelle: string;

  @Column({ nullable: true })
  reference: string;

  @Column({ type: 'enum', enum: StatutEcriture, default: StatutEcriture.BROUILLON })
  statut: StatutEcriture;

  @Column()
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  createdById: string;

  @OneToMany(() => LigneEcriture, (ligne) => ligne.ecriture, { cascade: true })
  lignes: LigneEcriture[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
