import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Notification, NotificationCategorie, NotificationType } from './entities/notification.entity';

export interface CreateNotifOptions {
  tenantId: string;
  userId?: string;
  type?: NotificationType;
  categorie?: NotificationCategorie;
  titre: string;
  message: string;
  lienHref?: string;
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repo: Repository<Notification>,
  ) {}

  async creer(opts: CreateNotifOptions): Promise<Notification> {
    const notif = this.repo.create({
      tenantId: opts.tenantId,
      userId: opts.userId,
      type: opts.type ?? NotificationType.INFO,
      categorie: opts.categorie ?? NotificationCategorie.SYSTEME,
      titre: opts.titre,
      message: opts.message,
      lienHref: opts.lienHref,
    });
    return this.repo.save(notif);
  }

  async findForUser(tenantId: string, userId: string, seulementNonLues = false): Promise<Notification[]> {
    const qb = this.repo
      .createQueryBuilder('n')
      .where('n.tenantId = :tenantId', { tenantId })
      .andWhere('(n.userId = :userId OR n.userId IS NULL)', { userId })
      .orderBy('n.createdAt', 'DESC')
      .take(50);

    if (seulementNonLues) qb.andWhere('n.lu = false');
    return qb.getMany();
  }

  async countNonLues(tenantId: string, userId: string): Promise<number> {
    return this.repo.count({
      where: [
        { tenantId, userId, lu: false },
        { tenantId, userId: null, lu: false },
      ],
    });
  }

  async marquerLue(id: string, tenantId: string): Promise<void> {
    await this.repo.update({ id, tenantId }, { lu: true, luAt: new Date() });
  }

  async marquerToutesLues(tenantId: string, userId: string): Promise<void> {
    await this.repo
      .createQueryBuilder()
      .update()
      .set({ lu: true, luAt: new Date() })
      .where('tenantId = :tenantId', { tenantId })
      .andWhere('(userId = :userId OR userId IS NULL)', { userId })
      .andWhere('lu = false')
      .execute();
  }

  // ─── Écouteurs d'événements métier ──────────────────────────────────────

  @OnEvent('stock.alerte')
  async onStockAlerte(payload: { tenantId: string; nomMedicament: string; stockActuel: number }) {
    await this.creer({
      tenantId: payload.tenantId,
      type: NotificationType.ALERTE,
      categorie: NotificationCategorie.STOCK,
      titre: 'Stock faible',
      message: `${payload.nomMedicament} — stock : ${payload.stockActuel} unités restantes.`,
      lienHref: '/pharmacie',
    });
  }

  @OnEvent('rdv.rappel')
  async onRdvRappel(payload: { tenantId: string; userId: string; patientNom: string; heure: string }) {
    await this.creer({
      tenantId: payload.tenantId,
      userId: payload.userId,
      type: NotificationType.INFO,
      categorie: NotificationCategorie.RDV,
      titre: 'Rappel rendez-vous',
      message: `RDV avec ${payload.patientNom} à ${payload.heure}.`,
      lienHref: '/rendez-vous',
    });
  }

  @OnEvent('facture.impayee')
  async onFactureImpayee(payload: { tenantId: string; numero: string; montant: number }) {
    await this.creer({
      tenantId: payload.tenantId,
      type: NotificationType.ALERTE,
      categorie: NotificationCategorie.FACTURE,
      titre: 'Facture impayée',
      message: `Facture ${payload.numero} — ${payload.montant.toLocaleString('fr-FR')} FCFA en attente.`,
      lienHref: '/facturation',
    });
  }

  @OnEvent('paiement.saas.confirme')
  async onPaiementSaasConfirme(payload: { tenantId: string; reference: string; montant: number }) {
    await this.creer({
      tenantId: payload.tenantId,
      type: NotificationType.SUCCES,
      categorie: NotificationCategorie.PAIEMENT,
      titre: 'Abonnement activé',
      message: `Paiement ${payload.reference} de ${payload.montant.toLocaleString('fr-FR')} FCFA confirmé. Votre licence est active.`,
    });
  }
}
