import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { RessourceType } from '../academie.enums';
import { QuizContenu } from '../academie.quiz';

/**
 * Une ressource pédagogique rattachée à un parcours (vidéo, document, quiz).
 *
 * RÈGLE CDC — HONNÊTETÉ DU CONTENU : ne jamais publier de fausse vidéo / fausse
 * URL. Une ressource dont le contenu n'existe pas encore doit garder
 * `contenuDisponible = false` (badge « Bientôt disponible ») et `url = null`.
 */
@Entity('academie_ressources')
export class RessourceFormation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  parcoursId: string;

  @Column({ type: 'enum', enum: RessourceType, default: RessourceType.DOCUMENT })
  type: RessourceType;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // Durée estimée en minutes (indicatif).
  @Column({ type: 'int', nullable: true })
  duree: number | null;

  // URL réelle du contenu. Reste `null` tant que le contenu n'existe pas
  // (voir `contenuDisponible`). Aucune URL factice ne doit être renseignée.
  @Column({ type: 'text', nullable: true })
  url: string | null;

  @Column({ type: 'text', nullable: true })
  miniatureUrl: string | null;

  // Module ERP associé (patients, facturation, pharmacie…), pour filtrage.
  @Column({ nullable: true })
  moduleAssocie: string | null;

  // Langue du contenu (fr, en…).
  @Column({ default: 'fr' })
  langue: string;

  // Version SANTAREX à partir de laquelle le contenu est pertinent.
  @Column({ nullable: true })
  versionCompatible: string | null;

  // Ordre d'affichage au sein du parcours.
  @Column({ type: 'int', default: 0 })
  ordre: number;

  @Index()
  @Column({ default: false })
  estPublie: boolean;

  // Flag d'honnêteté : le contenu réel est-il effectivement disponible ?
  // false => affichage « Bientôt disponible », pas de lecture possible.
  @Column({ default: false })
  contenuDisponible: boolean;

  // Contenu de quiz (uniquement pour les ressources de type `quiz`).
  // Contient les questions, options, bonnes réponses et explications.
  // NE JAMAIS renvoyer tel quel au client avant soumission (voir service).
  @Column({ type: 'jsonb', nullable: true })
  quizJson: QuizContenu | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
