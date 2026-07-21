import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import * as PdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import {
  OffreCommerciale,
  OffreCommercialeStatut,
} from './entities/offre-commerciale.entity';
import { CreateOffreCommercialeDto } from './dto/create-offre-commerciale.dto';
import { UpdateOffreCommercialeDto } from './dto/update-offre-commerciale.dto';
import { MailService } from '../mail/mail.service';

// Fix pdfmake fonts (même correctif que exports.service.ts)
(PdfMake as any).vfs = (pdfFonts as any).pdfMake?.vfs ?? (pdfFonts as any).vfs;

@Injectable()
export class OffresCommercialesService {
  private readonly logger = new Logger(OffresCommercialesService.name);
  private readonly brandBlue = '#0D47A1';
  private readonly brandTeal = '#00838F';

  constructor(
    @InjectRepository(OffreCommerciale)
    private readonly repo: Repository<OffreCommerciale>,
    private readonly mail: MailService,
    private readonly config: ConfigService,
  ) {}

  // ─── Helpers ───────────────────────────────────────────────────────────────

  /** Calcule prixTTC = (prixHT − remise) + taxes (borné à ≥ 0). */
  private calculerTTC(prixHT: number, remise: number, taxes: number): number {
    return Math.max(0, (prixHT ?? 0) - (remise ?? 0)) + (taxes ?? 0);
  }

  /** Génère un numéro lisible DEV-AAAA-NNNN, séquentiel par année civile. */
  private async genererNumero(): Promise<string> {
    const annee = new Date().getFullYear();
    const prefixe = `DEV-${annee}-`;
    const dernier = await this.repo
      .createQueryBuilder('o')
      .where('o.numero LIKE :p', { p: `${prefixe}%` })
      .orderBy('o.numero', 'DESC')
      .getOne();
    let seq = 1;
    if (dernier) {
      const n = parseInt(dernier.numero.split('-')[2] ?? '0', 10);
      if (!Number.isNaN(n)) seq = n + 1;
    }
    return `${prefixe}${String(seq).padStart(4, '0')}`;
  }

  private genererToken(): string {
    return randomBytes(24).toString('hex');
  }

  // ─── CRUD ────────────────────────────────────────────────────────────────

  async create(
    dto: CreateOffreCommercialeDto,
    userId?: string,
  ): Promise<OffreCommerciale> {
    const remise = dto.remise ?? 0;
    const taxes = dto.taxes ?? 0;
    const prixTTC = this.calculerTTC(dto.prixHT, remise, taxes);

    const offre = this.repo.create({
      numero: await this.genererNumero(),
      prospectId: dto.prospectId,
      clientNom: dto.clientNom,
      clientEmail: dto.clientEmail,
      logiciel: dto.logiciel ?? 'SANTAREX ERP',
      formule: dto.formule,
      modules: dto.modules ?? [],
      nbUtilisateurs: dto.nbUtilisateurs ?? 1,
      nbSites: dto.nbSites ?? 1,
      duree: dto.duree,
      devise: dto.devise ?? 'XOF',
      prixHT: dto.prixHT,
      remise,
      taxes,
      prixTTC,
      options: dto.options ?? [],
      formation: dto.formation,
      migration: dto.migration,
      accompagnement: dto.accompagnement,
      echeancier: dto.echeancier ?? [],
      dateValidite: dto.dateValidite ? new Date(dto.dateValidite) : undefined,
      conditions: dto.conditions,
      notes: dto.notes,
      statut: OffreCommercialeStatut.BROUILLON,
      tokenAcceptation: this.genererToken(),
      createdById: userId,
    });

    return this.repo.save(offre);
  }

  async findAll(): Promise<OffreCommerciale[]> {
    return this.repo.find({ order: { createdAt: 'DESC' }, take: 200 });
  }

  async findOne(id: string): Promise<OffreCommerciale> {
    const offre = await this.repo.findOne({ where: { id } });
    if (!offre) throw new NotFoundException('Offre commerciale introuvable');
    return offre;
  }

  async update(
    id: string,
    dto: UpdateOffreCommercialeDto,
  ): Promise<OffreCommerciale> {
    const offre = await this.findOne(id);
    if (offre.statut === OffreCommercialeStatut.ACCEPTEE) {
      throw new BadRequestException(
        'Une offre acceptée ne peut plus être modifiée',
      );
    }

    Object.assign(offre, {
      ...dto,
      dateValidite: dto.dateValidite
        ? new Date(dto.dateValidite)
        : offre.dateValidite,
    });

    // Recalcul systématique des totaux.
    offre.prixTTC = this.calculerTTC(offre.prixHT, offre.remise, offre.taxes);

    return this.repo.save(offre);
  }

  // ─── Envoi (email + passage en statut ENVOYEE) ─────────────────────────────

  async envoyer(id: string): Promise<OffreCommerciale> {
    const offre = await this.findOne(id);
    if (offre.statut === OffreCommercialeStatut.ACCEPTEE) {
      throw new BadRequestException('Cette offre a déjà été acceptée');
    }

    const url = this.urlPublique(offre.tokenAcceptation);

    // Méthode fournie par le module Emails (MailService). Appel tolérant : le
    // service Mail avale déjà ses propres erreurs (best-effort).
    await (this.mail as any).envoyerOffreEnvoyee?.({
      to: offre.clientEmail,
      clientNom: offre.clientNom,
      numero: offre.numero,
      url,
    });

    offre.statut = OffreCommercialeStatut.ENVOYEE;
    return this.repo.save(offre);
  }

  // ─── Génération PDF (pdfmake) ──────────────────────────────────────────────

  async genererPdf(id: string): Promise<{ buffer: Buffer; numero: string }> {
    const offre = await this.findOne(id);
    const buffer = await this.construirePdf(offre);
    return { buffer, numero: offre.numero };
  }

  private fmt(montant: number, devise: string): string {
    return `${(montant ?? 0).toLocaleString('fr-FR')} ${devise}`;
  }

  private construirePdf(offre: OffreCommerciale): Promise<Buffer> {
    const devise = offre.devise ?? 'XOF';

    const modulesRows = (offre.modules ?? []).map((m) => [
      { text: m, fontSize: 9 },
    ]);

    const optionsRows = (offre.options ?? []).map((o) => [
      { text: o.libelle ?? '', fontSize: 9 },
      { text: this.fmt(o.prix ?? 0, devise), alignment: 'right', fontSize: 9 },
    ]);

    const echeancesRows = (offre.echeancier ?? []).map((e) => [
      { text: e.libelle ?? '', fontSize: 9 },
      { text: e.echeance ?? '—', alignment: 'center', fontSize: 9 },
      { text: this.fmt(e.montant ?? 0, devise), alignment: 'right', fontSize: 9 },
    ]);

    const headerStyle = {
      fontSize: 10,
      bold: true,
      color: '#FFFFFF',
      fillColor: this.brandBlue,
    };

    const content: any[] = [
      {
        columns: [
          {
            stack: [
              {
                text: `DEVIS N° ${offre.numero}`,
                fontSize: 18,
                bold: true,
                color: this.brandBlue,
              },
              {
                text: `Établi le ${new Date(offre.createdAt).toLocaleDateString('fr-FR')}`,
                fontSize: 9,
                color: '#666666',
                margin: [0, 2, 0, 0],
              },
              offre.dateValidite
                ? {
                    text: `Valable jusqu'au ${new Date(offre.dateValidite).toLocaleDateString('fr-FR')}`,
                    fontSize: 9,
                    color: '#666666',
                  }
                : null,
            ].filter(Boolean),
          },
          {
            stack: [
              { text: 'CLIENT', fontSize: 8, bold: true, color: '#999999' },
              { text: offre.clientNom, bold: true, margin: [0, 2, 0, 0] },
              { text: offre.clientEmail, fontSize: 9, color: '#666666' },
            ],
            alignment: 'right',
          },
        ],
        margin: [0, 0, 0, 20],
      },
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: `${offre.logiciel}${offre.formule ? ` — Formule ${offre.formule}` : ''}`,
                fontSize: 12,
                bold: true,
                color: '#FFFFFF',
                fillColor: this.brandTeal,
                margin: [10, 8, 10, 8],
              },
            ],
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 14],
      },
      {
        columns: [
          {
            text: `Utilisateurs : ${offre.nbUtilisateurs}`,
            fontSize: 9,
            color: '#555555',
          },
          {
            text: `Sites : ${offre.nbSites}`,
            fontSize: 9,
            color: '#555555',
          },
          {
            text: `Durée : ${offre.duree ?? '—'}`,
            fontSize: 9,
            color: '#555555',
          },
        ],
        margin: [0, 0, 0, 16],
      },
    ];

    if (modulesRows.length) {
      content.push(
        {
          text: 'Modules inclus',
          fontSize: 11,
          bold: true,
          color: this.brandBlue,
          margin: [0, 0, 0, 6],
        },
        {
          table: { headerRows: 0, widths: ['*'], body: modulesRows },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#E5E7EB',
            fillColor: (rowIndex: number) =>
              rowIndex % 2 === 0 ? '#F9FAFB' : null,
          },
          margin: [0, 0, 0, 16],
        },
      );
    }

    if (optionsRows.length) {
      content.push(
        {
          text: 'Options',
          fontSize: 11,
          bold: true,
          color: this.brandBlue,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto'],
            body: [
              [
                { text: 'Libellé', ...headerStyle },
                { text: 'Montant', ...headerStyle, alignment: 'right' },
              ],
              ...optionsRows,
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#E5E7EB',
            fillColor: (rowIndex: number) =>
              rowIndex === 0
                ? this.brandBlue
                : rowIndex % 2 === 0
                  ? '#F9FAFB'
                  : null,
          },
          margin: [0, 0, 0, 16],
        },
      );
    }

    // Prestations d'accompagnement
    const prestations = [
      offre.formation ? `Formation : ${offre.formation}` : null,
      offre.migration ? `Migration : ${offre.migration}` : null,
      offre.accompagnement
        ? `Accompagnement : ${offre.accompagnement}`
        : null,
    ].filter(Boolean) as string[];
    if (prestations.length) {
      content.push({
        stack: prestations.map((p) => ({
          text: `• ${p}`,
          fontSize: 9,
          color: '#555555',
          margin: [0, 0, 0, 2],
        })),
        margin: [0, 0, 0, 16],
      });
    }

    // Bloc totaux
    content.push({
      alignment: 'right',
      stack: [
        {
          columns: [
            { text: 'Total HT', width: '*' },
            {
              text: this.fmt(offre.prixHT, devise),
              width: 140,
              alignment: 'right',
            },
          ],
        },
        offre.remise
          ? {
              columns: [
                { text: 'Remise', width: '*', color: '#666666' },
                {
                  text: `- ${this.fmt(offre.remise, devise)}`,
                  width: 140,
                  alignment: 'right',
                  color: '#666666',
                },
              ],
            }
          : null,
        {
          columns: [
            { text: 'Taxes', width: '*', color: '#666666' },
            {
              text: this.fmt(offre.taxes, devise),
              width: 140,
              alignment: 'right',
              color: '#666666',
            },
          ],
        },
        {
          canvas: [
            {
              type: 'line',
              x1: 0,
              y1: 4,
              x2: 220,
              y2: 4,
              lineWidth: 0.5,
              lineColor: '#E5E7EB',
            },
          ],
          margin: [0, 4, 0, 4],
        },
        {
          columns: [
            {
              text: 'TOTAL TTC',
              bold: true,
              color: this.brandBlue,
              fontSize: 13,
            },
            {
              text: this.fmt(offre.prixTTC, devise),
              width: 140,
              alignment: 'right',
              bold: true,
              color: this.brandBlue,
              fontSize: 13,
            },
          ],
        },
      ].filter(Boolean),
      margin: [0, 0, 0, 20],
    });

    if (echeancesRows.length) {
      content.push(
        {
          text: 'Échéancier de paiement',
          fontSize: 11,
          bold: true,
          color: this.brandBlue,
          margin: [0, 0, 0, 6],
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', 'auto'],
            body: [
              [
                { text: 'Libellé', ...headerStyle },
                { text: 'Échéance', ...headerStyle, alignment: 'center' },
                { text: 'Montant', ...headerStyle, alignment: 'right' },
              ],
              ...echeancesRows,
            ],
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#E5E7EB',
            fillColor: (rowIndex: number) =>
              rowIndex === 0
                ? this.brandBlue
                : rowIndex % 2 === 0
                  ? '#F9FAFB'
                  : null,
          },
          margin: [0, 0, 0, 16],
        },
      );
    }

    if (offre.conditions) {
      content.push(
        {
          text: 'Conditions',
          fontSize: 10,
          bold: true,
          color: '#555555',
          margin: [0, 6, 0, 4],
        },
        { text: offre.conditions, fontSize: 8, color: '#777777' },
      );
    }

    if (offre.notes) {
      content.push({
        text: offre.notes,
        fontSize: 8,
        italics: true,
        color: '#999999',
        margin: [0, 8, 0, 0],
      });
    }

    const doc = {
      pageSize: 'A4',
      pageMargins: [40, 60, 40, 60],
      defaultStyle: { font: 'Roboto', fontSize: 10, color: '#333333' },
      header: {
        columns: [
          {
            text: 'SANTAREX ERP',
            style: { fontSize: 14, bold: true, color: this.brandBlue },
            margin: [40, 15, 0, 0],
          },
          {
            text: 'IBIG SOFT — ibigsoft.com',
            alignment: 'right',
            fontSize: 8,
            color: '#999999',
            margin: [0, 20, 40, 0],
          },
        ],
      },
      footer: (currentPage: number, pageCount: number) => ({
        text: `Devis ${offre.numero} — Page ${currentPage} / ${pageCount} — Généré le ${new Date().toLocaleDateString('fr-FR')}`,
        alignment: 'center',
        fontSize: 8,
        color: '#999999',
        margin: [0, 10, 0, 0],
      }),
      content,
    };

    return new Promise((resolve, reject) => {
      const pdfDoc = (PdfMake as any).createPdf(doc);
      pdfDoc.getBuffer((buf: Buffer) => resolve(buf), reject);
    });
  }

  // ─── Espace public (par token) ─────────────────────────────────────────────

  private urlPublique(token: string): string {
    const base = this.config.get<string>(
      'FRONTEND_URL',
      'https://santarex.ibigsoft.com',
    );
    return `${base.replace(/\/$/, '')}/offre/${token}`;
  }

  /** Consultation publique d'un devis via son token (sans authentification). */
  async findByToken(token: string): Promise<OffreCommerciale> {
    const offre = await this.repo.findOne({
      where: { tokenAcceptation: token },
    });
    if (!offre) throw new NotFoundException('Offre introuvable');

    // Expiration automatique si la date de validité est dépassée.
    if (
      offre.dateValidite &&
      new Date(offre.dateValidite).getTime() < Date.now() &&
      offre.statut !== OffreCommercialeStatut.ACCEPTEE &&
      offre.statut !== OffreCommercialeStatut.REFUSEE
    ) {
      offre.statut = OffreCommercialeStatut.EXPIREE;
      await this.repo.save(offre);
    }

    return offre;
  }

  /** Acceptation en ligne d'un devis via son token (sans authentification). */
  async accepterParToken(token: string): Promise<OffreCommerciale> {
    const offre = await this.repo.findOne({
      where: { tokenAcceptation: token },
    });
    if (!offre) throw new NotFoundException('Offre introuvable');

    if (offre.statut === OffreCommercialeStatut.ACCEPTEE) {
      throw new BadRequestException('Cette offre a déjà été acceptée');
    }
    if (offre.statut === OffreCommercialeStatut.REFUSEE) {
      throw new BadRequestException('Cette offre a été refusée');
    }
    if (
      offre.dateValidite &&
      new Date(offre.dateValidite).getTime() < Date.now()
    ) {
      offre.statut = OffreCommercialeStatut.EXPIREE;
      await this.repo.save(offre);
      throw new BadRequestException("Cette offre a expiré et n'est plus acceptable");
    }

    offre.statut = OffreCommercialeStatut.ACCEPTEE;
    offre.acceptedAt = new Date();
    const saved = await this.repo.save(offre);

    const dateAcceptation = new Date(saved.acceptedAt).toLocaleDateString('fr-FR');
    const montantTTC = this.fmt(saved.prixTTC, saved.devise ?? 'XOF');

    // 1) Confirmation au client (best-effort — le MailService avale ses erreurs).
    try {
      await this.mail.envoyerOffreAcceptee({
        to: saved.clientEmail,
        clientNom: saved.clientNom,
        numero: saved.numero,
        logiciel: saved.logiciel ?? 'SANTAREX ERP',
        formule: saved.formule,
        montantTTC,
        dateAcceptation,
      });
    } catch (e) {
      this.logger.error(
        `Échec email confirmation acceptation ${saved.numero}: ${(e as Error).message}`,
      );
    }

    // 2) Notification interne de l'équipe commerciale (réutilise le template interne).
    try {
      const salesEmail = this.config.get<string>(
        'SALES_EMAIL',
        this.config.get<string>('SMTP_FROM', 'contact@ibigsoft.com'),
      );
      await (this.mail as any).envoyerNouvelleDemandeInterne?.({
        to: salesEmail,
        titre: `Devis accepté — ${saved.numero}`,
        typeDemande: 'Acceptation de devis',
        reference: saved.numero,
        contactNom: saved.clientNom,
        contactEmail: saved.clientEmail,
        telephone: '—',
        entreprise: saved.clientNom,
        pays: '—',
        message: `Devis ${saved.numero} accepté en ligne (${montantTTC}). Formule : ${saved.formule ?? '—'}.`,
      });
    } catch (e) {
      this.logger.error(
        `Échec notification interne acceptation ${saved.numero}: ${(e as Error).message}`,
      );
    }

    // TODO (hors périmètre — module Licences) : déclencher ici le provisionnement
    // automatique de la licence / du tenant à partir du devis accepté
    // (création tenant, génération de la clé, email de bienvenue). Voir
    // payments/licences pour le point d'entrée d'activation.

    return saved;
  }
}
