import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SessionCaisse, StatutSessionCaisse } from './entities/session-caisse.entity';
import { Recu, ModeRecu } from './entities/recu.entity';
import {
  OuvrirSessionDto,
  CloturerSessionDto,
  CreateRecuDto,
} from './dto/caisse-sessions.dto';

const num = (v: unknown): number => Number(v) || 0;
const round2 = (v: number): number => Math.round(v * 100) / 100;

@Injectable()
export class CaisseSessionsService {
  constructor(
    @InjectRepository(SessionCaisse)
    private readonly sessionRepo: Repository<SessionCaisse>,
    @InjectRepository(Recu)
    private readonly recuRepo: Repository<Recu>,
  ) {}

  // ── Génération des numéros séquentiels par tenant ──────────────────────
  private async genererNumero(
    tenantId: string,
    repoTable: 'session' | 'recu',
  ): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = repoTable === 'session' ? `CAI-${year}-` : `REC-${year}-`;

    if (repoTable === 'session') {
      const dernier = await this.sessionRepo
        .createQueryBuilder('s')
        .where('s.tenantId = :tenantId', { tenantId })
        .andWhere('s.numero LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('s.numero', 'DESC')
        .getOne();
      const seq = dernier ? parseInt(dernier.numero.split('-').pop() as string, 10) + 1 : 1;
      return `${prefix}${String(seq).padStart(4, '0')}`;
    }

    const dernier = await this.recuRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.numero LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('r.numero', 'DESC')
      .getOne();
    const seq = dernier ? parseInt(dernier.numero.split('-').pop() as string, 10) + 1 : 1;
    return `${prefix}${String(seq).padStart(4, '0')}`;
  }

  // ── Sessions ───────────────────────────────────────────────────────────
  async ouvrir(
    dto: OuvrirSessionDto,
    tenantId: string,
    userId: string,
  ): Promise<SessionCaisse> {
    const existante = await this.sessionRepo.findOne({
      where: { tenantId, caissierRef: userId, statut: StatutSessionCaisse.OUVERTE },
    });
    if (existante) {
      throw new BadRequestException(
        'Une session de caisse est déjà ouverte pour ce caissier',
      );
    }

    const numero = await this.genererNumero(tenantId, 'session');
    const session = this.sessionRepo.create({
      numero,
      caissierRef: userId,
      dateOuverture: new Date(),
      fondCaisseInitial: round2(num(dto.fondCaisseInitial)),
      montantTheoriqueEspeces: round2(num(dto.fondCaisseInitial)),
      ecart: 0,
      totalEncaisse: 0,
      totauxParMode: {},
      statut: StatutSessionCaisse.OUVERTE,
      notes: dto.notes ?? null,
      tenantId,
      createdById: userId,
    });
    return this.sessionRepo.save(session);
  }

  /** Recalcule totaux par mode + total encaissé à partir des reçus rattachés. */
  private async calculerTotaux(
    sessionId: string,
    tenantId: string,
  ): Promise<{ totauxParMode: Record<string, number>; totalEncaisse: number; totalEspeces: number }> {
    const recus = await this.recuRepo.find({ where: { sessionId, tenantId } });
    const totauxParMode: Record<string, number> = {};
    let totalEncaisse = 0;
    for (const r of recus) {
      const montant = num(r.montant);
      totauxParMode[r.modePaiement] = round2((totauxParMode[r.modePaiement] || 0) + montant);
      totalEncaisse += montant;
    }
    return {
      totauxParMode,
      totalEncaisse: round2(totalEncaisse),
      totalEspeces: round2(totauxParMode[ModeRecu.ESPECES] || 0),
    };
  }

  async cloturer(
    id: string,
    dto: CloturerSessionDto,
    tenantId: string,
  ): Promise<SessionCaisse> {
    const session = await this.findOne(id, tenantId);
    if (session.statut === StatutSessionCaisse.CLOTUREE) {
      throw new BadRequestException('Cette session est déjà clôturée');
    }

    const { totauxParMode, totalEncaisse, totalEspeces } = await this.calculerTotaux(id, tenantId);
    const montantTheoriqueEspeces = round2(num(session.fondCaisseInitial) + totalEspeces);
    const montantCompteEspeces = round2(num(dto.montantCompteEspeces));
    const ecart = round2(montantCompteEspeces - montantTheoriqueEspeces);

    await this.sessionRepo.update(id, {
      statut: StatutSessionCaisse.CLOTUREE,
      dateCloture: new Date(),
      montantTheoriqueEspeces,
      montantCompteEspeces,
      ecart,
      totalEncaisse,
      totauxParMode,
      notes: dto.notes ?? session.notes,
    });
    return this.findOne(id, tenantId);
  }

  async findAll(
    tenantId: string,
    filters: { statut?: string; caissierRef?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId });
    if (filters.statut) qb.andWhere('s.statut = :statut', { statut: filters.statut });
    if (filters.caissierRef) qb.andWhere('s.caissierRef = :cref', { cref: filters.caissierRef });

    const [data, total] = await qb
      .orderBy('s.dateOuverture', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  /** Session actuellement ouverte pour le caissier courant (ou null). */
  async findSessionOuverte(tenantId: string, userId: string): Promise<SessionCaisse | null> {
    return this.sessionRepo.findOne({
      where: { tenantId, caissierRef: userId, statut: StatutSessionCaisse.OUVERTE },
      order: { dateOuverture: 'DESC' },
    });
  }

  async findOne(id: string, tenantId: string): Promise<SessionCaisse> {
    const session = await this.sessionRepo.findOne({ where: { id, tenantId } });
    if (!session) throw new NotFoundException(`Session de caisse ${id} non trouvée`);
    return session;
  }

  /** Détail d'une session enrichi de ses reçus et totaux recalculés à la volée. */
  async findOneDetail(id: string, tenantId: string) {
    const session = await this.findOne(id, tenantId);
    const recus = await this.recuRepo.find({
      where: { sessionId: id, tenantId },
      order: { date: 'DESC' },
    });
    const totaux = await this.calculerTotaux(id, tenantId);
    return { ...session, recus, ...totaux };
  }

  // ── Reçus ────────────────────────────────────────────────────────────────
  async createRecu(dto: CreateRecuDto, tenantId: string, userId: string): Promise<Recu> {
    let sessionId = dto.sessionId ?? null;
    // Rattachement auto à la session ouverte du caissier si non fourni.
    if (!sessionId) {
      const ouverte = await this.findSessionOuverte(tenantId, userId);
      sessionId = ouverte?.id ?? null;
    } else {
      // Vérifie que la session ciblée appartient bien au tenant.
      await this.findOne(sessionId, tenantId);
    }

    const numero = await this.genererNumero(tenantId, 'recu');
    const recu = this.recuRepo.create({
      numero,
      sessionId,
      patientId: dto.patientId ?? null,
      factureRef: dto.factureRef ?? null,
      paiementRef: dto.paiementRef ?? null,
      montant: round2(num(dto.montant)),
      devise: dto.devise ?? 'XOF',
      modePaiement: dto.modePaiement,
      date: new Date(),
      objet: dto.objet ?? null,
      emisParRef: userId,
      notes: dto.notes ?? null,
      tenantId,
    });
    const saved = await this.recuRepo.save(recu);

    // Met à jour les totaux courants de la session (si rattachée & ouverte).
    if (sessionId) await this.rafraichirTotauxSession(sessionId, tenantId);
    return saved;
  }

  private async rafraichirTotauxSession(sessionId: string, tenantId: string): Promise<void> {
    const session = await this.sessionRepo.findOne({ where: { id: sessionId, tenantId } });
    if (!session || session.statut !== StatutSessionCaisse.OUVERTE) return;
    const { totauxParMode, totalEncaisse, totalEspeces } = await this.calculerTotaux(sessionId, tenantId);
    await this.sessionRepo.update(sessionId, {
      totauxParMode,
      totalEncaisse,
      montantTheoriqueEspeces: round2(num(session.fondCaisseInitial) + totalEspeces),
    });
  }

  async findAllRecus(
    tenantId: string,
    filters: { sessionId?: string; patientId?: string } = {},
    pagination: { page?: number; limit?: number } = {},
  ) {
    const page = pagination.page ?? 1;
    const limit = pagination.limit ?? 50;
    const skip = (page - 1) * limit;

    const qb = this.recuRepo
      .createQueryBuilder('r')
      .where('r.tenantId = :tenantId', { tenantId });
    if (filters.sessionId) qb.andWhere('r.sessionId = :sid', { sid: filters.sessionId });
    if (filters.patientId) qb.andWhere('r.patientId = :pid', { pid: filters.patientId });

    const [data, total] = await qb
      .orderBy('r.date', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    return { data, total, page, limit };
  }

  async findOneRecu(id: string, tenantId: string): Promise<Recu> {
    const recu = await this.recuRepo.findOne({ where: { id, tenantId } });
    if (!recu) throw new NotFoundException(`Reçu ${id} non trouvé`);
    return recu;
  }

  // ── Stats ──────────────────────────────────────────────────────────────
  async getStats(tenantId: string, date?: string) {
    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const sessionsJour = await this.sessionRepo
      .createQueryBuilder('s')
      .where('s.tenantId = :tenantId', { tenantId })
      .andWhere('s.dateOuverture BETWEEN :debut AND :fin', { debut: targetDate, fin: endDate })
      .getMany();

    const sessionsOuvertes = sessionsJour.filter((s) => s.statut === StatutSessionCaisse.OUVERTE).length;
    const sessionsCloturees = sessionsJour.filter((s) => s.statut === StatutSessionCaisse.CLOTUREE);
    const totalEncaisseJour = round2(sessionsJour.reduce((sum, s) => sum + num(s.totalEncaisse), 0));
    const totalEcarts = round2(sessionsCloturees.reduce((sum, s) => sum + num(s.ecart), 0));

    const recusResult = await this.recuRepo
      .createQueryBuilder('r')
      .select('COUNT(r.id)', 'count')
      .addSelect('COALESCE(SUM(r.montant), 0)', 'total')
      .where('r.tenantId = :tenantId', { tenantId })
      .andWhere('r.date BETWEEN :debut AND :fin', { debut: targetDate, fin: endDate })
      .getRawOne();

    return {
      date: targetDate,
      nbSessionsJour: sessionsJour.length,
      sessionsOuvertes,
      sessionsCloturees: sessionsCloturees.length,
      totalEncaisseJour,
      totalEcarts,
      nbRecusJour: Number(recusResult?.count ?? 0),
      totalRecusJour: round2(num(recusResult?.total)),
    };
  }
}
