import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { PaginationDto } from '../common/dto/pagination.dto';

export interface LogAuditOptions {
  action: AuditAction;
  ressource: string;
  ressourceId?: string;
  avant?: any;
  apres?: any;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
  contexte?: any;
}

@Injectable()
export class AuditLogsService {
  private readonly logger = new Logger(AuditLogsService.name);

  constructor(
    @InjectRepository(AuditLog)
    private readonly auditRepository: Repository<AuditLog>,
  ) {}

  async log(opts: LogAuditOptions): Promise<void> {
    const entry = this.auditRepository.create({
      action: opts.action,
      ressource: opts.ressource,
      ressourceId: opts.ressourceId,
      avantJson: opts.avant ? JSON.stringify(opts.avant) : null,
      apresJson: opts.apres ? JSON.stringify(opts.apres) : null,
      userId: opts.userId,
      userEmail: opts.userEmail,
      userRole: opts.userRole,
      tenantId: opts.tenantId,
      ipAddress: opts.ipAddress,
      userAgent: opts.userAgent,
      contexteJson: opts.contexte ? JSON.stringify(opts.contexte) : null,
    });
    // fire-and-forget — ne jamais bloquer la requête principale, mais ne JAMAIS
    // avaler silencieusement une perte de piste d'audit : on trace l'échec
    // d'écriture (action + ressource) pour permettre l'investigation.
    this.auditRepository.save(entry).catch((err) => {
      this.logger.error(
        `Échec d'écriture du journal d'audit [${opts.action} ${opts.ressource}` +
          `${opts.ressourceId ? ' #' + opts.ressourceId : ''}]: ${err?.message ?? err}`,
      );
    });
  }

  async findAll(
    paginationDto: PaginationDto,
    filters?: { tenantId?: string; userId?: string; action?: AuditAction; ressource?: string },
  ) {
    const { page = 1, limit = 50 } = paginationDto;
    const qb = this.auditRepository
      .createQueryBuilder('a')
      .orderBy('a.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (filters?.tenantId) qb.andWhere('a.tenantId = :tenantId', { tenantId: filters.tenantId });
    if (filters?.userId) qb.andWhere('a.userId = :userId', { userId: filters.userId });
    if (filters?.action) qb.andWhere('a.action = :action', { action: filters.action });
    if (filters?.ressource) qb.andWhere('a.ressource = :ressource', { ressource: filters.ressource });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }
}
