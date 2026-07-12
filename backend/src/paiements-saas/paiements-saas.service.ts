import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { PaiementSaas, PaiementSaasStatut, PaiementSaasMethode } from './entities/paiement-saas.entity';
import { InitierPaiementDto, ValiderPaiementManuelDto } from './dto/initier-paiement.dto';
import { LicencesService } from '../licences/licences.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

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

  async initier(dto: InitierPaiementDto, userId: string): Promise<{ paymentUrl?: string; reference: string; message: string }> {
    const reference = this.generateReference();

    const paiement = this.paiementRepo.create({
      reference,
      tenantId: dto.licenceId,
      licenceId: dto.licenceId,
      methode: dto.methode,
      montant: dto.montant,
      emailPayeur: dto.emailPayeur,
      nomPayeur: dto.nomPayeur,
      telephone: dto.telephone,
      statut: PaiementSaasStatut.EN_ATTENTE,
    });

    await this.paiementRepo.save(paiement);

    if (dto.methode === PaiementSaasMethode.CINETPAY) {
      return this.initierCinetPay(paiement);
    }

    if (dto.methode === PaiementSaasMethode.ORANGE_MONEY) {
      return this.initierOrangeMoney(paiement);
    }

    // Manuel : pas d'URL, attente validation SUPERADMIN
    return {
      reference,
      message: 'Paiement manuel enregistré. En attente de validation par IBIG SOFT.',
    };
  }

  private async initierCinetPay(paiement: PaiementSaas): Promise<{ paymentUrl: string; reference: string; message: string }> {
    const apiKey = this.config.get<string>('CINETPAY_API_KEY');
    const siteId = this.config.get<string>('CINETPAY_SITE_ID');
    const notifyUrl = this.config.get<string>('APP_URL') + '/api/v1/paiements-saas/webhook/cinetpay';
    const returnUrl = this.config.get<string>('FRONTEND_URL') + '/paiement/retour';

    try {
      const { data } = await firstValueFrom(
        this.http.post('https://api-checkout.cinetpay.com/v2/payment', {
          apikey: apiKey,
          site_id: siteId,
          transaction_id: paiement.reference,
          amount: paiement.montant,
          currency: 'XOF',
          description: `Abonnement SANTAREX ERP`,
          notify_url: notifyUrl,
          return_url: returnUrl,
          customer_name: paiement.nomPayeur,
          customer_email: paiement.emailPayeur,
          customer_phone_number: paiement.telephone ?? '',
          lang: 'fr',
          channels: 'ALL',
        }),
      );

      if (data?.code === '201') {
        const paymentUrl = data.data?.payment_url;
        await this.paiementRepo.update(paiement.id, { paymentUrl, transactionId: data.data?.payment_token });
        return { paymentUrl, reference: paiement.reference, message: 'Redirection vers CinetPay' };
      }

      this.logger.error('CinetPay init error', data);
      throw new BadRequestException('Erreur initialisation CinetPay');
    } catch (err) {
      await this.paiementRepo.update(paiement.id, { statut: PaiementSaasStatut.ECHEC });
      throw new BadRequestException('Service de paiement indisponible');
    }
  }

  private async initierOrangeMoney(paiement: PaiementSaas): Promise<{ reference: string; message: string }> {
    const merchantKey = this.config.get<string>('ORANGE_MONEY_MERCHANT_KEY');
    const notifyUrl = this.config.get<string>('APP_URL') + '/api/v1/paiements-saas/webhook/orangemoney';

    try {
      const { data } = await firstValueFrom(
        this.http.post('https://api.orange.com/orange-money-webpay/ci/v1/webpayment', {
          merchant_key: merchantKey,
          currency: 'OUV',
          order_id: paiement.reference,
          amount: paiement.montant,
          return_url: this.config.get<string>('FRONTEND_URL') + '/paiement/retour',
          cancel_url: this.config.get<string>('FRONTEND_URL') + '/paiement/annule',
          notif_url: notifyUrl,
          lang: 'fr',
        }),
      );

      if (data?.payment_url) {
        await this.paiementRepo.update(paiement.id, { paymentUrl: data.payment_url, operateur: 'Orange Money CI' });
        return { reference: paiement.reference, message: 'Redirection vers Orange Money' };
      }

      throw new BadRequestException('Erreur initialisation Orange Money');
    } catch {
      await this.paiementRepo.update(paiement.id, { statut: PaiementSaasStatut.ECHEC });
      throw new BadRequestException('Service Orange Money indisponible');
    }
  }

  async webhookCinetPay(payload: Record<string, unknown>): Promise<{ status: string }> {
    const transactionId = payload['cpm_trans_id'] as string;
    const statut = payload['cpm_result'] as string;

    if (!transactionId) return { status: 'ignored' };

    const paiement = await this.paiementRepo.findOne({ where: { reference: transactionId } });
    if (!paiement) return { status: 'not_found' };

    if (statut === '00') {
      await this.paiementRepo.update(paiement.id, {
        statut: PaiementSaasStatut.SUCCES,
        webhookPayload: payload,
      });
      await this.activerLicence(paiement);
    } else {
      await this.paiementRepo.update(paiement.id, {
        statut: PaiementSaasStatut.ECHEC,
        webhookPayload: payload,
      });
    }

    return { status: 'processed' };
  }

  async webhookOrangeMoney(payload: Record<string, unknown>): Promise<{ status: string }> {
    const orderId = payload['order_id'] as string;
    const status = payload['status'] as string;

    if (!orderId) return { status: 'ignored' };

    const paiement = await this.paiementRepo.findOne({ where: { reference: orderId } });
    if (!paiement) return { status: 'not_found' };

    if (status === 'SUCCESS') {
      await this.paiementRepo.update(paiement.id, { statut: PaiementSaasStatut.SUCCES, webhookPayload: payload });
      await this.activerLicence(paiement);
    } else {
      await this.paiementRepo.update(paiement.id, { statut: PaiementSaasStatut.ECHEC, webhookPayload: payload });
    }

    return { status: 'processed' };
  }

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
      action: 'PAIEMENT_SAAS_VALIDE',
      entite: 'PaiementSaas',
      entiteId: paiement.id,
      userId: adminId,
      details: { montant: paiement.montant, reference: paiement.reference },
    });

    return this.paiementRepo.findOne({ where: { id: paiement.id } });
  }

  private async activerLicence(paiement: PaiementSaas): Promise<void> {
    try {
      await this.licencesService.renouveler(paiement.licenceId, 12);
    } catch (err) {
      this.logger.error(`Failed to activate licence ${paiement.licenceId}`, err);
    }
  }

  async findAll(tenantId?: string): Promise<PaiementSaas[]> {
    const where = tenantId ? { tenantId } : {};
    return this.paiementRepo.find({ where, order: { createdAt: 'DESC' }, take: 100 });
  }

  async findOne(id: string): Promise<PaiementSaas> {
    const p = await this.paiementRepo.findOne({ where: { id } });
    if (!p) throw new NotFoundException('Paiement introuvable');
    return p;
  }
}
