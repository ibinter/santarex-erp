import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeActeSoin {
  PANSEMENT = 'pansement',
  INJECTION = 'injection',
  PERFUSION = 'perfusion',
  TOILETTE = 'toilette',
  PRELEVEMENT = 'prelevement',
  SURVEILLANCE = 'surveillance',
  AUTRE = 'autre',
}

/**
 * Acte de soin (feuille de soins) : trace un geste infirmier planifié ou
 * réalisé (pansement, injection, perfusion, toilette, prélèvement, surveillance).
 */
@Entity('soins_actes')
export class ActeSoin {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du patient' })
  @Index()
  @Column()
  patientId: string;

  @ApiPropertyOptional({ description: 'ID du séjour d\'hospitalisation (optionnel)' })
  @Index()
  @Column({ nullable: true })
  sejourId: string;

  @ApiProperty({ description: 'Date et heure de l\'acte' })
  @Column({ type: 'timestamp with time zone', default: () => 'CURRENT_TIMESTAMP' })
  date: Date;

  @ApiProperty({ enum: TypeActeSoin, description: 'Type d\'acte de soin' })
  @Column({ type: 'enum', enum: TypeActeSoin, default: TypeActeSoin.AUTRE })
  type: TypeActeSoin;

  @ApiProperty({ description: 'Description / détail de l\'acte' })
  @Column({ type: 'text' })
  description: string;

  @ApiProperty({ description: 'Acte réalisé (true) ou planifié (false)' })
  @Column({ type: 'boolean', default: false })
  realise: boolean;

  @ApiProperty({ description: 'ID de l\'infirmier ayant réalisé / planifié l\'acte' })
  @Column()
  infirmierRef: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;
}
