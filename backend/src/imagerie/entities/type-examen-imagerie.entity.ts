import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ModaliteImagerie {
  RADIO = 'radio',
  SCANNER = 'scanner',
  IRM = 'irm',
  ECHO = 'echo',
  MAMMOGRAPHIE = 'mammographie',
  AUTRE = 'autre',
}

@Entity('img_types_examen')
export class TypeExamenImagerie {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'RX-THORAX' })
  @Index()
  @Column()
  code: string;

  @ApiProperty({ example: 'Radiographie thoracique' })
  @Column()
  nom: string;

  @ApiProperty({ enum: ModaliteImagerie })
  @Column({ type: 'enum', enum: ModaliteImagerie })
  modalite: ModaliteImagerie;

  @ApiPropertyOptional({ description: 'Région anatomique par défaut' })
  @Column({ nullable: true })
  regionAnatomique: string;

  @ApiProperty({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  prixUnitaire: number;

  @ApiProperty({ default: 24, description: 'Délai moyen en heures pour le compte-rendu' })
  @Column({ default: 24 })
  delaiResultatsHeures: number;

  @ApiPropertyOptional({ description: 'Préparation / instructions patient' })
  @Column({ type: 'text', nullable: true })
  instructions: string;

  @ApiProperty({ default: true })
  @Column({ default: true })
  estActif: boolean;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
