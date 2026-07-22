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
 * Catégorie fonctionnelle d'un service personnalisé. Sert au filtrage et au
 * code couleur côté interface. « autre » couvre tout ce qui ne rentre pas dans
 * les trois grandes familles métier de l'établissement.
 */
export enum CategorieService {
  CLINIQUE = 'clinique',
  ADMINISTRATIF = 'administratif',
  TECHNIQUE = 'technique',
  AUTRE = 'autre',
}

/**
 * Type d'un champ défini par l'administrateur dans le constructeur de formulaire.
 * Le type « patient » relie l'enregistrement à un dossier patient existant
 * (l'interface propose alors un sélecteur de patient).
 */
export enum TypeChamp {
  TEXTE = 'texte',
  NOMBRE = 'nombre',
  DATE = 'date',
  LISTE = 'liste',
  BOOLEEN = 'booleen',
  PATIENT = 'patient',
}

/**
 * Définition d'un champ personnalisé (stockée dans `champsSchema` jsonb, même
 * approche que `academie.quizJson`). C'est le « schéma » à partir duquel le
 * formulaire de saisie est généré dynamiquement et les valeurs sont validées.
 */
export interface ChampDefinition {
  /** Identifiant stable du champ (clé utilisée dans `valeurs`). */
  id: string;
  /** Libellé affiché à l'utilisateur. */
  libelle: string;
  /** Type de contrôle et de validation. */
  type: TypeChamp;
  /** Options possibles (uniquement pour le type `liste`). */
  options?: string[];
  /** Champ obligatoire à la saisie. */
  requis: boolean;
}

@Entity('services_personnalises')
export class ServicePersonnalise {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty({ example: 'Suivi diététique' })
  @Column()
  nom: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  description: string | null;

  @ApiProperty({ enum: CategorieService })
  @Index()
  @Column({
    type: 'enum',
    enum: CategorieService,
    default: CategorieService.AUTRE,
  })
  categorie: CategorieService;

  @ApiPropertyOptional({ description: 'Nom d\'icône lucide optionnel' })
  @Column({ nullable: true })
  icone: string | null;

  @ApiProperty({
    description: 'Définition des champs personnalisés (constructeur de formulaire)',
    type: 'array',
  })
  @Column({ type: 'jsonb', default: () => "'[]'" })
  champsSchema: ChampDefinition[];

  @ApiProperty()
  @Index()
  @Column({ default: true })
  actif: boolean;

  @ApiProperty({ description: 'Identifiant de l\'utilisateur créateur' })
  @Column()
  creePar: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
