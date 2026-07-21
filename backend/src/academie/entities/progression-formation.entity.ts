import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, Unique,
} from 'typeorm';
import { ProgressionStatut } from '../academie.enums';

/**
 * Suivi de progression d'un utilisateur sur une ressource de formation.
 *
 * Multi-tenant : la progression est propre à un couple (userId, tenantId).
 * Unicité (userId, ressourceId) : une seule ligne de progression par
 * utilisateur et par ressource.
 */
@Entity('academie_progressions')
@Unique('UQ_academie_progression_user_ressource', ['userId', 'ressourceId'])
export class ProgressionFormation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  userId: string;

  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @Index()
  @Column()
  ressourceId: string;

  @Column({ type: 'enum', enum: ProgressionStatut, default: ProgressionStatut.NON_COMMENCE })
  statut: ProgressionStatut;

  // Dernière consultation de la ressource par l'utilisateur.
  @Column({ type: 'timestamptz', nullable: true })
  consulteAt: Date | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
