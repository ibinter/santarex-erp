import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum TypeDocumentMedical {
  COMPTE_RENDU = 'compte_rendu',
  ORDONNANCE = 'ordonnance',
  RESULTAT_LABO = 'resultat_labo',
  IMAGERIE = 'imagerie',
  CERTIFICAT = 'certificat',
  AUTRE = 'autre',
}

@Entity('documents_medicaux')
export class DocumentMedical {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  patientId: string;

  @Index()
  @Column({ nullable: true })
  consultationId: string;

  @Column({ type: 'enum', enum: TypeDocumentMedical })
  type: TypeDocumentMedical;

  @Column()
  titre: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column()
  fileUrl: string;

  @Column({ type: 'int' })
  fileSize: number;

  @Column()
  mimeType: string;

  @Column()
  tenantId: string;

  @Column()
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
