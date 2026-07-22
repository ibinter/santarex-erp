import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum StatutSessionCaisse {
  OUVERTE = 'ouverte',
  CLOTUREE = 'cloturee',
}

/**
 * Session de caisse : ouverture / clôture avec comptage et écart.
 * Un seul enregistrement OUVERTE par caissier et par tenant à la fois.
 * Montants stockés en numeric ; toujours relus via Number()||0 côté service.
 */
@Entity('caisse_sessions')
export class SessionCaisse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro auto CAI-AAAA-NNNN */
  @Column()
  @Index()
  numero: string;

  /** Référence utilisateur du caissier (user id) */
  @Column()
  @Index()
  caissierRef: string;

  @Column({ type: 'timestamp', default: () => 'now()' })
  dateOuverture: Date;

  @Column({ type: 'timestamp', nullable: true })
  dateCloture: Date | null;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  fondCaisseInitial: number;

  /** Fond initial + total espèces encaissées (calculé à la clôture) */
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  montantTheoriqueEspeces: number;

  /** Espèces réellement comptées à la clôture (saisi) */
  @Column({ type: 'numeric', precision: 14, scale: 2, nullable: true })
  montantCompteEspeces: number | null;

  /** montantCompteEspeces - montantTheoriqueEspeces (négatif = manquant) */
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  ecart: number;

  /** Total encaissé toutes modes confondues sur la session */
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  totalEncaisse: number;

  /** Répartition des encaissements par mode : { especes: 1000, mobile_money: 500 } */
  @Column({ type: 'jsonb', default: () => "'{}'::jsonb" })
  totauxParMode: Record<string, number>;

  @Column({ type: 'enum', enum: StatutSessionCaisse, default: StatutSessionCaisse.OUVERTE })
  statut: StatutSessionCaisse;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column()
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
