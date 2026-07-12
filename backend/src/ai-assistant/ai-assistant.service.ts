import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AiConfig, AiProvider } from './entities/ai-config.entity';
import { ChatDto, ChatMessageDto, UpdateAiConfigDto } from './dto/chat.dto';

const DEFAULT_SYSTEM = `Tu es SARA, l'assistante intelligente de SANTAREX ERP, une plateforme SaaS de gestion hospitalière pour l'Afrique.
Tu aides les professionnels de santé (médecins, infirmiers, pharmaciens, caissiers, laborantins) à naviguer dans le logiciel, comprendre leurs données et optimiser leurs workflows.
Réponds en français par défaut, de façon concise et professionnelle.
Tu ne donnes JAMAIS de conseils médicaux directs. Tu orientes toujours vers le médecin compétent pour les décisions cliniques.
Tu peux aider avec : navigation dans le logiciel, interprétation des tableaux de bord, procédures administratives, gestion des stocks, compréhension des rapports.`;

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    @InjectRepository(AiConfig)
    private readonly configRepo: Repository<AiConfig>,
    private readonly appConfig: ConfigService,
  ) {}

  async getOrCreateConfig(tenantId: string): Promise<AiConfig> {
    let config = await this.configRepo.findOne({ where: { tenantId } });
    if (!config) {
      config = this.configRepo.create({ tenantId });
      await this.configRepo.save(config);
    }
    return config;
  }

  async updateConfig(tenantId: string, dto: UpdateAiConfigDto): Promise<AiConfig> {
    await this.getOrCreateConfig(tenantId);
    await this.configRepo.update({ tenantId }, dto);
    return this.configRepo.findOne({ where: { tenantId } });
  }

  async chat(tenantId: string, dto: ChatDto, res: Response): Promise<void> {
    const config = await this.getOrCreateConfig(tenantId);

    if (!config.estActif) {
      res.status(403).json({ message: 'Assistant IA désactivé pour cet établissement.' });
      return;
    }

    const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM;
    const contextNote = dto.context ? `\n\nContexte actuel : ${dto.context}` : '';
    const fullSystem = systemPrompt + contextNote;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      switch (config.provider) {
        case AiProvider.GROQ:
          await this.streamGroq(config, fullSystem, dto.messages, res);
          break;
        case AiProvider.ANTHROPIC:
          await this.streamAnthropic(config, fullSystem, dto.messages, res);
          break;
        case AiProvider.OPENAI:
          await this.streamOpenai(config, fullSystem, dto.messages, res);
          break;
      }
    } catch (err) {
      this.logger.error(`AI stream error [${config.provider}]`, err);
      res.write(`data: ${JSON.stringify({ error: 'Erreur du service IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }

  private async streamGroq(config: AiConfig, system: string, messages: ChatMessageDto[], res: Response) {
    const apiKey = this.appConfig.getOrThrow<string>('GROQ_API_KEY');
    const groq = new Groq({ apiKey });

    const stream = await groq.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }

  private async streamAnthropic(config: AiConfig, system: string, messages: ChatMessageDto[], res: Response) {
    const apiKey = this.appConfig.getOrThrow<string>('ANTHROPIC_API_KEY');
    const anthropic = new Anthropic({ apiKey });

    const stream = await anthropic.messages.create({
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: config.maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
  }

  private async streamOpenai(config: AiConfig, system: string, messages: ChatMessageDto[], res: Response) {
    const apiKey = this.appConfig.getOrThrow<string>('OPENAI_API_KEY');
    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) res.write(`data: ${JSON.stringify({ text })}\n\n`);
    }
  }
}
