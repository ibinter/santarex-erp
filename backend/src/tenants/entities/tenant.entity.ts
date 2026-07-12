import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TenantStatut {
  ACTIF = 'actif',
  SUSPENDU = 'suspendu',
  ESSAI = 'essai',
  EXPIRE = 'expire',
  EN_ATTENTE = 'en_attente',
}

export enum TenantType {
  CLINIQUE = 'clinique',
  HOPITAL = 'hopital',
  CABINET = 'cabinet',
  POLYCLINIQUE = 'polyclinique',
  PHARMACIE = 'pharmacie',
  LABORATOIRE = 'laboratoire',
}

@Entity('tenants')
export class Tenant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'clinique-saint-joseph', description: 'Slug unique utilisé comme tenantId dans tout le système' })
  @Index({ unique: true })
  @Column({ unique: true })
  slug: string;

  @ApiProperty({ example: 'Clinique Saint-Joseph' })
  @Column()
  nom: string;

  @ApiPropertyOptional({ enum: TenantType })
  @Column({ type: 'enum', enum: TenantType, nullable: true })
  type: TenantType;

  @ApiPropertyOptional({ example: 'contact@saint-joseph.ci' })
  @Column({ nullable: true })
  email: string;

  @ApiPropertyOptional({ example: '+22507000000' })
  @Column({ nullable: true })
  telephone: string;

  @ApiPropertyOptional({ example: 'Cocody, Abidjan' })
  @Column({ nullable: true })
  adresse: string;

  @ApiPropertyOptional({ example: 'Abidjan' })
  @Column({ nullable: true })
  ville: string;

  @ApiPropertyOptional({ example: 'CI', description: 'Code pays ISO' })
  @Column({ default: 'CI' })
  pays: string;

  @ApiPropertyOptional({ example: 'https://saint-joseph.ci' })
  @Column({ nullable: true })
  siteWeb: string;

  @ApiPropertyOptional({ example: 'https://cdn.santarex.ci/logos/saint-joseph.png' })
  @Column({ nullable: true })
  logoUrl: string;

  @ApiPropertyOptional({ description: 'Nom du responsable / directeur' })
  @Column({ nullable: true })
  nomResponsable: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  emailResponsable: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  telephoneResponsable: string;

  @ApiProperty({ enum: TenantStatut, default: TenantStatut.EN_ATTENTE })
  @Column({ type: 'enum', enum: TenantStatut, default: TenantStatut.EN_ATTENTE })
  statut: TenantStatut;

  @ApiPropertyOptional({ description: 'Nombre maximal d\'utilisateurs autorisés' })
  @Column({ nullable: true })
  maxUtilisateurs: number;

  @ApiPropertyOptional({ description: 'Modules activés (JSON array)' })
  @Column({ type: 'text', nullable: true })
  modulesActifsJson: string;

  @ApiPropertyOptional({ description: 'Paramètres personnalisés (JSON)' })
  @Column({ type: 'text', nullable: true })
  parametresJson: string;

  @ApiPropertyOptional({ description: 'Notes internes IBIG SOFT' })
  @Column({ type: 'text', nullable: true })
  notesInternes: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
