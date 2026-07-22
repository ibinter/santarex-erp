import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { AffectationSite } from './affectation-site.entity';

/** Type de site rattaché à un établissement (tenant). */
export enum TypeSite {
  SIEGE = 'siege',
  ANTENNE = 'antenne',
  CLINIQUE = 'clinique',
  PHARMACIE = 'pharmacie',
  LABORATOIRE = 'laboratoire',
}

export enum StatutSite {
  ACTIF = 'actif',
  INACTIF = 'inactif',
}

/**
 * Un `Site` est une antenne / clinique / point de service appartenant à un
 * établissement (tenant). C'est une dimension SUPPLÉMENTAIRE à l'intérieur du
 * multi-tenant existant : chaque site porte un `tenantId` indexé. Un seul site
 * peut être marqué `estPrincipal` par tenant (logique appliquée en service).
 */
@Entity('sites')
@Index(['tenantId', 'code'], { unique: true })
export class Site {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  code: string;

  @Column()
  nom: string;

  @Column({ type: 'enum', enum: TypeSite, default: TypeSite.ANTENNE })
  type: TypeSite;

  @Column({ nullable: true, type: 'text' })
  adresse: string;

  @Column({ nullable: true })
  ville: string;

  @Column({ nullable: true })
  telephone: string;

  /** Référence libre vers le responsable (userId ou matricule employé). */
  @Column({ nullable: true })
  responsableRef: string;

  @Column({ type: 'int', default: 0 })
  capaciteLits: number;

  @Column({ type: 'enum', enum: StatutSite, default: StatutSite.ACTIF })
  statut: StatutSite;

  @Column({ type: 'boolean', default: false })
  estPrincipal: boolean;

  @Column()
  @Index()
  tenantId: string;

  @OneToMany(() => AffectationSite, (affectation) => affectation.site)
  affectations: AffectationSite[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
