import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Facture } from './facture.entity';

export enum TypeLigneFacture {
  CONSULTATION = 'consultation',
  MEDICAMENT = 'medicament',
  ANALYSE = 'analyse',
  IMAGERIE = 'imagerie',
  HOSPITALISATION = 'hospitalisation',
  ACTE_CHIRURGICAL = 'acte_chirurgical',
  MATERIEL = 'materiel',
  AUTRE = 'autre',
}

@Entity('lignes_facture')
export class LigneFacture {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  factureId: string;

  @ManyToOne(() => Facture, (facture) => facture.lignes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'factureId' })
  facture: Facture;

  @Column({ type: 'enum', enum: TypeLigneFacture })
  type: TypeLigneFacture;

  @Column()
  libelle: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1 })
  quantite: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  prixUnitaire: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  remisePourcent: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  montantTotal: number;

  @Column({ nullable: true })
  referenceId: string;

  @Column()
  tenantId: string;
}
