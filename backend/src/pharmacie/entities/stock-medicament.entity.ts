import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('stock_medicaments')
export class StockMedicament {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  medicamentId: string;

  @ApiProperty({ example: 'LOT-2024-001' })
  @Column()
  numeroLot: string;

  @ApiProperty()
  @Column({ type: 'date' })
  datePeremption: Date;

  @ApiProperty()
  @Column({ type: 'date' })
  dateReception: Date;

  @ApiProperty()
  @Column()
  quantiteInitiale: number;

  @ApiProperty()
  @Column()
  quantiteActuelle: number;

  @ApiPropertyOptional({ example: 'Pharma Distribution CI' })
  @Column({ nullable: true })
  fournisseur: string;

  @ApiPropertyOptional({ type: 'number', format: 'decimal' })
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  prixAchat: number;

  @ApiPropertyOptional({ example: 'Etagère A2' })
  @Column({ nullable: true })
  localisation: string;

  @ApiProperty()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
