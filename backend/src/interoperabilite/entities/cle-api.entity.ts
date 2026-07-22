import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Clé API émise pour un tenant. La valeur en clair n'est JAMAIS stockée :
 * seul le hash bcrypt est persisté (`cleHashee`). Le `prefixe` visible
 * (8 premiers caractères) permet à l'utilisateur de reconnaître sa clé et
 * accélère la recherche du candidat avant la vérification bcrypt.
 */
@Entity('interop_cles_api')
export class CleApi {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Établissement propriétaire de la clé (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Nom lisible de la clé (ex. « Automate labo Cobas »)' })
  @Column()
  nom: string;

  /** Hash bcrypt de la clé complète — jamais exposé via l'API. */
  @Column({ select: false })
  cleHashee: string;

  @ApiProperty({ description: 'Préfixe visible de la clé (ex. sx_live_ab12cd34)' })
  @Index()
  @Column()
  prefixe: string;

  @ApiProperty({
    description: 'Portées autorisées (ex. patients:read, hl7:write, labo:read)',
    type: [String],
  })
  @Column({ type: 'jsonb', default: '[]' })
  scopes: string[];

  @ApiProperty({ default: true })
  @Column({ default: true })
  actif: boolean;

  @ApiPropertyOptional({ description: 'Dernière utilisation de la clé' })
  @Column({ type: 'timestamptz', nullable: true })
  dateDernierUsage: Date;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
