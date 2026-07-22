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
import { Site } from './site.entity';

/**
 * Rattachement d'un membre du personnel (userId / employé) à un `Site`, avec la
 * fonction exercée sur ce site et une période (dateDebut → dateFin nullable =
 * affectation en cours). Portée tenant stricte via `tenantId`.
 */
@Entity('site_affectations')
@Index(['tenantId', 'siteId'])
@Index(['tenantId', 'userId'])
export class AffectationSite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  siteId: string;

  /** Référence vers l'utilisateur / employé affecté. */
  @Column()
  userId: string;

  /** Fonction ou rôle exercé sur ce site (ex. « Chef de site », « Infirmier »). */
  @Column({ nullable: true })
  fonction: string;

  @Column({ type: 'date' })
  dateDebut: Date;

  @Column({ type: 'date', nullable: true })
  dateFin: Date | null;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Site, (site) => site.affectations, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'siteId' })
  site: Site;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
