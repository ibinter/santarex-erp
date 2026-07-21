import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Événement analytics minimal et anonyme émis par la landing publique
 * (visite, clics CTA, soumission démo…). Aucune donnée personnelle n'est
 * requise ; `props` reçoit un petit objet JSON libre. Table préfixée
 * `analytics_`.
 */
@Entity('analytics_events')
export class AnalyticsEvent {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'landing_visit', description: 'Nom de l\'événement' })
  @Index()
  @Column()
  event: string;

  @ApiPropertyOptional({ description: 'Propriétés libres (JSON)' })
  @Column({ type: 'jsonb', nullable: true })
  props: Record<string, unknown> | null;

  @ApiPropertyOptional({ description: 'Chemin / URL de la page' })
  @Column({ type: 'varchar', nullable: true })
  path: string | null;

  @ApiPropertyOptional({ description: 'Référent HTTP' })
  @Column({ type: 'varchar', nullable: true })
  referrer: string | null;

  @ApiPropertyOptional({ description: 'User-Agent du navigateur' })
  @Column({ type: 'varchar', length: 512, nullable: true })
  userAgent: string | null;

  @ApiProperty()
  @Index()
  @CreateDateColumn()
  createdAt: Date;
}
