import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { Prospect } from './entities/prospect.entity';
import { DemandeDemo } from './entities/demande-demo.entity';
import {
  ProspectStatut, ProspectOrigine, DemandeDemoStatut, ModeDemo,
  PROSPECT_STATUT_ORDRE,
} from './crm.enums';
import { CreateProspectDto } from './dto/create-prospect.dto';
import { UpdateProspectDto } from './dto/update-prospect.dto';
import {
  DemandeDemoPubliqueDto, CreateDemandeDemoDto, UpdateDemandeDemoDto,
} from './dto/demande-demo.dto';

@Injectable()
export class CrmService {
  private readonly logger = new Logger(CrmService.name);

  constructor(
    @InjectRepository(Prospect)
    private readonly prospectRepo: Repository<Prospect>,
    @InjectRepository(DemandeDemo)
    private readonly demandeRepo: Repository<DemandeDemo>,
    private readonly mailService: MailService,
    private readonly config: ConfigService,
  ) {}

  /** Boîte de l'équipe commerciale interne (SALES_EMAIL, fallback SMTP_FROM). */
  private get salesEmail(): string {
    return this.config.get<string>(
      'SALES_EMAIL',
      this.config.get<string>('SMTP_FROM', 'contact@ibigsoft.com'),
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  PROSPECTS (superadmin)
  // ══════════════════════════════════════════════════════════════════════════

  async listerProspects(filtres?: {
    statut?: ProspectStatut; origine?: ProspectOrigine; q?: string;
  }): Promise<Prospect[]> {
    const qb = this.prospectRepo.createQueryBuilder('p').orderBy('p.createdAt', 'DESC');

    if (filtres?.statut) qb.andWhere('p.statut = :statut', { statut: filtres.statut });
    if (filtres?.origine) qb.andWhere('p.origine = :origine', { origine: filtres.origine });
    if (filtres?.q) {
      qb.andWhere(
        '(LOWER(p.nom) LIKE :q OR LOWER(p.email) LIKE :q OR LOWER(COALESCE(p.entreprise, \'\')) LIKE :q)',
        { q: `%${filtres.q.toLowerCase()}%` },
      );
    }
    return qb.getMany();
  }

  async getProspect(id: string): Promise<Prospect> {
    const prospect = await this.prospectRepo.findOne({ where: { id } });
    if (!prospect) throw new NotFoundException('Prospect introuvable');
    return prospect;
  }

  async creerProspect(dto: CreateProspectDto): Promise<Prospect> {
    const prospect = this.prospectRepo.create({
      ...dto,
      origine: dto.origine ?? ProspectOrigine.MANUEL,
      statut: dto.statut ?? ProspectStatut.NOUVEAU,
      dateRelance: dto.dateRelance ? new Date(dto.dateRelance) : null,
    });
    return this.prospectRepo.save(prospect);
  }

  async majProspect(id: string, dto: UpdateProspectDto): Promise<Prospect> {
    const prospect = await this.getProspect(id);
    Object.assign(prospect, {
      ...dto,
      dateRelance: dto.dateRelance ? new Date(dto.dateRelance) : prospect.dateRelance,
    });
    return this.prospectRepo.save(prospect);
  }

  async changerStatut(id: string, statut: ProspectStatut): Promise<Prospect> {
    const prospect = await this.getProspect(id);
    prospect.statut = statut;
    return this.prospectRepo.save(prospect);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  DEMANDES DE DÉMO (superadmin)
  // ══════════════════════════════════════════════════════════════════════════

  async listerDemandes(statut?: DemandeDemoStatut): Promise<DemandeDemo[]> {
    const where = statut ? { statut } : {};
    return this.demandeRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  async creerDemande(dto: CreateDemandeDemoDto): Promise<DemandeDemo> {
    // Vérifie l'existence du prospect rattaché.
    await this.getProspect(dto.prospectId);
    const demande = this.demandeRepo.create({
      prospectId: dto.prospectId,
      dateSouhaitee: dto.dateSouhaitee ? new Date(dto.dateSouhaitee) : null,
      modeDemo: dto.modeDemo ?? ModeDemo.VISIO,
      statut: DemandeDemoStatut.DEMANDEE,
      agentAssigne: dto.agentAssigne ?? null,
      lienVisio: dto.lienVisio ?? null,
    });
    return this.demandeRepo.save(demande);
  }

  async majDemande(id: string, dto: UpdateDemandeDemoDto): Promise<DemandeDemo> {
    const demande = await this.demandeRepo.findOne({ where: { id } });
    if (!demande) throw new NotFoundException('Demande de démo introuvable');
    Object.assign(demande, {
      ...dto,
      dateSouhaitee: dto.dateSouhaitee ? new Date(dto.dateSouhaitee) : demande.dateSouhaitee,
    });
    return this.demandeRepo.save(demande);
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  STATS — funnel du pipeline
  // ══════════════════════════════════════════════════════════════════════════

  async getStats(): Promise<{
    funnel: Array<{ statut: ProspectStatut; count: number }>;
    totalProspects: number;
    demosAPlanifier: number;
    demosPlanifiees: number;
    tauxConversion: number;
  }> {
    const rows = await this.prospectRepo
      .createQueryBuilder('p')
      .select('p.statut', 'statut')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.statut')
      .getRawMany();

    const counts = new Map<string, number>(
      rows.map((r: { statut: string; count: string }) => [r.statut, Number(r.count)]),
    );

    const funnel = PROSPECT_STATUT_ORDRE.map((statut) => ({
      statut,
      count: counts.get(statut) ?? 0,
    }));

    const totalProspects = Array.from(counts.values()).reduce((a, b) => a + b, 0);
    const gagnes = counts.get(ProspectStatut.GAGNE) ?? 0;

    const [demosAPlanifier, demosPlanifiees] = await Promise.all([
      this.demandeRepo.count({ where: { statut: DemandeDemoStatut.DEMANDEE } }),
      this.demandeRepo.count({ where: { statut: DemandeDemoStatut.PLANIFIEE } }),
    ]);

    return {
      funnel,
      totalProspects,
      demosAPlanifier,
      demosPlanifiees,
      tauxConversion: totalProspects ? Math.round((gagnes / totalProspects) * 100) : 0,
    };
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ROUTE PUBLIQUE — formulaire de démo de la landing
  // ══════════════════════════════════════════════════════════════════════════

  /**
   * Point d'entrée public du formulaire landing. Crée un Prospect
   * (origine=landing, statut=nouveau) + une DemandeDemo, puis envoie l'email de
   * confirmation et notifie l'équipe. Anti-spam basique : email + consentement
   * requis. Un envoi d'email en échec ne bloque JAMAIS la capture du lead.
   */
  async traiterDemandePublique(dto: DemandeDemoPubliqueDto): Promise<{ prospectId: string; demandeId: string }> {
    if (!dto.email) {
      throw new BadRequestException('Email requis.');
    }
    if (dto.consentement !== true) {
      throw new BadRequestException('Le consentement est requis pour être recontacté.');
    }

    // Dédoublonnage léger : réutilise un prospect landing existant du même email.
    let prospect = await this.prospectRepo.findOne({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!prospect) {
      prospect = this.prospectRepo.create({
        nom: dto.nom,
        prenom: dto.prenom ?? null,
        entreprise: dto.entreprise ?? null,
        fonction: dto.fonction ?? null,
        email: dto.email.toLowerCase().trim(),
        telephone: dto.telephone ?? null,
        whatsapp: dto.whatsapp ?? null,
        pays: dto.pays ?? null,
        secteur: dto.secteur ?? null,
        taille: dto.taille ?? null,
        logiciel: dto.logiciel ?? null,
        besoin: dto.besoin ?? null,
        origine: ProspectOrigine.LANDING,
        statut: ProspectStatut.NOUVEAU,
        consentement: true,
      });
      prospect = await this.prospectRepo.save(prospect);
    } else {
      // Nouvelle demande sur un prospect connu → repositionne en tête de pipeline.
      prospect.consentement = true;
      if (dto.besoin) prospect.besoin = dto.besoin;
      if (dto.logiciel) prospect.logiciel = dto.logiciel;
      prospect = await this.prospectRepo.save(prospect);
    }

    const demande = await this.demandeRepo.save(
      this.demandeRepo.create({
        prospectId: prospect.id,
        dateSouhaitee: dto.dateSouhaitee ? new Date(dto.dateSouhaitee) : null,
        modeDemo: dto.modeDemo ?? ModeDemo.VISIO,
        statut: DemandeDemoStatut.DEMANDEE,
      }),
    );

    // Email de confirmation au prospect (méthode fournie par l'agent Emails).
    try {
      await this.mailService.envoyerDemoRecue({
        to: prospect.email,
        prenom: prospect.prenom ?? prospect.nom,
        logiciel: prospect.logiciel ?? 'SANTAREX ERP',
      });
    } catch (err) {
      this.logger.error(`Échec envoi email de confirmation démo → ${prospect.email}: ${(err as Error).message}`);
    }

    // Notification interne réelle de l'équipe commerciale (best-effort).
    try {
      await this.mailService.envoyerNouvelleDemandeInterne({
        to: this.salesEmail,
        titre: `Nouvelle demande de démo — ${prospect.nom}`,
        typeDemande: 'Demande de démonstration',
        reference: demande.id,
        contactNom: `${prospect.prenom ?? ''} ${prospect.nom}`.trim(),
        contactEmail: prospect.email,
        telephone: prospect.telephone ?? prospect.whatsapp ?? '—',
        entreprise: prospect.entreprise ?? '—',
        pays: prospect.pays ?? '—',
        message: prospect.besoin ?? `Logiciel visé : ${prospect.logiciel ?? 'SANTAREX ERP'}`,
      });
    } catch (err) {
      this.logger.error(
        `Échec notification interne demande démo ${demande.id}: ${(err as Error).message}`,
      );
    }

    return { prospectId: prospect.id, demandeId: demande.id };
  }
}
