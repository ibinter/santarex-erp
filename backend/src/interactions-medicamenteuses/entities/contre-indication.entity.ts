import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GraviteContreIndication } from '../interactions.enums';

/**
 * Référentiel des contre-indications liées au terrain / état du patient
 * (ex. grossesse, insuffisance rénale, asthme, allaitement…).
 *
 * Multi-tenant : `tenantId` nullable (null = référentiel global partagé).
 * `dci` et `condition` sont stockées NORMALISÉES (minuscules).
 */
@Entity('contre_indications')
@Index('IDX_contre_indications_dci_condition', ['dci', 'condition'])
export class ContreIndication {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'ains', description: 'DCI ou classe concernée, normalisée' })
  @Index()
  @Column()
  dci: string;

  @ApiProperty({ example: 'grossesse', description: 'Terrain / état contre-indiqué, normalisé' })
  @Index()
  @Column()
  condition: string;

  @ApiProperty({ enum: GraviteContreIndication })
  @Column({ type: 'enum', enum: GraviteContreIndication, default: GraviteContreIndication.RELATIVE })
  gravite: GraviteContreIndication;

  @ApiPropertyOptional({ example: 'Risque de fermeture prématurée du canal artériel au 3e trimestre.' })
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiPropertyOptional({ example: 'ANSM' })
  @Column({ nullable: true })
  source: string | null;

  @ApiPropertyOptional()
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
