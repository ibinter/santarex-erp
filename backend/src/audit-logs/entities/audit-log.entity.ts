import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  LOGIN_FAILED = 'LOGIN_FAILED',
  VIEW = 'VIEW',
  EXPORT = 'EXPORT',
  ACTIVATE = 'ACTIVATE',
  SUSPEND = 'SUSPEND',
}

@Entity('audit_logs')
export class AuditLog {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ enum: AuditAction })
  @Index()
  @Column({ type: 'enum', enum: AuditAction })
  action: AuditAction;

  @ApiProperty({ example: 'patients', description: 'Ressource/entité concernée' })
  @Index()
  @Column()
  ressource: string;

  @ApiPropertyOptional({ description: 'UUID de la ressource concernée' })
  @Column({ nullable: true })
  ressourceId: string;

  @ApiPropertyOptional({ description: 'Valeurs avant modification (JSON)' })
  @Column({ type: 'text', nullable: true })
  avantJson: string;

  @ApiPropertyOptional({ description: 'Valeurs après modification (JSON)' })
  @Column({ type: 'text', nullable: true })
  apresJson: string;

  @ApiPropertyOptional({ description: 'UUID de l\'utilisateur ayant effectué l\'action' })
  @Index()
  @Column({ nullable: true })
  userId: string;

  @ApiPropertyOptional({ description: 'Email de l\'utilisateur (dupliqué pour lisibilité si suppression)' })
  @Column({ nullable: true })
  userEmail: string;

  @ApiPropertyOptional({ description: 'Rôle de l\'utilisateur au moment de l\'action' })
  @Column({ nullable: true })
  userRole: string;

  @ApiProperty({ description: 'Tenant concerné' })
  @Index()
  @Column({ nullable: true })
  tenantId: string;

  @ApiPropertyOptional({ description: 'Adresse IP source' })
  @Column({ nullable: true })
  ipAddress: string;

  @ApiPropertyOptional({ description: 'User-Agent du client' })
  @Column({ type: 'text', nullable: true })
  userAgent: string;

  @ApiPropertyOptional({ description: 'Contexte additionnel (JSON)' })
  @Column({ type: 'text', nullable: true })
  contexteJson: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
