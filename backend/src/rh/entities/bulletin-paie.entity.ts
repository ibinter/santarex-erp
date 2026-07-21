import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Employe } from './employe.entity';

export enum StatutBulletin {
  BROUILLON = 'brouillon',
  VALIDE = 'valide',
  PAYE = 'paye',
}

@Entity('rh_bulletins_paie')
@Index(['tenantId', 'employeId', 'mois'], { unique: true })
export class BulletinPaie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  employeId: string;

  @ManyToOne(() => Employe, (employe) => employe.bulletins, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'employeId' })
  employe: Employe;

  /** Période de paie au format 'YYYY-MM'. */
  @Column()
  mois: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  salaireBase: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  primes: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  retenues: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cotisationCNPS: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  impotITS: number;

  /** Total des cotisations sociales et fiscales (CNPS + ITS). */
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cotisations: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  netAPayer: number;

  @Column({ type: 'enum', enum: StatutBulletin, default: StatutBulletin.BROUILLON })
  statut: StatutBulletin;

  @Column()
  @Index()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
