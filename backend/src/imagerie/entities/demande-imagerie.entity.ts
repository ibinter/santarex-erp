import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ModaliteImagerie } from './type-examen-imagerie.entity';

export enum StatutImagerie {
  EN_ATTENTE = 'en_attente',
  EN_COURS = 'en_cours',
  TERMINE = 'termine',
  VALIDE = 'valide',
  ANNULE = 'annule',
}

@Entity('img_demandes')
export class DemandeImagerie {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'IMG-2024-00001', description: 'Numéro auto-généré' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty({ description: 'ID du médecin prescripteur' })
  @Index()
  @Column()
  medecinPrescripteurId: string;

  @ApiProperty({ description: 'ID du type d\'examen (catalogue)' })
  @Index()
  @Column()
  typeExamenId: string;

  @ApiProperty({ enum: ModaliteImagerie })
  @Column({ type: 'enum', enum: ModaliteImagerie })
  modalite: ModaliteImagerie;

  @ApiPropertyOptional({ description: 'Région anatomique explorée' })
  @Column({ nullable: true })
  regionAnatomique: string;

  @ApiProperty({ default: false })
  @Column({ default: false })
  urgence: boolean;

  @ApiProperty({ enum: StatutImagerie })
  @Column({ type: 'enum', enum: StatutImagerie, default: StatutImagerie.EN_ATTENTE })
  statut: StatutImagerie;

  @ApiProperty()
  @Column({ type: 'timestamptz' })
  dateHeureDemande: Date;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  indicationClinique: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  notes: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
