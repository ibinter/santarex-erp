// ════════════════════════════════════════════════════════════════════════════
//  SANTAREX — Rapport KPI mensuel automatisé.
//
//  @Cron mensuel (1er du mois, 06h) : pour chaque tenant actif, calcule des
//  indicateurs simples du mois écoulé (patients, factures, chiffre d'affaires,
//  taux de recouvrement) et les envoie par email aux administrateurs du tenant.
//
//  Câble le template orphelin `rapport-mensuel.hbs` via
//  `mailService.envoyerRapportMensuel`. Best-effort et défensif : jamais
//  d'exception propagée ; un échec d'envoi n'interrompt pas la boucle.
//
//  Enregistré comme provider dans `crm.module.ts`.
// ════════════════════════════════════════════════════════════════════════════

import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { Tenant, TenantStatut } from '../tenants/entities/tenant.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Patient } from '../patients/entities/patient.entity';
import { Facture, StatutFacture } from '../facturation/entities/facture.entity';
import { MailService } from '../mail/mail.service';

const MOIS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

@Injectable()
export class RapportMensuelScheduler {
  private readonly logger = new Logger(RapportMensuelScheduler.name);

  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(Facture)
    private readonly factureRepo: Repository<Facture>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  private frontUrl(): string {
    return this.config
      .get<string>('FRONTEND_URL', 'https://santarex.ibigsoft.com')
      .replace(/\/$/, '');
  }

  /** Bornes [début, fin[ d'un mois calendaire décalé de `offset` mois par rapport à maintenant. */
  private borneMois(offset: number): { debut: Date; fin: Date } {
    const now = new Date();
    const debut = new Date(now.getFullYear(), now.getMonth() + offset, 1, 0, 0, 0, 0);
    const fin = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1, 0, 0, 0, 0);
    return { debut, fin };
  }

  private async caEtRecouvrement(
    tenantId: string,
    debut: Date,
    fin: Date,
  ): Promise<{ ca: number; taux: number; factures: number }> {
    const row = await this.factureRepo
      .createQueryBuilder('f')
      .select('COALESCE(SUM(f.montantTTC), 0)', 'ttc')
      .addSelect('COALESCE(SUM(f.montantPaye), 0)', 'paye')
      .addSelect('COUNT(*)', 'nb')
      .where('f.tenantId = :tenantId', { tenantId })
      .andWhere('f.dateEmission >= :debut AND f.dateEmission < :fin', { debut, fin })
      .andWhere('f.statut != :annulee', { annulee: StatutFacture.ANNULEE })
      .getRawOne<{ ttc: string; paye: string; nb: string }>();

    const ttc = Number(row?.ttc ?? 0);
    const paye = Number(row?.paye ?? 0);
    const factures = Number(row?.nb ?? 0);
    const taux = ttc > 0 ? Math.round((paye / ttc) * 100) : 0;
    return { ca: ttc, taux, factures };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  Rapport mensuel — le 1er de chaque mois à 06h.
  // ══════════════════════════════════════════════════════════════════════════
  @Cron(CronExpression.EVERY_1ST_DAY_OF_MONTH_AT_MIDNIGHT, {
    name: 'crm-rapport-mensuel',
  })
  async envoyerRapportsMensuels(): Promise<void> {
    try {
      // Mois écoulé (M-1) et mois précédent (M-2) pour la comparaison.
      const moisEcoule = this.borneMois(-1);
      const moisAvant = this.borneMois(-2);
      const moisLabel = MOIS_FR[moisEcoule.debut.getMonth()];
      const anneeLabel = String(moisEcoule.debut.getFullYear());
      const urlDashboard = `${this.frontUrl()}/dashboard`;

      const tenants = await this.tenantRepo.find({
        where: { statut: In([TenantStatut.ACTIF, TenantStatut.ESSAI]) },
      });

      let envoyes = 0;
      for (const tenant of tenants) {
        try {
          const admins = await this.userRepo.find({
            where: {
              tenantId: tenant.slug,
              role: In([UserRole.ADMIN, UserRole.DIRECTEUR]),
              isActive: true,
            },
          });
          if (admins.length === 0) continue;

          const [
            patientsTotal,
            patientsPrecedent,
            courant,
            precedent,
          ] = await Promise.all([
            this.patientRepo.count({
              where: { tenantId: tenant.slug, createdAt: Between(moisEcoule.debut, moisEcoule.fin) },
            }),
            this.patientRepo.count({
              where: { tenantId: tenant.slug, createdAt: Between(moisAvant.debut, moisAvant.fin) },
            }),
            this.caEtRecouvrement(tenant.slug, moisEcoule.debut, moisEcoule.fin),
            this.caEtRecouvrement(tenant.slug, moisAvant.debut, moisAvant.fin),
          ]);

          for (const admin of admins) {
            await this.mailService.envoyerRapportMensuel({
              to: admin.email,
              prenom: admin.firstName,
              nomEtablissement: tenant.nom,
              mois: moisLabel,
              annee: anneeLabel,
              patientsTotal,
              patientsPrecedent,
              // Consultations / hospitalisations : non agrégées dans ce périmètre.
              consultationsTotal: 0,
              consultationsPrecedent: 0,
              hospitalisationsTotal: 0,
              hospitalisationsPrecedent: 0,
              chiffreAffaires: courant.ca.toLocaleString('fr-FR'),
              chiffreAffairesPrecedent: precedent.ca.toLocaleString('fr-FR'),
              facturesTotal: courant.factures,
              facturesPrecedent: precedent.factures,
              tauxRecouvrement: courant.taux,
              tauxRecouvrementPrecedent: precedent.taux,
              urlDashboard,
            });
            envoyes++;
          }
        } catch (e) {
          this.logger.error(
            `Échec rapport mensuel tenant ${tenant.slug}: ${(e as Error).message}`,
          );
        }
      }

      if (envoyes) this.logger.log(`Rapports mensuels envoyés : ${envoyes}`);
    } catch (e) {
      this.logger.error(
        `Job crm-rapport-mensuel échoué: ${(e as Error).message}`,
      );
    }
  }
}
