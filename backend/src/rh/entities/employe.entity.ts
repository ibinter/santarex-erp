import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Conge } from './conge.entity';
import { BulletinPaie } from './bulletin-paie.entity';

export enum TypeContrat {
  CDI = 'CDI',
  CDD = 'CDD',
  STAGE = 'STAGE',
  CONSULTANT = 'CONSULTANT',
}

export enum StatutEmploye {
  ACTIF = 'actif',
  SUSPENDU = 'suspendu',
  PARTI = 'parti',
}

@Entity('rh_employes')
@Index(['tenantId', 'matricule'], { unique: true })
export class Employe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  matricule: string;

  @Column()
  nom: string;

  @Column()
  prenom: string;

  @Column()
  poste: string;

  @Column({ nullable: true })
  departement: string;

  @Column({ type: 'date', nullable: true })
  dateEmbauche: Date;

  @Column({ type: 'enum', enum: TypeContrat, default: TypeContrat.CDI })
  typeContrat: TypeContrat;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  salaireBase: number;

  @Column({ type: 'enum', enum: StatutEmploye, default: StatutEmploye.ACTIF })
  statut: StatutEmploye;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  telephone: string;

  @Column({ nullable: true, type: 'text' })
  adresse: string;

  @Column()
  @Index()
  tenantId: string;

  @OneToMany(() => Conge, (conge) => conge.employe)
  conges: Conge[];

  @OneToMany(() => BulletinPaie, (bulletin) => bulletin.employe)
  bulletins: BulletinPaie[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
