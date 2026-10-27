import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { In, Repository } from 'typeorm';
import { Licence, LicenceStatut } from '../licences/entities/licence.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { MailService } from './mail.service';

export interface DestinataireAnnonce {
  tenant: string;
  email: string;
  prenom: string;
}

/** Plafond de sécurité : une annonce ne part jamais vers plus de destinataires que cela. */
const MAX_DESTINATAIRES = 300;
const PAUSE_ENTRE_ENVOIS_MS = 400;

/**
 * Annonces de nouveautés envoyées par e-mail aux administrateurs des établissements abonnés
 * (licence active, en essai ou en période de grâce). Gratuit : utilise le SMTP existant.
 * Les comptes de démonstration (`demo-*`) sont toujours exclus.
 */
@Injectable()
export class AnnoncesService {
  private readonly logger = new Logger(AnnoncesService.name);

  constructor(
    @InjectRepository(Licence) private readonly licenceRepo: Repository<Licence>,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  private urlApp(): string {
    return this.config.get<string>('FRONTEND_URL', 'https://santarex.ibigsoft.com').replace(/\/$/, '') + '/login';
  }

  async destinataires(): Promise<DestinataireAnnonce[]> {
    const licences = await this.licenceRepo.find({
      where: { statut: In([LicenceStatut.ACTIVE, LicenceStatut.ESSAI, LicenceStatut.GRACE]) },
    });
    const tenants = [...new Set(licences.map((l) => l.tenantSlug))].filter((s) => s && !s.startsWith('demo-'));
    if (!tenants.length) return [];
    const admins = await this.userRepo.find({
      where: { tenantId: In(tenants), role: UserRole.ADMIN, isActive: true },
    });
    const vus = new Set<string>();
    const resultat: DestinataireAnnonce[] = [];
    for (const u of admins) {
      const email = String(u.email ?? '').trim().toLowerCase();
      if (!email || vus.has(email)) continue;
      vus.add(email);
      resultat.push({ tenant: u.tenantId, email, prenom: u.firstName || 'Madame, Monsieur' });
    }
    return resultat;
  }

  async envoyerTest(sujet: string, message: string, a: string): Promise<{ envoye: boolean }> {
    const envoye = await this.mail.envoyerAnnonce({
      to: a.trim(), prenom: 'Prénom', sujet: `[TEST] ${sujet}`, message, urlApp: this.urlApp(),
    });
    return { envoye };
  }

  async envoyerATous(sujet: string, message: string) {
    const cibles = await this.destinataires();
    if (cibles.length === 0) throw new BadRequestException('Aucun destinataire : aucun établissement abonné trouvé');
    if (cibles.length > MAX_DESTINATAIRES) {
      throw new BadRequestException(`Plus de ${MAX_DESTINATAIRES} destinataires : envoi refusé par sécurité`);
    }
    let envoyes = 0;
    const echecs: string[] = [];
    for (const c of cibles) {
      const ok = await this.mail.envoyerAnnonce({ to: c.email, prenom: c.prenom, sujet, message, urlApp: this.urlApp() });
      if (ok) envoyes += 1;
      else echecs.push(c.email);
      await new Promise((r) => setTimeout(r, PAUSE_ENTRE_ENVOIS_MS));
    }
    this.logger.log(`Annonce « ${sujet} » : ${envoyes}/${cibles.length} envoyée(s), ${echecs.length} échec(s).`);
    return { cibles: cibles.length, envoyes, echecs };
  }
}
