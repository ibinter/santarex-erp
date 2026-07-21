import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TypeSauvegarde {
  MANUELLE = 'manuelle',
  PLANIFIEE = 'planifiee',
}

export enum StatutSauvegarde {
  EN_COURS = 'en_cours',
  REUSSIE = 'reussie',
  ECHOUEE = 'echouee',
}

/**
 * Une ligne de journal pour chaque dump de base réalisé (ou tenté).
 * Le fichier dump lui-même n'est JAMAIS servi statiquement : `cheminFichier`
 * pointe vers un dossier privé (storage/backups) hors de tout répertoire
 * `public`. Il n'est accessible qu'au travers du endpoint de téléchargement
 * sécurisé (SUPERADMIN + anti-path-traversal).
 */
@Entity('backup_sauvegardes')
export class Sauvegarde {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Nom lisible de la sauvegarde' })
  @Column()
  nom: string;

  @ApiProperty({ enum: TypeSauvegarde })
  @Column({ type: 'enum', enum: TypeSauvegarde, default: TypeSauvegarde.MANUELLE })
  type: TypeSauvegarde;

  @ApiProperty({ enum: StatutSauvegarde })
  @Index()
  @Column({ type: 'enum', enum: StatutSauvegarde, default: StatutSauvegarde.EN_COURS })
  statut: StatutSauvegarde;

  @ApiPropertyOptional({
    description: 'Chemin ABSOLU du dump dans le stockage privé (jamais exposé tel quel)',
  })
  @Column({ type: 'text', nullable: true })
  cheminFichier: string | null;

  @ApiPropertyOptional({ description: 'Nom de fichier seul (base name) pour affichage / download' })
  @Column({ type: 'varchar', nullable: true })
  nomFichier: string | null;

  @ApiPropertyOptional({ description: 'Taille du dump en octets' })
  @Column({ type: 'bigint', nullable: true })
  tailleOctets: string | null;

  @ApiPropertyOptional({ description: 'Empreinte SHA-256 du dump' })
  @Column({ type: 'varchar', length: 64, nullable: true })
  checksum: string | null;

  @ApiPropertyOptional({ description: "Identifiant de l'utilisateur (SUPERADMIN) initiateur" })
  @Index()
  @Column({ type: 'varchar', nullable: true })
  initiateurId: string | null;

  @ApiPropertyOptional({ description: "Message d'erreur en cas d'échec" })
  @Column({ type: 'text', nullable: true })
  erreur: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Fin de traitement (succès ou échec)' })
  @Column({ type: 'timestamptz', nullable: true })
  terminatedAt: Date | null;
}
