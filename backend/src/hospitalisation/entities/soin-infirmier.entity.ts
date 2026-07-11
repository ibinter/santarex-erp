import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum EquipeSoin {
  MATIN = 'matin',
  APRES_MIDI = 'apres_midi',
  NUIT = 'nuit',
}

export interface SoinEffectue {
  soin: string;
  effectue: boolean;
  heure?: string;
}

@Entity('soins_infirmiers')
export class SoinInfirmier {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'ID du séjour associé' })
  @Index()
  @Column()
  sejourId: string;

  @ApiProperty({ description: 'ID du patient' })
  @Column()
  patientId: string;

  @ApiProperty({ description: 'ID de l\'infirmière ayant effectué les soins' })
  @Column()
  infirmiereId: string;

  @ApiProperty({ description: 'Date et heure des soins' })
  @Column({ type: 'timestamp' })
  dateHeure: Date;

  @ApiProperty({ enum: EquipeSoin, description: 'Équipe de garde' })
  @Column({ type: 'enum', enum: EquipeSoin })
  equipe: EquipeSoin;

  @ApiProperty({
    description: 'Liste des soins effectués',
    example: '[{"soin":"Pansement","effectue":true,"heure":"08:30"}]',
  })
  @Column({ type: 'json' })
  soinsEffectues: SoinEffectue[];

  @ApiPropertyOptional({ description: 'Observations de l\'infirmière' })
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;
}
