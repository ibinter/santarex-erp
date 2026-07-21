import { createHash, randomBytes } from 'crypto';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as QRCode from 'qrcode';

import { DocumentVerifiable } from './entities/document-verifiable.entity';
import { EnregistrerDocumentDto } from './dto/verification.dto';
import { VerificationStatus } from './verification.enums';

/** Contexte tenant issu du JWT (voir controller). */
export interface TenantContext {
  tenantId: string;
  userId?: string;
}

/** Résultat d'un enregistrement : token + URL publique de vérification. */
export interface EnregistrementResult {
  token: string;
  url: string;
  hash: string;
  /**
   * QR code (data-URL PNG base64) encodant l'URL publique de vérification.
   * Prêt à être intégré tel quel dans un PDF (`doc.addImage(...)`) ou un <img>.
   */
  qrDataUrl: string;
}

/**
 * Objet renvoyé par la vérification PUBLIQUE. Ne contient AUCUNE donnée
 * confidentielle : ni montant, ni patient, ni contenu du document.
 */
export interface VerificationPublique {
  logiciel: 'SANTAREX ERP';
  societe: string;
  typeDocument: string;
  reference: string;
  date: Date;
  statut: VerificationStatus;
  authentique: boolean;
}

/** Base URL publique du portail de vérification. */
const PUBLIC_VERIFY_BASE =
  process.env.VERIFY_PUBLIC_BASE_URL ?? 'https://santarex.ibigsoft.com/verify';

@Injectable()
export class VerificationService {
  constructor(
    @InjectRepository(DocumentVerifiable)
    private readonly repo: Repository<DocumentVerifiable>,
  ) {}

  /** Génère un token aléatoire non prévisible, unique en base. */
  private async genererTokenUnique(): Promise<string> {
    // Boucle de sécurité contre une collision (extrêmement improbable).
    for (let i = 0; i < 5; i += 1) {
      const token = randomBytes(24).toString('base64url');
      const exists = await this.repo.exist({ where: { token } });
      if (!exists) return token;
    }
    throw new BadRequestException(
      'Impossible de générer un token unique, veuillez réessayer.',
    );
  }

  /** Empreinte SHA-256 (hex) d'un contenu texte. */
  private hacher(contenu: string): string {
    return createHash('sha256').update(contenu, 'utf8').digest('hex');
  }

  /** URL publique de vérification associée à un token. */
  urlPublique(token: string): string {
    return `${PUBLIC_VERIFY_BASE}/${token}`;
  }

  /**
   * Génère un QR code (data-URL PNG base64) encodant l'URL PUBLIQUE de
   * vérification d'un token. Aucune donnée confidentielle n'est encodée :
   * uniquement l'URL du portail public. Prêt pour intégration PDF/web.
   */
  async genererQrCode(token: string): Promise<string> {
    return QRCode.toDataURL(this.urlPublique(token), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 320,
      color: { dark: '#0a1730ff', light: '#ffffffff' },
    });
  }

  /**
   * Enregistre un document vérifiable pour le tenant courant.
   * Retourne le token et l'URL publique.
   */
  async enregistrer(
    dto: EnregistrerDocumentDto,
    ctx: TenantContext,
  ): Promise<EnregistrementResult> {
    let hash = dto.hash?.toLowerCase();
    if (!hash) {
      if (!dto.contenu) {
        throw new BadRequestException(
          'Fournir soit "hash" (SHA-256), soit "contenu" à hacher.',
        );
      }
      hash = this.hacher(dto.contenu);
    }
    if (!/^[0-9a-f]{64}$/.test(hash)) {
      throw new BadRequestException('Le hash doit être un SHA-256 hexadécimal (64 caractères).');
    }

    const token = await this.genererTokenUnique();
    const emisLe = dto.emisLe ? new Date(dto.emisLe) : new Date();

    const doc = this.repo.create({
      token,
      typeDocument: dto.typeDocument,
      reference: dto.reference,
      tenantId: ctx.tenantId,
      tenantNom: dto.tenantNom,
      hash,
      statut: VerificationStatus.AUTHENTIQUE,
      emisLe,
      createdById: ctx.userId ?? null,
    });
    await this.repo.save(doc);

    return {
      token,
      url: this.urlPublique(token),
      hash,
      qrDataUrl: await this.genererQrCode(token),
    };
  }

  /**
   * Vérification PUBLIQUE par token. Renvoie un objet limité, sans donnée
   * confidentielle. Lève 404 si le token est introuvable.
   */
  async verifier(token: string): Promise<VerificationPublique> {
    const doc = await this.repo.findOne({ where: { token } });
    if (!doc) {
      throw new NotFoundException('Document introuvable ou token invalide.');
    }
    return {
      logiciel: 'SANTAREX ERP',
      societe: doc.tenantNom,
      typeDocument: doc.typeDocument,
      reference: doc.reference,
      date: doc.emisLe,
      statut: doc.statut,
      authentique: doc.statut === VerificationStatus.AUTHENTIQUE,
    };
  }

  /**
   * Révoque un document (statut → revoque). Réservé au tenant émetteur.
   */
  async revoquer(
    token: string,
    ctx: TenantContext,
  ): Promise<VerificationPublique> {
    const doc = await this.repo.findOne({ where: { token } });
    if (!doc) {
      throw new NotFoundException('Document introuvable ou token invalide.');
    }
    if (doc.tenantId !== ctx.tenantId) {
      // Isolation multi-tenant : un tenant ne révoque que ses propres documents.
      throw new NotFoundException('Document introuvable ou token invalide.');
    }
    doc.statut = VerificationStatus.REVOQUE;
    await this.repo.save(doc);
    return this.verifier(token);
  }
}
