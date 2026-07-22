import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GroupeABO, Rhesus } from './poche-sang.entity';

@Entity('bs_transfusions')
export class Transfusion {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  patientId: string;

  @ApiProperty()
  @Index()
  @Column()
  pocheId: string;

  @ApiPropertyOptional({ description: 'Numéro de la poche transfusée (copie pour traçabilité)' })
  @Column({ nullable: true })
  pocheNumero: string;

  @ApiProperty()
  @Column({ type: 'timestamp', default: () => 'now()' })
  date: Date;

  @ApiProperty({ enum: GroupeABO })
  @Column({ type: 'enum', enum: GroupeABO })
  groupePatient: GroupeABO;

  @ApiProperty({ enum: Rhesus })
  @Column({ type: 'enum', enum: Rhesus })
  rhesusPatient: Rhesus;

  @ApiProperty({ default: false })
  @Column({ default: false })
  compatibiliteVerifiee: boolean;

  @ApiPropertyOptional({ description: 'Identifiant du médecin responsable' })
  @Column({ nullable: true })
  medecin: string;

  @ApiPropertyOptional()
  @Column({ nullable: true })
  indication: string;

  @ApiPropertyOptional({ description: 'Réaction transfusionnelle observée (nullable)' })
  @Column({ nullable: true })
  reactionTransfusionnelle: string;

  @ApiPropertyOptional()
  @Column({ type: 'text', nullable: true })
  observations: string;

  @ApiProperty()
  @Index()
  @Column()
  tenantId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
