import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export enum AiProvider {
  GROQ = 'groq',
  ANTHROPIC = 'anthropic',
  OPENAI = 'openai',
}

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column()
  tenantId: string;

  @Column({ type: 'enum', enum: AiProvider, default: AiProvider.GROQ })
  provider: AiProvider;

  @Column({ default: 'llama-3.3-70b-versatile' })
  model: string;

  @Column({ default: true })
  estActif: boolean;

  @Column({ type: 'text', nullable: true })
  systemPrompt: string;

  @Column({ type: 'float', default: 0.7 })
  temperature: number;

  @Column({ type: 'int', default: 1024 })
  maxTokens: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
