import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Budget } from './budget.entity';
import { SuiviBudgetaire } from './suivi-budgetaire.entity';

@Entity('budget_lignes')
export class LigneBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  budgetId: string;

  // Poste / rubrique budgétaire (libellé libre ou n° de compte SYSCOHADA)
  @Column()
  poste: string;

  @Column({ nullable: true })
  categorie: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  montantPrevu: number;

  // Réalisé : saisi manuellement ou agrégé depuis le suivi mensuel / comptabilité
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  montantRealise: number;

  // Écart = réalisé - prévu (stocké pour tri/reporting, recalculé à chaque MAJ)
  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  ecart: number;

  // Taux de réalisation en % (réalisé / prévu * 100)
  @Column({ type: 'numeric', precision: 6, scale: 2, default: 0 })
  tauxRealisation: number;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Budget, (budget) => budget.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budgetId' })
  budget: Budget;

  @OneToMany(() => SuiviBudgetaire, (suivi) => suivi.ligne, { cascade: true })
  suivis: SuiviBudgetaire[];
}
