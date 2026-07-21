import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Journal des imports de masse (patients, et futurs modules). Table facultative
 * — l'écriture est best-effort : si elle échoue, l'import n'est jamais bloqué.
 * Créée par la migration idempotente `1750000000500-CreateImportLogs.ts`.
 */
@Entity('import_logs')
export class ImportLog {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'patients', description: "Type d'entité importée" })
  @Column()
  type: string;

  @ApiProperty({ example: 'patients-2024.xlsx', description: 'Nom du fichier source' })
  @Column({ nullable: true })
  fichier: string;

  @ApiProperty({ example: 120, description: 'Nombre total de lignes du fichier' })
  @Column({ type: 'int', default: 0 })
  lignesTotal: number;

  @ApiProperty({ example: 110, description: 'Nombre de lignes créées' })
  @Column({ type: 'int', default: 0 })
  crees: number;

  @ApiProperty({ example: 5, description: 'Nombre de lignes ignorées (doublons)' })
  @Column({ type: 'int', default: 0 })
  ignores: number;

  @ApiProperty({ example: 5, description: 'Nombre de lignes en erreur' })
  @Column({ type: 'int', default: 0 })
  erreurs: number;

  @ApiProperty({ example: 'clinique-saint-joseph', description: 'Tenant (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'UUID de l\'utilisateur ayant lancé l\'import' })
  @Column({ type: 'uuid' })
  createdById: string;

  @ApiProperty({ description: 'Date de l\'import' })
  @CreateDateColumn()
  createdAt: Date;
}
