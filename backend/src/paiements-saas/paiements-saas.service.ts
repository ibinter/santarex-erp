import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { createHmac } from 'crypto';
import { PaiementSaas, PaiementSaasStatut, PaiementSaasMethode } from './entities/paiement-saas.entity';
import { InitierPaiementDto, ValiderPaiementManuelDto } from './dto/initier-paiement.dto';
import { LicencesService } from '../licences/licences.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class PaiementsSaasService {
  private readonly logger = new Logger(PaiementsSaasService.name);

  constructor(
    @InjectRepository(PaiementSaas)
    private readonly paiementRepo: Repository<PaiementSaas>,
    private readonly licencesService: LicencesService,
    private readonly auditLogs: AuditLogsService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {}

  private generateReference(): string {
    return `SRX-PAY-${Date.now()}-${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  // ─── Initier un paiement via Moneroo ───────────────────────────────────────

  async initier(
    dto: InitierPaiementDto,
    userId: string,
  ): Promise<{ checkoutUrl: string; reference: string; transactionId: string }> {
    const reference = this.generateReference();

    const paiement = this.paiementRepo.create({
      reference,
      tenantId: dto.licenceId,
      licenceId: dto.licenceId,
      methode: PaiementSaasMethode.MONEROO,
      montant: dto.montant,
      devise: dto.devise ?? 'XOF',
      emailPayeur: dto.emailPayeur,
      nomPayeur: dto.nomPayeur,
      telephone: dto.telephone,
      statut: PaiementSaasStatut.EN_ATTENTE,
    });

    await this.paiementRepo.save(paiement);

    const apiKey = this.config.getOrThrow<string>('MONEROO_SECRET_KEY');
    const returnUrl = `${this.config.getOrThrow<string>('FRONTEND_URL')}/paiement/retour`;
    const webhookUrl = `${this.config.getOrThrow<string>('APP_URL')}/api/v1/paiements-saas/webhook`;

    const [prenom, ...reste] = dto.nomPayeur.trim().split(' ');
    const nom = reste.join(' ') || prenom;

    try {
      const { data } = await firstValueFrom(
        this.http.post<any>(
          'https://api.moneroo.io/v1/payments/initialize',
          {
            amount: dto.montant,
            currency: dto.devise ?? 'XOF',
            description: `Abonnement SANTAREX ERP — réf. ${reference}`,
            return_url: returnUrl,
            webhook_url: webhookUrl,
            reference,
            customer: {
              email: dto.emailPayeur,
              first_name: prenom,
              last_name: nom,
              phone: dto.telephone ?? '',
            },
            metadata: {
              licenceId: dto.licenceId,
              paiementId: paiement.id,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          },
        ),
      );

      const checkoutUrl: string = data?.data?.checkout_url;
      const transactionId: string = data?.data?.id;

      if (!checkoutUrl) {
        this.logger.error('Moneroo: pas de checkout_url', data);
        throw new BadRequestException('Erreur initialisation Moneroo');
      }

      await this.paiementRepo.update(paiement.id, { paymentUrl: checkoutUrl, transactionId });

      return { checkoutUrl, reference, transactionId };
    } catch (err) {
      await this.paiementRepo.update(paiement.id, { statut: PaiementSaasStatut.ECHEC });
      this.logger.error('Moneroo init failed', err?.response?.data ?? err.message);
      throw new BadRequestException('Service de paiement Moneroo indisponible');
    }
  }

  // ─── Webhook Moneroo ───────────────────────────────────────────────────────

  async webhook(payload: Record<string, unknown>, signature: string): Promise<{ status: string }> {
    if (!this.verifierSignatureMoneroo(payload, signature)) {
      this.logger.warn('Moneroo webhook: signature invalide');
      return { status: 'invalid_signature' };
    }

    const reference = payload['reference'] as string;
    const statut = payload['status'] as string;

    if (!reference) return { status: 'ignored' };

    const paiement = await this.paiementRepo.findOne({ where: { reference } });
    if (!paiement) return { status: 'not_found' };

    // Idempotence : ne pas retraiter un paiement déjà confirmé
    if (paiement.statut === PaiementSaasStatut.SUCCES) return { status: 'already_processed' };

    if (statut === 'success') {
      await this.paiementRepo.update(paiement.id, {
        statut: PaiementSaasStatut.SUCCES,
        webhookPayload: payload,
        transactionId: payload['id'] as string ?? paiement.transactionId,
      });
      await this.activerLicence(paiement);
      this.logger.log(`Paiement ${reference} confirmé via Moneroo, licence activée`);
    } else if (statut === 'failed' || statut === 'cancelled') {
      await this.paiementRepo.update(paiement.id, {
        statut: statut === 'cancelled' ? PaiementSaasStatut.ANNULE : PaiementSaasStatut.ECHEC,
        webhookPayload: payload,
      });
    }

    return { status: 'processed' };
  }

  private verifierSignatureMoneroo(payload: Record<string, unknown>, signature: string): boolean {
    const secret = this.config.get<string>('MONEROO_WEBHOOK_SECRET');
    if (!secret) return true; // En dev sans secret configuré, on accepte
    const expected = createHmac('sha256', secret)
      .update(JSON.stringify(payload))
      .digest('hex');
    return expected === signature;
  }

  // ─── Paiement manuel (validation SUPERADMIN) ───────────────────────────────

  async validerManuel(dto: ValiderPaiementManuelDto, adminId: string): Promise<PaiementSaas> {
    const paiement = await this.paiementRepo.findOne({ where: { id: dto.paiementId } });
    if (!paiement) throw new NotFoundException('Paiement introuvable');
    if (paiement.statut !== PaiementSaasStatut.EN_ATTENTE) {
      throw new BadRequestException('Ce paiement ne peut plus être validé');
    }

    await this.paiementRepo.update(paiement.id, {
      statut: PaiementSaasStatut.SUCCES,
      methode: PaiementSaasMethode.MANUEL,
      notesAdmin: dto.notesAdmin,
      validePar: adminId,
      valideAt: new Date(),
    });

    await this.activerLicence(paiement);

    this.auditLogs.log({
      action: AuditAction.UPDATE,
      ressource: 'PaiementSaas',
      ressourceId: paiement.id,
      userId: adminId,
      contexte: { montant: paiement.montant, reference: paiement.reference },
    });

    return this.paiementRepo.findOne({ where: { id: paiement.id } });
  }

  private async activerLicence(paiement: PaiementSaas): Promise<void> {
    try {
      await this.licencesService.renouveler(paiement.licenceId, 12);
    } catch (err) {
      this.logger.error(`Échec activation licence ${paiement.licenceId}`, err);
    }
  }

  // ─── Vérifier statut Moneroo (polling frontend) ───────────────────────────

  async verifierStatut(transactionId: string): Promise<{ statut: string; reference?: string }> {
    const apiKey = this.config.getOrThrow<string>('MONEROO_SECRET_KEY');
    try {
      const { data } = await firstValueFrom(
        this.http.get<any>(`https://api.moneroo.io/v1/payments/${transactionId}`, {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
        }),
      );
      return { statut: data?.data?.status, reference: data?.data?.reference };
    } catch {
      throw new BadRequestException('Impossible de vérifier le statut du paiement');
    }
  }

  // ─── Queries ───────────────────────────────────────────────────────────────

  async findAll(tenantId?: string): Promise<PaiementSaas[]> {
    const where = tenantId ? { tenantId } : {};
    return this.paiementRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async findOne(id: string, tenantId?: string): Promise<PaiementSaas> {
    // tenantId fourni (non-superadmin) → scope obligatoire pour éviter toute
    // fuite inter-société ; absent (superadmin) → accès global assumé.
    const where = tenantId ? { id, tenantId } : { id };
    const p = await this.paiementRepo.findOne({ where });
    if (!p) throw new NotFoundException('Paiement introuvable');
    return p;
  }
}
