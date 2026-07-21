import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ProspectStatut, ProspectOrigine } from '../crm.enums';

/**
 * Un prospect du CRM éditeur IBIG SOFT (piste commerciale SANTAREX).
 * Scope : superadmin (éditeur) — pas de multi-tenance client. La colonne
 * `tenantId` est conservée pour cohérence transverse (nullable) et pointe, le
 * cas échéant, vers le tenant créé une fois le prospect converti.
 */
@Entity('crm_prospects')
export class Prospect {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ── Identité ────────────────────────────────────────────────────────────
  @Column()
  nom: string;

  @Column({ nullable: true })
  prenom: string | null;

  @Column({ nullable: true })
  entreprise: string | null;

  @Column({ nullable: true })
  fonction: string | null;

  @Index()
  @Column()
  email: string;

  @Column({ nullable: true })
  telephone: string | null;

  @Column({ nullable: true })
  whatsapp: string | null;

  @Column({ nullable: true })
  pays: string | null;

  @Column({ nullable: true })
  secteur: string | null;

  // Taille de l'établissement (nb de lits / agents / tranche).
  @Column({ nullable: true })
  taille: string | null;

  // Logiciel actuellement utilisé par le prospect (concurrent / interne).
  @Column({ nullable: true })
  logiciel: string | null;

  // ── Besoin & qualification ────────────────────────────────────────────────
  @Column({ type: 'text', nullable: true })
  besoin: string | null;

  @Column({ nullable: true })
  budgetIndicatif: string | null;

  @Column({ type: 'enum', enum: ProspectOrigine, default: ProspectOrigine.MANUEL })
  @Index()
  origine: ProspectOrigine;

  @Column({ type: 'enum', enum: ProspectStatut, default: ProspectStatut.NOUVEAU })
  @Index()
  statut: ProspectStatut;

  // Score de qualification 0–100.
  @Column({ type: 'int', default: 0 })
  score: number;

  // Consentement RGPD à être recontacté.
  @Column({ default: false })
  consentement: boolean;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  // ── Suivi ─────────────────────────────────────────────────────────────────
  @Column({ nullable: true })
  prochaineAction: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  dateRelance: Date | null;

  // Agent commercial responsable (id utilisateur superadmin).
  @Column({ nullable: true })
  agentAssigne: string | null;

  // Conservée pour cohérence transverse (tenant issu de la conversion).
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
