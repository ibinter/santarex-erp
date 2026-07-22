import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeGarde {
  GARDE_JOUR = 'garde_jour',
  GARDE_NUIT = 'garde_nuit',
  ASTREINTE = 'astreinte',
  GARDE_24H = '24h',
}

export enum StatutGarde {
  PLANIFIEE = 'planifiee',
  EFFECTUEE = 'effectuee',
  ABSENTE = 'absente',
  REMPLACEE = 'remplacee',
}

/**
 * Une garde/astreinte planifiée pour un personnel (médical ou paramédical).
 * `personnelRef` référence un utilisateur (`users.id`) ou, à défaut, un employé
 * RH (`rh_employes.id`) — l'ERP mélange les deux sources selon les modules.
 * Multi-tenant strict : `tenantId` obligatoire et indexé.
 */
@Entity('plannings_gardes')
export class Garde {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** userId (users.id) ou employeRef (rh_employes.id). */
  @Index()
  @Column()
  personnelRef: string;

  /** Service / unité (ex. Urgences, Réanimation, Maternité). */
  @Index()
  @Column()
  service: string;

  @Column({ type: 'enum', enum: TypeGarde, default: TypeGarde.GARDE_JOUR })
  typeGarde: TypeGarde;

  /** Jour de la garde (YYYY-MM-DD). */
  @Index()
  @Column({ type: 'date' })
  date: string;

  /** Heure de début (HH:mm), ex. "08:00". */
  @Column({ type: 'time' })
  heureDebut: string;

  /** Heure de fin (HH:mm), ex. "20:00". Peut être < heureDebut (garde de nuit). */
  @Column({ type: 'time' })
  heureFin: string;

  @Column({ type: 'enum', enum: StatutGarde, default: StatutGarde.PLANIFIEE })
  statut: StatutGarde;

  /** Personnel remplaçant (userId/employeRef) si la garde a été remplacée. */
  @Column({ type: 'varchar', nullable: true })
  remplacantRef: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Index()
  @Column()
  tenantId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
