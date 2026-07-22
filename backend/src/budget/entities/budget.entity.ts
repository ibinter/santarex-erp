import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LigneBudget } from './ligne-budget.entity';

export enum TypeBudget {
  RECETTES = 'recettes',
  DEPENSES = 'depenses',
}

export enum StatutBudget {
  BROUILLON = 'brouillon',
  VALIDE = 'valide',
  CLOTURE = 'cloture',
}

@Entity('budgets')
@Index(['tenantId', 'exercice'])
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  libelle: string;

  // Année budgétaire (exercice comptable), ex. 2026
  @Column({ type: 'int' })
  @Index()
  exercice: number;

  @Column({ type: 'enum', enum: TypeBudget, default: TypeBudget.DEPENSES })
  type: TypeBudget;

  // Service / centre de coût optionnel (ex. « Pharmacie », « Laboratoire »)
  @Column({ nullable: true })
  service: string;

  // Poste / rubrique de regroupement optionnel
  @Column({ nullable: true })
  poste: string;

  @Column({ type: 'enum', enum: StatutBudget, default: StatutBudget.BROUILLON })
  statut: StatutBudget;

  @Column({ default: 'XOF' })
  devise: string;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @Column({ nullable: true })
  createdById: string;

  @OneToMany(() => LigneBudget, (ligne) => ligne.budget, { cascade: true })
  lignes: LigneBudget[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
