import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  SUPERADMIN = 'superadmin',
  ADMIN = 'admin',
  MEDECIN = 'medecin',
  INFIRMIER = 'infirmier',
  CAISSIER = 'caissier',
  PHARMACIEN = 'pharmacien',
  LABORANTIN = 'laborantin',
  DRH = 'drh',
  DIRECTEUR = 'directeur',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'medecin@clinique.ci', description: 'Adresse email unique' })
  @Column({ unique: true })
  email: string;

  @Column({ select: false })
  password: string;

  @ApiProperty({ example: 'Jean', description: 'Prénom de l\'utilisateur' })
  @Column()
  firstName: string;

  @ApiProperty({ example: 'Kouassi', description: 'Nom de famille de l\'utilisateur' })
  @Column()
  lastName: string;

  @ApiProperty({ enum: UserRole, example: UserRole.MEDECIN, description: 'Rôle de l\'utilisateur' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.INFIRMIER })
  role: UserRole;

  @ApiProperty({ example: 'clinique-saint-joseph', description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ example: true, description: 'Compte actif ou non' })
  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, select: false })
  refreshToken: string;

  @Column({ nullable: true, select: false })
  resetToken?: string;

  @Column({ type: 'timestamptz', nullable: true, select: false })
  resetTokenExpiry?: Date;

  // ── Double authentification (TOTP) ────────────────────────────────────────
  @Column({ default: false })
  twoFactorEnabled: boolean;

  /** Secret TOTP chiffré (AES-256-GCM). Jamais renvoyé par l API. */
  @Column({ type: 'text', nullable: true, select: false })
  twoFactorSecret?: string | null;

  /** Empreintes SHA-256 des codes de secours restants (JSON). */
  @Column({ type: 'text', nullable: true, select: false })
  twoFactorRecoveryCodes?: string | null;

  /** Dernier pas TOTP accepté : empêche de rejouer un code. */
  @Column({ type: 'int', nullable: true })
  twoFactorLastStep?: number | null;

  /** Date de confirmation de l'adresse e-mail (null = pas encore confirmée). */
  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt?: Date | null;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
