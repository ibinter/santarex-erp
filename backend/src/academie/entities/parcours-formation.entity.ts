import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ParcoursCategorie, ParcoursNiveau } from '../academie.enums';

/**
 * Un parcours de formation SANTAREX (regroupe des ressources pédagogiques).
 *
 * Multi-tenant : `tenantId` nullable. `null` = parcours GLOBAL (fourni par
 * l'éditeur, visible par tous les tenants). Renseigné = parcours propre à un
 * établissement.
 */
@Entity('academie_parcours')
export class ParcoursFormation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Index()
  @Column({ type: 'enum', enum: ParcoursCategorie, default: ParcoursCategorie.DEMARRAGE })
  categorie: ParcoursCategorie;

  @Column({ type: 'enum', enum: ParcoursNiveau, default: ParcoursNiveau.DEBUTANT })
  niveau: ParcoursNiveau;

  // Ordre d'affichage au sein d'une catégorie.
  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Index()
  @Column({ default: false })
  estPublie: boolean;

  // Illustration facultative (URL). Jamais de fausse ressource vidéo ici.
  @Column({ nullable: true })
  iconeUrl: string | null;

  // null = parcours global (éditeur), partagé avec tous les tenants.
  @Index()
  @Column({ nullable: true })
  tenantId: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
