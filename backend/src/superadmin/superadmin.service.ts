import { Injectable } from '@nestjs/common';
import { TenantsService } from '../tenants/tenants.service';
import { LicencesService } from '../licences/licences.service';
import { OffresSaasService } from '../offres-saas/offres-saas.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { AuditAction } from '../audit-logs/entities/audit-log.entity';

@Injectable()
export class SuperadminService {
  constructor(
    private readonly tenantsService: TenantsService,
    private readonly licencesService: LicencesService,
    private readonly offresSaasService: OffresSaasService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async getDashboard() {
    const [tenantStats, licenceStats, offres, recentAudit] = await Promise.all([
      this.tenantsService.stats(),
      this.licencesService.stats(),
      this.offresSaasService.findAll(false),
      this.auditLogsService.findAll({ page: 1, limit: 10 }),
    ]);

    const alertes: { niveau: 'danger' | 'warning' | 'info'; message: string }[] = [];

    if (tenantStats.suspendus > 0) {
      alertes.push({ niveau: 'warning', message: `${tenantStats.suspendus} tenant(s) suspendu(s)` });
    }
    if (licenceStats.suspendues > 0) {
      alertes.push({ niveau: 'danger', message: `${licenceStats.suspendues} licence(s) suspendue(s)` });
    }
    if (licenceStats.essai > 0) {
      alertes.push({ niveau: 'info', message: `${licenceStats.essai} établissement(s) en période d'essai` });
    }

    return {
      tenants: tenantStats,
      licences: licenceStats,
      offres: offres.map((o) => ({
        id: o.id,
        code: o.code,
        nom: o.nom,
        prix: o.prix,
        cycle: o.cycle,
        estMisEnAvant: o.estMisEnAvant,
      })),
      alertes,
      activiteRecente: recentAudit.data.slice(0, 8).map((log) => ({
        id: log.id,
        action: log.action,
        ressource: log.ressource,
        userEmail: log.userEmail,
        tenantId: log.tenantId,
        createdAt: log.createdAt,
      })),
    };
  }
}
