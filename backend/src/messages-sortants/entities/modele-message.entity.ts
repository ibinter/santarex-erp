import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

/**
 * Codes de modèles « métier » reconnus par le module. Le scheduler et les
 * envois automatiques s'appuient sur ces codes pour retrouver le bon modèle.
 */
export enum CodeModeleMessage {
  RAPPEL_RDV = 'rappel_rdv',
  RESULTAT_PRET = 'resultat_pret',
  RELANCE = 'relance',
  BIENVENUE = 'bienvenue',
}

export enum CanalMessage {
  SMS = 'sms',
  WHATSAPP = 'whatsapp',
}

/**
 * Référentiel de modèles de messages. Le `contenu` peut contenir des variables
 * de la forme {{nom}}, {{date}}, {{heure}}… substituées à l'envoi.
 * Scopé par tenant (multi-tenant obligatoire).
 */
@Entity('messages_sortants_modeles')
export class ModeleMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  /** Code métier (rappel_rdv, resultat_pret, relance, bienvenue…). */
  @Column({ type: 'enum', enum: CodeModeleMessage })
  code: CodeModeleMessage;

  @Column()
  libelle: string;

  @Column({ type: 'enum', enum: CanalMessage, default: CanalMessage.SMS })
  canal: CanalMessage;

  /** Contenu avec variables {{nom}}, {{date}}… */
  @Column({ type: 'text' })
  contenu: string;

  @Column({ default: true })
  actif: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
