import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum SexeDefunt {
  MASCULIN = 'M',
  FEMININ = 'F',
  INDETERMINE = 'indetermine',
}

export enum LieuDeces {
  SERVICE = 'service',
  DOMICILE = 'domicile',
  ARRIVEE = 'arrivee',
  AUTRE = 'autre',
}

@Entity('morgue_deces')
export class Deces {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'DEC-2026-0001', description: 'Numéro de décès auto-généré' })
  @Column()
  numero: string;

  @ApiPropertyOptional({ description: 'ID du patient décédé (si patient connu du SIH)' })
  @Index()
  @Column({ nullable: true })
  patientId: string | null;

  @ApiProperty({ example: 'Kouassi', description: 'Nom du défunt' })
  @Column()
  defuntNom: string;

  @ApiProperty({ example: 'Yao', description: 'Prénom(s) du défunt' })
  @Column()
  defuntPrenom: string;

  @ApiProperty({ enum: SexeDefunt, description: 'Sexe du défunt' })
  @Column({ type: 'enum', enum: SexeDefunt, default: SexeDefunt.INDETERMINE })
  defuntSexe: SexeDefunt;

  @ApiPropertyOptional({ example: 67, description: 'Âge du défunt (années)' })
  @Column({ type: 'int', nullable: true })
  defuntAge: number | null;

  @ApiProperty({ description: 'Date et heure du décès' })
  @Column({ type: 'timestamp' })
  dateHeureDeces: Date;

  @ApiProperty({ enum: LieuDeces, description: 'Lieu / circonstance du décès' })
  @Column({ type: 'enum', enum: LieuDeces, default: LieuDeces.SERVICE })
  lieuDeces: LieuDeces;

  @ApiPropertyOptional({ description: 'Cause du décès (constat médical)' })
  @Column({ type: 'text', nullable: true })
  causeDeces: string | null;

  @ApiPropertyOptional({ description: 'Référence du médecin ayant constaté le décès' })
  @Column({ nullable: true })
  medecinConstatantRef: string | null;

  @ApiProperty({ default: false, description: 'Certificat de décès émis' })
  @Column({ default: false })
  certificatEmis: boolean;

  @ApiPropertyOptional({ description: 'Numéro du certificat de décès' })
  @Column({ nullable: true })
  numeroCertificat: string | null;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiPropertyOptional({ description: 'ID de l\'utilisateur créateur' })
  @Column({ nullable: true })
  createdById: string | null;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
