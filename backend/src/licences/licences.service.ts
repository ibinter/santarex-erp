import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Licence, LicenceStatut, LicenceModePaiement } from './entities/licence.entity';
import { User } from '../users/entities/user.entity';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { TenantsService } from '../tenants/tenants.service';
import { CreateLicenceDto } from './dto/create-licence.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';
import { MailService } from '../mail/mail.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LicencesService {
  private readonly logger = new Logger(LicencesService.name);

  constructor(
    @InjectRepository(Licence)
    private readonly licenceRepository: Repository<Licence>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly offresSaasService: OffresSaasService,
    private readonly tenantsService: TenantsService,
    private readonly auditLogs: AuditLogsService,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private generateCle(): string {
    const part = () => uuidv4().replace(/-/g, '').toUpperCase().slice(0, 5);
    return `SRX-${part()}-${part()}-${part()}`;
  }

  async creer(dto: CreateLicenceDto, activeParId?: string): Promise<Licence> {
    const offre = await this.offresSaasService.findOne(dto.offreId);
    await this.tenantsService.findBySlug(dto.tenantSlug);

    const dateDebut = new Date(dto.dateDebut);
    let dateExpiration: Date;

    if (dto.dateExpiration) {
      dateExpiration = new Date(dto.dateExpiration);
    } else {
      dateExpiration = new Date(dateDebut);
      dateExpiration.setMonth(dateExpiration.getMonth() + 1);
    }

    const joursEssai = dto.joursEssai ?? 0;
    const statut = joursEssai > 0 ? LicenceStatut.ESSAI : LicenceStatut.ACTIVE;

    const licence = this.licenceRepository.create({
      cle: this.generateCle(),
      tenantSlug: dto.tenantSlug,
      offreId: dto.offreId,
      offreCode: offre.code,
      statut,
      dateDebut,
      dateExpiration,
      maxUtilisateurs: dto.maxUtilisateurs ?? offre.maxUtilisateurs,
      montantPaye: dto.montantPaye ?? 0,
      modePaiement: dto.modePaiement ?? LicenceModePaiement.MANUEL,
      refTransaction: dto.refTransaction,
      joursEssai,
      activeParId,
      notes: dto.notes,
      modulesActivesJson: offre.modulesInclus,
    });

    const saved = await this.licenceRepository.save(licence);

    this.auditLogs.log({
      action: AuditAction.CREATE,
      ressource: 'Licence',
      ressourceId: saved.id,
      userId: activeParId,
      contexte: {
        tenantSlug: saved.tenantSlug,
        offreCode: saved.offreCode,
        statut: saved.statut,
        maxUtilisateurs: saved.maxUtilisateurs,
        dateExpiration: saved.dateExpiration,
      },
    });

    return saved;
  }

  async findAll(paginationDto: PaginationDto) {
    const { page = 1, limit = 20 } = paginationDto;
    const [data, total] = await this.licenceRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findByTenant(tenantSlug: string): Promise<Licence[]> {
    return this.licenceRepository.find({
      where: { tenantSlug },
      order: { createdAt: 'DESC' },
    });
  }

  async findActive(tenantSlug: string): Promise<Licence | null> {
    const now = new Date();
    return this.licenceRepository
      .createQueryBuilder('l')
      .where('l.tenantSlug = :tenantSlug', { tenantSlug })
      .andWhere('l.statut IN (:...statuts)', { statuts: [LicenceStatut.ACTIVE, LicenceStatut.ESSAI] })
      .andWhere('l.dateExpiration > :now', { now })
      .orderBy('l.dateExpiration', 'DESC')
      .getOne();
  }

  async verifier(tenantSlug: string): Promise<{ valide: boolean; licence?: Licence; message: string }> {
    const licence = await this.findActive(tenantSlug);
    if (!licence) {
      return { valide: false, message: 'Aucune licence active pour cet établissement' };
    }
    const joursRestants = Math.ceil(
      (licence.dateExpiration.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    return {
      valide: true,
      licence,
      message: `Licence valide — expire dans ${joursRestants} jour(s)`,
    };
  }

  async suspendre(id: string, acteurId?: string): Promise<Licence> {
    const l = await this.findOne(id);
    const statutAvant = l.statut;
    l.statut = LicenceStatut.SUSPENDUE;
    const saved = await this.licenceRepository.save(l);

    this.auditLogs.log({
      action: AuditAction.SUSPEND,
      ressource: 'Licence',
      ressourceId: saved.id,
      userId: acteurId,
      avant: { statut: statutAvant },
      apres: { statut: saved.statut },
      contexte: { tenantSlug: saved.tenantSlug, offreCode: saved.offreCode },
    });

    return saved;
  }

  async renouveler(id: string, mois = 1, acteurId?: string): Promise<Licence> {
    const l = await this.findOne(id);
    const expirationAvant = l.dateExpiration;
    const statutAvant = l.statut;
    const base = l.dateExpiration > new Date() ? l.dateExpiration : new Date();
    const nouvelleExpiration = new Date(base);
    nouvelleExpiration.setMonth(nouvelleExpiration.getMonth() + mois);
    l.dateExpiration = nouvelleExpiration;
    l.dateDernierRenouvellement = new Date();
    l.statut = LicenceStatut.ACTIVE;
    const saved = await this.licenceRepository.save(l);

    this.auditLogs.log({
      action: AuditAction.UPDATE,
      ressource: 'Licence',
      ressourceId: saved.id,
      userId: acteurId,
      avant: { statut: statutAvant, dateExpiration: expirationAvant },
      apres: { statut: saved.statut, dateExpiration: saved.dateExpiration },
      contexte: { operation: 'RENOUVELLEMENT', mois, tenantSlug: saved.tenantSlug },
    });

    return saved;
  }

  async findOne(id: string): Promise<Licence> {
    const l = await this.licenceRepository.findOne({ where: { id } });
    if (!l) throw new NotFoundException('Licence introuvable');
    return l;
  }

  // ── Anti-partage de licence : plafond d'utilisateurs (maxUtilisateurs) ───────

  /**
   * Vérifie qu'un tenant peut encore créer un utilisateur actif au regard du
   * plafond `maxUtilisateurs` de sa licence active. À appeler par le module
   * `users` AVANT toute création d'utilisateur, par exemple :
   *
   *   const quota = await this.licencesService.verifierQuotaUtilisateurs(tenantSlug);
   *   if (!quota.autorise) {
   *     throw new ForbiddenException(quota.message);
   *   }
   *
   * Retourne `autorise = false` si aucune licence active n'existe (usage sans
   * licence) ou si le nombre d'utilisateurs actifs a atteint le plafond. En cas
   * de dépassement, une alerte de sécurité best-effort est émise (anti-partage).
   *
   * NOTE : `User.tenantId` référence le slug du tenant (= `Licence.tenantSlug`).
   */
  async verifierQuotaUtilisateurs(tenantSlug: string): Promise<{
    autorise: boolean;
    actuel: number;
    max: number;
    licence?: Licence;
    message: string;
  }> {
    const licence = await this.findActive(tenantSlug);
    if (!licence) {
      // Best-effort : signaler l'usage sans licence active.
      this.signalerAnomalieLicence(tenantSlug, {
        motif: 'AUCUNE_LICENCE_ACTIVE',
        detail: 'Tentative de création d\'utilisateur sans licence active.',
      });
      return {
        autorise: false,
        actuel: 0,
        max: 0,
        message: 'Aucune licence active pour cet établissement — création refusée.',
      };
    }

    const actuel = await this.userRepository.count({
      where: { tenantId: tenantSlug, isActive: true },
    });
    const max = licence.maxUtilisateurs;
    // On autorise la création tant que l'ajout d'un utilisateur ne dépasse pas
    // le plafond : actuel < max.
    const autorise = actuel < max;

    if (!autorise) {
      this.logger.warn(
        `Quota utilisateurs atteint pour ${tenantSlug} : ${actuel}/${max} (licence ${licence.cle}).`,
      );
      this.signalerAnomalieLicence(tenantSlug, {
        motif: 'DEPASSEMENT_QUOTA_UTILISATEURS',
        detail: `Utilisateurs actifs ${actuel}/${max} — plafond de licence atteint (anti-partage).`,
        licenceCle: licence.cle,
      });
    }

    return {
      autorise,
      actuel,
      max,
      licence,
      message: autorise
        ? `Quota OK : ${actuel}/${max} utilisateurs actifs.`
        : `Plafond de licence atteint : ${actuel}/${max} utilisateurs actifs. `
          + 'Création refusée (mettez à niveau votre offre pour ajouter des utilisateurs).',
    };
  }

  /**
   * Émet une alerte de sécurité best-effort (email + audit) sur détection d'une
   * anomalie de licence (dépassement de quota, usage sans licence, échecs
   * répétés). Ne lève jamais : ne doit pas casser le flux métier appelant.
   *
   * L'email est envoyé à l'adresse `SECURITY_ALERT_EMAIL` si elle est définie
   * (sinon on se contente de la trace d'audit). La signature figée de
   * `mailService.envoyerAlerteSecurite` est réutilisée pour véhiculer le contexte.
   */
  private signalerAnomalieLicence(
    tenantSlug: string,
    infos: { motif: string; detail: string; licenceCle?: string },
  ): void {
    // 1) Piste d'audit (toujours).
    this.auditLogs.log({
      action: AuditAction.SUSPEND,
      ressource: 'Licence',
      contexte: {
        anomalie: infos.motif,
        detail: infos.detail,
        licenceCle: infos.licenceCle,
        tenantSlug,
      },
    });

    // 2) Alerte email best-effort (uniquement si un destinataire est configuré).
    const destinataire = this.config.get<string>('SECURITY_ALERT_EMAIL');
    if (!destinataire) return;

    const appUrl = this.config.get<string>('APP_URL', 'https://app.santarex.ci');
    this.mailService
      .envoyerAlerteSecurite({
        to: destinataire,
        prenom: 'Administrateur',
        dateConnexion: new Date().toISOString(),
        adresseIp: 'N/A',
        navigateur: `${infos.motif} — ${infos.detail}`,
        tenantSlug,
        urlChangerMdp: `${appUrl}/superadmin/licences`,
      })
      .catch((e) =>
        this.logger.error(
          `Échec envoi alerte sécurité licence (${infos.motif}) pour ${tenantSlug}: ${e?.message ?? e}`,
        ),
      );
  }

  async stats(): Promise<Record<string, number>> {
    const total = await this.licenceRepository.count();
    const actives = await this.licenceRepository.count({ where: { statut: LicenceStatut.ACTIVE } });
    const essai = await this.licenceRepository.count({ where: { statut: LicenceStatut.ESSAI } });
    const suspendues = await this.licenceRepository.count({ where: { statut: LicenceStatut.SUSPENDUE } });
    return { total, actives, essai, suspendues };
  }
}
