import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import Groq from 'groq-sdk';
import { AiConfig, AiProvider } from './entities/ai-config.entity';
import { AiUsage } from './entities/ai-usage.entity';
import { ChatDto, ChatMessageDto, UpdateAiConfigDto } from './dto/chat.dto';
import { KnowledgeService } from './knowledge/knowledge.service';

const DEFAULT_SYSTEM = `Tu es SARA, l'assistante intelligente de SANTAREX ERP, une plateforme SaaS de gestion hospitalière pour l'Afrique.
Tu aides les professionnels de santé (médecins, infirmiers, pharmaciens, caissiers, laborantins) à naviguer dans le logiciel, comprendre leurs données et optimiser leurs workflows.
Réponds en français par défaut, de façon concise et professionnelle.
Tu ne donnes JAMAIS de conseils médicaux directs. Tu orientes toujours vers le médecin compétent pour les décisions cliniques.
Tu peux aider avec : navigation dans le logiciel, interprétation des tableaux de bord, procédures administratives, gestion des stocks, compréhension des rapports.`;

/** Estimation grossière du nombre de tokens à partir d'un texte (≈ 4 car./token). */
function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 4);
}

/** Date du jour au format YYYY-MM-DD (clé d'agrégation de l'usage). */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

@Injectable()
export class AiAssistantService {
  private readonly logger = new Logger(AiAssistantService.name);

  constructor(
    @InjectRepository(AiConfig)
    private readonly configRepo: Repository<AiConfig>,
    @InjectRepository(AiUsage)
    private readonly usageRepo: Repository<AiUsage>,
    private readonly appConfig: ConfigService,
    private readonly knowledge: KnowledgeService,
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

  /** Nombre de messages IA déjà consommés aujourd'hui par le tenant. */
  async getMessagesUsedToday(tenantId: string): Promise<number> {
    const { total } = await this.usageRepo
      .createQueryBuilder('u')
      .select('COALESCE(SUM(u.nbMessages),0)', 'total')
      .where('u.tenantId = :tenantId AND u.date = :date', { tenantId, date: today() })
      .getRawOne<{ total: string }>();
    return Number(total) || 0;
  }

  /** Résumé d'usage IA pour la console superadmin (aujourd'hui + 30 jours). */
  async getUsageSummary(tenantId: string) {
    const config = await this.getOrCreateConfig(tenantId);
    const usedToday = await this.getMessagesUsedToday(tenantId);

    const rows = await this.usageRepo
      .createQueryBuilder('u')
      .select('u.date', 'date')
      .addSelect('SUM(u.nbMessages)', 'nbMessages')
      .addSelect('SUM(u.nbTokensEstimes)', 'nbTokensEstimes')
      .where('u.tenantId = :tenantId', { tenantId })
      .groupBy('u.date')
      .orderBy('u.date', 'DESC')
      .limit(30)
      .getRawMany<{ date: string; nbMessages: string; nbTokensEstimes: string }>();

    const parDate = rows.map((r) => ({
      date: r.date,
      nbMessages: Number(r.nbMessages) || 0,
      nbTokensEstimes: Number(r.nbTokensEstimes) || 0,
    }));

    return {
      quotaMessagesJour: config.quotaMessagesJour,
      usedToday,
      restantAujourdhui: Math.max(0, config.quotaMessagesJour - usedToday),
      totalMessages30j: parDate.reduce((s, r) => s + r.nbMessages, 0),
      totalTokens30j: parDate.reduce((s, r) => s + r.nbTokensEstimes, 0),
      parDate,
    };
  }

  /** Incrémente (upsert) le compteur d'usage du jour pour ce tenant/utilisateur. */
  private async recordUsage(
    tenantId: string,
    userId: string,
    tokens: number,
    provider: string,
    apercu: string,
  ): Promise<void> {
    const date = today();
    const safeUser = userId || 'inconnu';
    try {
      let row = await this.usageRepo.findOne({ where: { tenantId, userId: safeUser, date } });
      if (!row) {
        row = this.usageRepo.create({ tenantId, userId: safeUser, date, nbMessages: 0, nbTokensEstimes: 0 });
      }
      row.nbMessages += 1;
      row.nbTokensEstimes += tokens;
      row.dernierProvider = provider;
      row.dernierApercu = (apercu || '').slice(0, 158);
      await this.usageRepo.save(row);
    } catch (err) {
      // Ne jamais casser le flux de chat à cause de la journalisation.
      this.logger.error(`Échec de l'enregistrement de l'usage IA (tenant ${tenantId})`, err as Error);
    }
  }

  async chat(tenantId: string, userId: string, dto: ChatDto, res: Response): Promise<void> {
    const config = await this.getOrCreateConfig(tenantId);

    if (!config.estActif) {
      res.status(403).json({ message: 'Assistant IA désactivé pour cet établissement.' });
      return;
    }

    // --- Contrôle de quota (par tenant / jour) AVANT tout appel LLM ---
    const usedToday = await this.getMessagesUsedToday(tenantId);
    if (config.quotaMessagesJour > 0 && usedToday >= config.quotaMessagesJour) {
      res.status(429).json({
        message: `Quota d'assistance IA atteint pour aujourd'hui (${config.quotaMessagesJour} messages/jour). Réessayez demain ou contactez votre administrateur.`,
      });
      return;
    }

    // --- RAG léger : récupération de contexte à partir de la dernière question ---
    const lastUser = [...dto.messages].reverse().find((m) => m.role === 'user');
    const question = lastUser?.content ?? '';
    let ragContext = '';
    try {
      ragContext = await this.knowledge.buildContext(question);
    } catch (err) {
      this.logger.warn(`RAG indisponible, poursuite sans contexte: ${(err as Error).message}`);
    }

    const systemPrompt = config.systemPrompt || DEFAULT_SYSTEM;
    const contextNote = dto.context ? `\n\nContexte actuel : ${dto.context}` : '';
    const fullSystem = systemPrompt + ragContext + contextNote;

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let answer = '';
    try {
      switch (config.provider) {
        case AiProvider.GROQ:
          answer = await this.streamGroq(config, fullSystem, dto.messages, res);
          break;
        case AiProvider.ANTHROPIC:
          answer = await this.streamAnthropic(config, fullSystem, dto.messages, res);
          break;
        case AiProvider.OPENAI:
          answer = await this.streamOpenai(config, fullSystem, dto.messages, res);
          break;
      }
    } catch (err) {
      this.logger.error(`AI stream error [${config.provider}]`, err);
      res.write(`data: ${JSON.stringify({ error: 'Erreur du service IA' })}\n\n`);
    } finally {
      res.write('data: [DONE]\n\n');
      res.end();
    }

    // --- Journalisation + incrément d'usage APRÈS la réponse ---
    const promptText = fullSystem + '\n' + dto.messages.map((m) => m.content).join('\n');
    const tokens = estimateTokens(promptText) + estimateTokens(answer);
    await this.recordUsage(tenantId, userId, tokens, config.provider, question);
  }

  // ── SARA publique (chatbot de la landing) ────────────────────────────────
  //  Proxy serveur vers Groq : la clé API reste côté backend (GROQ_API_KEY),
  //  plus JAMAIS exposée dans le bundle frontend. Non authentifié mais throttlé
  //  au niveau du contrôleur. Prompt système figé côté serveur ; modèle et
  //  plafond de tokens verrouillés pour éviter tout détournement en proxy IA.
  private static readonly SARA_SYSTEM = `Tu es SARA, l'assistante IA officielle de SANTAREX ERP, édité par IBIG Soft (ibigsoft.com).
SANTAREX ERP est un logiciel de gestion hospitalière SaaS pour l'Afrique de l'Ouest et Centrale.
Plans mensuels : Pharmacie 12 000 | Cabinet 18 000 | Centre de santé 35 000 | Clinique 75 000 | Hôpital 150 000 FCFA/mois. Forfait annuel = 10 mois payés 2 mois offerts.
40 modules couvrant tout le cycle hospitalier, regroupés par domaine : Clinique & Soins (DME, consultations, RDV, hospitalisation, urgences, bloc, maternité, pédiatrie, vaccination, soins infirmiers, consentements, interactions médicamenteuses, HAD), Pharmacie & Plateau technique (pharmacie, laboratoire, imagerie, approvisionnement, banque de sang, stérilisation, équipements, déchets DASRI), Finances & Assurances (facturation, devis, caisse, assureurs, tiers-payant, budget), Communication (portail patient, SMS & rappels, messagerie, satisfaction), Qualité (gardes, incidents, indicateurs, déclarations sanitaires), Opérations (transport/ambulances, morgue, RH, BI, multi-sites).
Paiements : Orange Money, MTN MoMo, Wave, Moov Money, Moneroo, CinetPay.
Support : WhatsApp +225 07 78 88 25 92 | Tél +225 27 22 27 60 14 | contact@ibigsoft.com.
Réponds de façon concise (max 5 lignes), professionnelle et en français. Si la question dépasse tes connaissances, propose de contacter l'équipe.`;

  async saraPublic(message: string): Promise<{ reply: string }> {
    const msg = String(message ?? '').slice(0, 500);
    try {
      const apiKey = this.appConfig.getOrThrow<string>('GROQ_API_KEY');
      const groq = new Groq({ apiKey });
      const completion = await groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        temperature: 0.65,
        max_tokens: 350,
        messages: [
          { role: 'system', content: AiAssistantService.SARA_SYSTEM },
          { role: 'user', content: msg },
        ],
      });
      const reply = completion.choices?.[0]?.message?.content?.trim();
      return {
        reply:
          reply || 'Une erreur est survenue. Contactez-nous : +225 07 78 88 25 92',
      };
    } catch (e) {
      this.logger.warn(`SARA publique — échec Groq : ${(e as Error).message}`);
      return {
        reply:
          'Connexion impossible. Contactez-nous via WhatsApp : +225 07 78 88 25 92',
      };
    }
  }

  private async streamGroq(
    config: AiConfig,
    system: string,
    messages: ChatMessageDto[],
    res: Response,
  ): Promise<string> {
    const apiKey = this.appConfig.getOrThrow<string>('GROQ_API_KEY');
    const groq = new Groq({ apiKey });

    const stream = await groq.chat.completions.create({
      model: config.model,
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    });

    let acc = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        acc += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    return acc;
  }

  private async streamAnthropic(
    config: AiConfig,
    system: string,
    messages: ChatMessageDto[],
    res: Response,
  ): Promise<string> {
    const apiKey = this.appConfig.getOrThrow<string>('ANTHROPIC_API_KEY');
    const anthropic = new Anthropic({ apiKey });

    const stream = await anthropic.messages.create({
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: config.maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      stream: true,
    });

    let acc = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        acc += event.delta.text;
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }
    return acc;
  }

  private async streamOpenai(
    config: AiConfig,
    system: string,
    messages: ChatMessageDto[],
    res: Response,
  ): Promise<string> {
    const apiKey = this.appConfig.getOrThrow<string>('OPENAI_API_KEY');
    const openai = new OpenAI({ apiKey });

    const stream = await openai.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      temperature: config.temperature,
      max_tokens: config.maxTokens,
      messages: [{ role: 'system', content: system }, ...messages],
      stream: true,
    });

    let acc = '';
    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content ?? '';
      if (text) {
        acc += text;
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }
    return acc;
  }
}
