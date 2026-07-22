import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Type d'interface d'interfaçage avec un système externe. */
export enum TypeInterface {
  HL7_LABO = 'hl7_labo',
  DICOM_PACS = 'dicom_pacs',
}

/** État de connexion (simulé tant que le matériel n'est pas raccordé sur site). */
export enum StatutConnexion {
  NON_CONFIGURE = 'non_configure',
  CONNECTE = 'connecte',
  DECONNECTE = 'deconnecte',
  ERREUR = 'erreur',
}

/**
 * Configuration d'une interface d'interfaçage (automate HL7 de laboratoire ou
 * nœud DICOM/PACS d'imagerie). Cette entité modélise la FONDATION logicielle :
 * le raccordement physique aux appareils se fera ensuite sur site.
 */
@Entity('interop_config_interfaces')
export class ConfigInterface {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Établissement propriétaire (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ enum: TypeInterface })
  @Column({ type: 'enum', enum: TypeInterface })
  type: TypeInterface;

  @ApiProperty({ description: 'Nom lisible (ex. « Cobas 6000 - Salle B »)' })
  @Column()
  nom: string;

  @ApiPropertyOptional({ description: 'Hôte / IP de l\'appareil ou du nœud' })
  @Column({ nullable: true })
  hote: string;

  @ApiPropertyOptional({ description: 'Port TCP (ex. 104 pour DICOM, 6661 pour MLLP HL7)' })
  @Column({ type: 'int', nullable: true })
  port: number;

  @ApiPropertyOptional({
    description:
      'Paramètres spécifiques au protocole (JSON) : AE title, encodage, mapping…',
    type: 'object',
  })
  @Column({ type: 'jsonb', default: '{}' })
  parametresJson: Record<string, unknown>;

  @ApiProperty({ enum: StatutConnexion, default: StatutConnexion.NON_CONFIGURE })
  @Column({ type: 'enum', enum: StatutConnexion, default: StatutConnexion.NON_CONFIGURE })
  statutConnexion: StatutConnexion;

  @ApiProperty({ default: true })
  @Column({ default: true })
  actif: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
