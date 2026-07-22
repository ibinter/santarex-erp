import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { LigneBudget } from './ligne-budget.entity';

/**
 * Réalisé mensuel d'une ligne budgétaire. Permet le suivi infra-annuel
 * (12 mois) et l'agrégation du réalisé au niveau de la ligne / du budget.
 */
@Entity('budget_suivis')
@Index(['tenantId', 'ligneBudgetId', 'mois'], { unique: true })
export class SuiviBudgetaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  ligneBudgetId: string;

  // Mois 1..12
  @Column({ type: 'int' })
  mois: number;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  montantRealiseMois: number;

  @Column({ nullable: true, type: 'text' })
  commentaire: string;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => LigneBudget, (ligne) => ligne.suivis, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ligneBudgetId' })
  ligne: LigneBudget;
}
