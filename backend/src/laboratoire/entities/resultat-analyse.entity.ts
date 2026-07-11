import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum StatutResultat {
  EN_ATTENTE = 'en_attente',
  VALIDE = 'valide',
  ANNULE = 'annule',
}

export enum InterpretationResultat {
  NORMAL = 'normal',
  ELEVE = 'eleve',
  BAS = 'bas',
  CRITIQUE = 'critique',
}

export interface ValeurResultat {
  paramNom: string;
  valeur: string | number;
  unite: string;
  valeursNormalesMin?: number;
  valeursNormalesMax?: number;
  interpretation: InterpretationResultat;
}

@Entity('resultats_analyse')
export class ResultatAnalyse {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  demandeAnalyseId: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty()
  @Column()
  typeAnalyseId: string;

  @ApiProperty({ description: 'Valeurs des paramètres analysés (JSON)', type: 'object' })
  @Column({ type: 'jsonb', default: '[]' })
  resultats: ValeurResultat[];

  @ApiPropertyOptional({ description: 'Commentaire global du biologiste' })
  @Column({ type: 'text', nullable: true })
  interpretation: string;

  @ApiProperty({ enum: StatutResultat })
  @Column({ type: 'enum', enum: StatutResultat, default: StatutResultat.EN_ATTENTE })
  statut: StatutResultat;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  biologisteId: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateValidation: Date;

  @ApiProperty({ default: false, description: 'Vrai si un résultat dépasse les normes critiques' })
  @Column({ default: false })
  estCritique: boolean;

  @ApiProperty()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
