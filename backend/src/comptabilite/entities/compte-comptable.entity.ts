import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Nature comptable du compte (dérivée de la classe SYSCOHADA).
 * Sert à orienter l'affichage (débit/crédit) et le bilan.
 */
export enum TypeCompte {
  ACTIF = 'actif', // classes 2 (immobilisations), partie de 3/4/5
  PASSIF = 'passif', // classes 1 (capitaux), partie de 4
  CHARGE = 'charge', // classe 6
  PRODUIT = 'produit', // classe 7
  TRESORERIE = 'tresorerie', // classe 5
}

/**
 * Compte du plan comptable SYSCOHADA (simplifié), scopé par tenant.
 * Un même numéro de compte est unique au sein d'un tenant.
 */
@Entity('compta_comptes')
@Index(['tenantId', 'numero'], { unique: true })
export class CompteComptable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Numéro SYSCOHADA (ex. '706', '601', '411', '512'). */
  @Column()
  numero: string;

  @Column()
  libelle: string;

  /** Classe SYSCOHADA (1 à 8). */
  @Column({ type: 'int' })
  classe: number;

  @Column({ type: 'enum', enum: TypeCompte })
  type: TypeCompte;

  @Column()
  @Index()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
