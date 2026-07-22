import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeInstrument {
  INSTRUMENT = 'instrument',
  PLATEAU = 'plateau',
}

/**
 * Référentiel simple d'instruments / plateaux stérilisables. Sert à préparer
 * le contenu d'un lot de stérilisation.
 */
@Entity('sterilisation_instruments')
export class Instrument {
  @ApiProperty({ description: 'Identifiant unique UUID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Plateau chirurgie viscérale', description: 'Nom de l\'instrument / plateau' })
  @Column()
  nom: string;

  @ApiProperty({ enum: TypeInstrument, default: TypeInstrument.INSTRUMENT, description: 'Type (instrument unitaire ou plateau)' })
  @Column({ type: 'enum', enum: TypeInstrument, default: TypeInstrument.INSTRUMENT })
  type: TypeInstrument;

  @ApiProperty({ example: 5, default: 1, description: 'Quantité disponible' })
  @Column({ type: 'int', default: 1 })
  quantite: number;

  @ApiPropertyOptional({ description: 'Code / référence interne (optionnel)' })
  @Column({ nullable: true })
  code: string;

  @ApiProperty({ default: true, description: 'Actif ou désactivé' })
  @Column({ default: true })
  estActif: boolean;

  @ApiProperty({ description: 'Identifiant de l\'établissement (multi-tenant)' })
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ description: 'Date de création' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Date de dernière mise à jour' })
  @UpdateDateColumn()
  updatedAt: Date;
}
