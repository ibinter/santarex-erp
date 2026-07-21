import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Compteur d'usage de l'assistant IA, agrégé par tenant, utilisateur et jour.
 *
 * Une ligne par (tenantId, userId, date). Sert à la fois au contrôle de quota
 * (somme des messages du jour par tenant) et à la journalisation d'usage
 * affichée dans la console superadmin. La question n'est PAS stockée en clair :
 * seul un extrait tronqué (`dernierApercu`) est conservé pour audit léger.
 */
@Entity('ai_usage')
@Index('IDX_ai_usage_tenant_date', ['tenantId', 'date'])
@Index('UQ_ai_usage_tenant_user_date', ['tenantId', 'userId', 'date'], { unique: true })
export class AiUsage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  tenantId: string;

  @Column()
  userId: string;

  /** Jour calendaire au format YYYY-MM-DD (clé d'agrégation). */
  @Column({ type: 'date' })
  date: string;

  @Column({ type: 'int', default: 0 })
  nbMessages: number;

  @Column({ type: 'int', default: 0 })
  nbTokensEstimes: number;

  /** Dernier fournisseur LLM utilisé sur cette ligne (groq/anthropic/openai). */
  @Column({ nullable: true })
  dernierProvider: string;

  /** Extrait tronqué (<=120 car.) de la dernière question, pour audit léger. */
  @Column({ type: 'varchar', length: 160, nullable: true })
  dernierApercu: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
