import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum TypeAllergie {
  MEDICAMENT = 'medicament',
  ALIMENTAIRE = 'alimentaire',
  ENVIRONNEMENT = 'environnement',
  AUTRE = 'autre',
}

export enum SeveriteAllergie {
  LEGERE = 'legere',
  MODEREE = 'moderee',
  SEVERE = 'severe',
  ANAPHYLAXIE = 'anaphylaxie',
}

@Entity('allergies')
export class Allergie {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @Column()
  substance: string;

  @Column({ type: 'enum', enum: TypeAllergie })
  type: TypeAllergie;

  @Column({ type: 'text' })
  reaction: string;

  @Column({ type: 'enum', enum: SeveriteAllergie })
  severite: SeveriteAllergie;

  @Column({ default: true })
  estActive: boolean;

  @Column()
  tenantId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
