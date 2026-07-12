import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

export enum NotificationType {
  INFO = 'info',
  SUCCES = 'succes',
  ALERTE = 'alerte',
  ERREUR = 'erreur',
}

export enum NotificationCategorie {
  STOCK = 'stock',
  RDV = 'rdv',
  FACTURE = 'facture',
  PATIENT = 'patient',
  SYSTEME = 'systeme',
  PAIEMENT = 'paiement',
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  tenantId: string;

  @Index()
  @Column({ nullable: true })
  userId: string;

  @Column({ type: 'enum', enum: NotificationType, default: NotificationType.INFO })
  type: NotificationType;

  @Column({ type: 'enum', enum: NotificationCategorie, default: NotificationCategorie.SYSTEME })
  categorie: NotificationCategorie;

  @Column()
  titre: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ nullable: true })
  lienHref: string;

  @Column({ default: false })
  lu: boolean;

  @Column({ nullable: true })
  luAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}
