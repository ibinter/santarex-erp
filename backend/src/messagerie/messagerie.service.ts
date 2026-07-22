import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Conversation, ConversationType } from './entities/conversation.entity';
import { MessageInterne } from './entities/message-interne.entity';
import { User } from '../users/entities/user.entity';
import { CreateConversationDto, EnvoyerMessageDto } from './dto/messagerie.dto';

/** Utilisateur authentifié tel que fourni par JwtStrategy.validate(). */
interface AuthUser {
  id: string;
  tenantId: string;
}

@Injectable()
export class MessagerieService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversations: Repository<Conversation>,
    @InjectRepository(MessageInterne)
    private readonly messages: Repository<MessageInterne>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  // ── Helpers ────────────────────────────────────────────────────────────

  /** Récupère une conversation en garantissant tenant + participation. */
  private async getConversationParticipant(
    conversationId: string,
    user: AuthUser,
  ): Promise<Conversation> {
    const conv = await this.conversations.findOne({
      where: { id: conversationId, tenantId: user.tenantId },
    });
    if (!conv) throw new NotFoundException('Conversation introuvable');
    if (!(conv.participantsIds ?? []).includes(user.id)) {
      throw new ForbiddenException('Vous ne participez pas à cette conversation');
    }
    return conv;
  }

  /** Valide que tous les ids fournis sont des utilisateurs actifs du tenant. */
  private async resoudreParticipants(
    ids: string[],
    tenantId: string,
  ): Promise<string[]> {
    const uniques = Array.from(new Set(ids.filter(Boolean)));
    if (uniques.length === 0) {
      throw new BadRequestException('Aucun destinataire valide');
    }
    const trouves = await this.users.find({
      where: { id: In(uniques), tenantId, isActive: true },
      select: ['id'],
    });
    if (trouves.length !== uniques.length) {
      throw new BadRequestException(
        'Un ou plusieurs destinataires sont invalides pour cet établissement',
      );
    }
    return uniques;
  }

  private async enrichirNoms(userIds: string[], tenantId: string) {
    const uniques = Array.from(new Set(userIds.filter(Boolean)));
    if (uniques.length === 0) return {} as Record<string, { id: string; nom: string; role: string }>;
    const rows = await this.users.find({
      where: { id: In(uniques), tenantId },
      select: ['id', 'firstName', 'lastName', 'role'],
    });
    const map: Record<string, { id: string; nom: string; role: string }> = {};
    for (const u of rows) {
      map[u.id] = { id: u.id, nom: `${u.firstName} ${u.lastName}`.trim(), role: u.role };
    }
    return map;
  }

  // ── Conversations ──────────────────────────────────────────────────────

  /** Liste les conversations de l'utilisateur courant, triées par récence. */
  async mesConversations(user: AuthUser) {
    // jsonb array contains : participantsIds @> ["<id>"]
    const list = await this.conversations
      .createQueryBuilder('c')
      .where('c.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('c."participantsIds" @> :moi', { moi: JSON.stringify([user.id]) })
      .orderBy('COALESCE(c."dateDernierMessage", c."createdAt")', 'DESC')
      .getMany();

    const tousParticipants = list.flatMap((c) => c.participantsIds ?? []);
    const noms = await this.enrichirNoms(tousParticipants, user.tenantId);

    // Compteur de non-lus par conversation pour cet utilisateur.
    const enrichies = await Promise.all(
      list.map(async (c) => {
        const nonLus = await this.compterNonLusConversation(c.id, user);
        return {
          ...c,
          nonLus,
          participants: (c.participantsIds ?? []).map(
            (id) => noms[id] ?? { id, nom: 'Utilisateur', role: '' },
          ),
        };
      }),
    );
    return enrichies;
  }

  async creerConversation(dto: CreateConversationDto, user: AuthUser) {
    const autres = (dto.participantsIds ?? []).filter((id) => id !== user.id);
    const valides = await this.resoudreParticipants(autres, user.tenantId);
    const participantsIds = Array.from(new Set([user.id, ...valides]));

    const type =
      dto.type ??
      (participantsIds.length > 2 ? ConversationType.GROUPE : ConversationType.DIRECT);

    // Pour une conversation directe, réutiliser une conversation existante entre
    // exactement les deux mêmes participants (évite les doublons).
    if (type === ConversationType.DIRECT && participantsIds.length === 2) {
      const existantes = await this.conversations
        .createQueryBuilder('c')
        .where('c.tenantId = :tenantId', { tenantId: user.tenantId })
        .andWhere('c.type = :type', { type: ConversationType.DIRECT })
        .andWhere('c."participantsIds" @> :a', { a: JSON.stringify([participantsIds[0]]) })
        .andWhere('c."participantsIds" @> :b', { b: JSON.stringify([participantsIds[1]]) })
        .getMany();
      const match = existantes.find(
        (c) => (c.participantsIds ?? []).length === 2,
      );
      if (match) {
        if (dto.message?.trim()) {
          await this.envoyerMessage(match.id, { contenu: dto.message }, user);
        }
        return this.getConversationDetail(match.id, user);
      }
    }

    const conv = this.conversations.create({
      tenantId: user.tenantId,
      sujet: dto.sujet?.trim() || undefined,
      type,
      participantsIds,
      creeParId: user.id,
    });
    const saved = await this.conversations.save(conv);

    if (dto.message?.trim()) {
      await this.envoyerMessage(saved.id, { contenu: dto.message }, user);
    }
    return this.getConversationDetail(saved.id, user);
  }

  async getConversationDetail(conversationId: string, user: AuthUser) {
    const conv = await this.getConversationParticipant(conversationId, user);
    const noms = await this.enrichirNoms(conv.participantsIds ?? [], user.tenantId);
    return {
      ...conv,
      participants: (conv.participantsIds ?? []).map(
        (id) => noms[id] ?? { id, nom: 'Utilisateur', role: '' },
      ),
    };
  }

  // ── Messages ───────────────────────────────────────────────────────────

  async messagesDe(conversationId: string, user: AuthUser) {
    await this.getConversationParticipant(conversationId, user);
    const list = await this.messages.find({
      where: { conversationId, tenantId: user.tenantId },
      order: { dateEnvoi: 'ASC' },
    });
    const auteurs = await this.enrichirNoms(
      list.map((m) => m.auteurId),
      user.tenantId,
    );
    return list.map((m) => ({
      ...m,
      auteurNom: auteurs[m.auteurId]?.nom ?? 'Utilisateur',
      estMoi: m.auteurId === user.id,
      lu: (m.luPar ?? []).includes(user.id),
    }));
  }

  async envoyerMessage(
    conversationId: string,
    dto: EnvoyerMessageDto,
    user: AuthUser,
  ) {
    const conv = await this.getConversationParticipant(conversationId, user);

    const message = this.messages.create({
      tenantId: user.tenantId,
      conversationId,
      auteurId: user.id,
      contenu: dto.contenu,
      pieceJointeUrl: dto.pieceJointeUrl,
      luPar: [user.id], // l'auteur a lu son propre message
    });
    const saved = await this.messages.save(message);

    conv.dateDernierMessage = saved.dateEnvoi;
    conv.dernierMessageApercu = dto.contenu.slice(0, 140);
    await this.conversations.save(conv);

    return saved;
  }

  // ── Lecture / non-lus ──────────────────────────────────────────────────

  /** Marque tous les messages d'une conversation comme lus par l'utilisateur. */
  async marquerLu(conversationId: string, user: AuthUser) {
    await this.getConversationParticipant(conversationId, user);
    const nonLus = await this.messages.find({
      where: { conversationId, tenantId: user.tenantId },
    });
    const aMettreAJour = nonLus.filter((m) => !(m.luPar ?? []).includes(user.id));
    for (const m of aMettreAJour) {
      m.luPar = Array.from(new Set([...(m.luPar ?? []), user.id]));
    }
    if (aMettreAJour.length > 0) {
      await this.messages.save(aMettreAJour);
    }
    return { conversationId, marques: aMettreAJour.length };
  }

  private async compterNonLusConversation(
    conversationId: string,
    user: AuthUser,
  ): Promise<number> {
    return this.messages
      .createQueryBuilder('m')
      .where('m."conversationId" = :conversationId', { conversationId })
      .andWhere('m.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('m."auteurId" != :moi', { moi: user.id })
      .andWhere('NOT (m."luPar" @> :moiArr)', { moiArr: JSON.stringify([user.id]) })
      .getCount();
  }

  /** Compteur global de messages non lus pour l'utilisateur (ses conversations). */
  async compterNonLus(user: AuthUser): Promise<{ total: number }> {
    const total = await this.messages
      .createQueryBuilder('m')
      .innerJoin(
        Conversation,
        'c',
        'c.id = m."conversationId" AND c."participantsIds" @> :moiArr',
        { moiArr: JSON.stringify([user.id]) },
      )
      .where('m.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('m."auteurId" != :moi', { moi: user.id })
      .andWhere('NOT (m."luPar" @> :moiArr)', { moiArr: JSON.stringify([user.id]) })
      .getCount();
    return { total };
  }

  // ── Destinataires (annuaire du tenant) ─────────────────────────────────

  /** Utilisateurs actifs du tenant, hors utilisateur courant, filtrables. */
  async destinataires(user: AuthUser, recherche?: string) {
    const qb = this.users
      .createQueryBuilder('u')
      .where('u.tenantId = :tenantId', { tenantId: user.tenantId })
      .andWhere('u.isActive = true')
      .andWhere('u.id != :moi', { moi: user.id })
      .orderBy('u.lastName', 'ASC')
      .addOrderBy('u.firstName', 'ASC')
      .take(100);

    if (recherche?.trim()) {
      const q = `%${recherche.trim().toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(u.firstName) LIKE :q OR LOWER(u.lastName) LIKE :q OR LOWER(u.email) LIKE :q)',
        { q },
      );
    }

    const rows = await qb.getMany();
    return rows.map((u) => ({
      id: u.id,
      nom: `${u.firstName} ${u.lastName}`.trim(),
      email: u.email,
      role: u.role,
    }));
  }
}
