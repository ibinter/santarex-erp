import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { EcritureComptable } from './ecriture-comptable.entity';

/**
 * Ligne d'écriture (mouvement sur un compte), scopée par tenant.
 * Une ligne porte soit un débit, soit un crédit (l'autre reste à 0).
 */
@Entity('compta_lignes')
export class LigneEcriture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  ecritureId: string;

  @ManyToOne(() => EcritureComptable, (ecriture) => ecriture.lignes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'ecritureId' })
  ecriture: EcritureComptable;

  /** Numéro du compte imputé (référence le plan comptable du tenant). */
  @Column()
  @Index()
  compteNumero: string;

  @Column()
  libelle: string;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  debit: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  credit: number;

  @Column()
  tenantId: string;
}
