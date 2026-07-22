import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Accès au PORTAIL PATIENT.
 *
 * Un enregistrement = un identifiant de connexion pour un patient donné, isolé
 * de l'authentification du personnel (table `users`). Le mot de passe est haché
 * en bcrypt (jamais stocké en clair) et n'est jamais sélectionné par défaut.
 *
 * Multi-tenant : la paire (tenantId, identifiant) est unique. Un patient
 * n'appartient qu'à un seul établissement ; toutes les lectures du portail sont
 * filtrées par (patientId, tenantId) issus du token portail.
 */
@Entity('acces_portail')
@Index('UQ_acces_portail_tenant_identifiant', ['tenantId', 'identifiant'], {
  unique: true,
})
export class AccesPortail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  /** Code / identifiant de connexion communiqué au patient (unique par tenant). */
  @Column()
  identifiant: string;

  /** Hash bcrypt du mot de passe — jamais renvoyé (select:false). */
  @Column({ select: false })
  motDePasseHash: string;

  @Column({ default: true })
  actif: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  dateDernierAcces: Date | null;

  @Index()
  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
