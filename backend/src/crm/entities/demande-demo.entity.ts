import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { DemandeDemoStatut, ModeDemo } from '../crm.enums';

/**
 * Une demande de démonstration rattachée à un prospect du CRM éditeur.
 * Alimente le pipeline de démos à planifier / réaliser.
 */
@Entity('crm_demandes_demo')
export class DemandeDemo {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  prospectId: string;

  @Column({ type: 'timestamptz', nullable: true })
  dateSouhaitee: Date | null;

  @Column({ type: 'enum', enum: ModeDemo, default: ModeDemo.VISIO })
  modeDemo: ModeDemo;

  @Column({ type: 'enum', enum: DemandeDemoStatut, default: DemandeDemoStatut.DEMANDEE })
  @Index()
  statut: DemandeDemoStatut;

  // Agent commercial assigné à la démo (id utilisateur superadmin).
  @Column({ nullable: true })
  agentAssigne: string | null;

  // Lien de visioconférence (Meet / Zoom / Teams…).
  @Column({ type: 'text', nullable: true })
  lienVisio: string | null;

  @Column({ type: 'text', nullable: true })
  compteRendu: string | null;

  // Tenant éventuellement créé à l'issue de la démo (conversion).
  @Column({ nullable: true })
  tenantCree: string | null;

  // Conservée pour cohérence transverse.
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
