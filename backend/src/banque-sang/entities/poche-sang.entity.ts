import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum GroupeABO {
  A = 'A',
  B = 'B',
  AB = 'AB',
  O = 'O',
}

export enum Rhesus {
  POSITIF = '+',
  NEGATIF = '-',
}

export enum TypeProduitSanguin {
  SANG_TOTAL = 'sang_total',
  CGR = 'CGR',
  PLASMA = 'plasma',
  PLAQUETTES = 'plaquettes',
}

export enum StatutPoche {
  DISPONIBLE = 'disponible',
  RESERVEE = 'reservee',
  TRANSFUSEE = 'transfusee',
  PERIMEE = 'perimee',
  DETRUITE = 'detruite',
}

@Entity('bs_poches_sang')
export class PocheSang {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'POCHE-00001', description: 'Code / numéro unique par tenant' })
  @Index()
  @Column()
  numero: string;

  @ApiProperty({ enum: GroupeABO })
  @Column({ type: 'enum', enum: GroupeABO })
  groupe: GroupeABO;

  @ApiProperty({ enum: Rhesus })
  @Column({ type: 'enum', enum: Rhesus })
  rhesus: Rhesus;

  @ApiProperty({ enum: TypeProduitSanguin })
  @Column({ type: 'enum', enum: TypeProduitSanguin, default: TypeProduitSanguin.CGR })
  typeProduit: TypeProduitSanguin;

  @ApiProperty({ example: 450 })
  @Column({ type: 'int', default: 0 })
  volumeMl: number;

  @ApiProperty()
  @Column({ type: 'date' })
  datePrelevement: Date;

  @ApiProperty()
  @Column({ type: 'date' })
  datePeremption: Date;

  @ApiProperty({ enum: StatutPoche })
  @Index()
  @Column({ type: 'enum', enum: StatutPoche, default: StatutPoche.DISPONIBLE })
  statut: StatutPoche;

  @ApiPropertyOptional({ description: 'Référence du donneur (interne / CNTS)' })
  @Column({ nullable: true })
  donneurRef: string;

  @ApiPropertyOptional({ example: 'CNTS Abidjan' })
  @Column({ nullable: true })
  provenance: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  localisation: string;

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
