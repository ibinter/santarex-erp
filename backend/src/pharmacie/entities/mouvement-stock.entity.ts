import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeMouvement {
  ENTREE = 'entree',
  SORTIE = 'sortie',
  RETOUR = 'retour',
  PERTE = 'perte',
  PEREMPTION = 'peremption',
  AJUSTEMENT = 'ajustement',
}

@Entity('mouvements_stock')
export class MouvementStock {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  medicamentId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  lotId: string;

  @ApiProperty({ enum: TypeMouvement })
  @Column({ type: 'enum', enum: TypeMouvement })
  type: TypeMouvement;

  @ApiProperty()
  @Column()
  quantite: number;

  @ApiProperty()
  @Column()
  quantiteAvant: number;

  @ApiProperty()
  @Column()
  quantiteApres: number;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  motif: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  ordonnanceId: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  patientId: string;

  @ApiProperty()
  @Column()
  tenantId: string;

  @ApiProperty()
  @Column()
  createdById: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
