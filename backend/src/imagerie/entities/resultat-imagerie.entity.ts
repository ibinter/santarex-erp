import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('img_resultats')
export class ResultatImagerie {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  demandeId: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiPropertyOptional({ description: 'Compte-rendu radiologique détaillé' })
  @Column({ type: 'text', nullable: true })
  compteRendu: string;

  @ApiPropertyOptional({ description: 'Conclusion / synthèse' })
  @Column({ type: 'text', nullable: true })
  conclusion: string;

  @ApiProperty({ description: 'URLs des images (DICOM/JPEG)', type: 'array' })
  @Column({ type: 'jsonb', default: '[]' })
  imagesUrls: string[];

  @ApiPropertyOptional({ description: 'ID du radiologue interprétateur' })
  @Column({ nullable: true })
  radiologueId: string;

  @ApiPropertyOptional()
  @Column({ type: 'timestamptz', nullable: true })
  dateValidation: Date;

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
