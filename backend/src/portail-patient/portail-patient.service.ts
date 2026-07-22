import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

import { AccesPortail } from './entities/acces-portail.entity';
import { Patient } from '../patients/entities/patient.entity';
import { RendezVous } from '../rendez-vous/entities/rendez-vous.entity';
import { ResultatAnalyse } from '../laboratoire/entities/resultat-analyse.entity';
import { Ordonnance } from '../consultations/entities/ordonnance.entity';
import { CreateAccesDto } from './dto/create-acces.dto';
import { PortailLoginDto } from './dto/portail-login.dto';
import { ResetMotDePasseDto } from './dto/reset-mot-de-passe.dto';

/**
 * Cœur métier du PORTAIL PATIENT.
 *
 * Deux surfaces :
 *  - STAFF (admin) : cycle de vie des accès (création, activation, mot de passe).
 *  - PATIENT : login + lecture STRICTEMENT scopée (patientId + tenant du token).
 *
 * Règle de sécurité invariante : toute lecture patient filtre sur
 * (patientId, tenantId) provenant du JWT portail — jamais d'un paramètre client.
 */
@Injectable()
export class PortailPatientService {
  private readonly logger = new Logger(PortailPatientService.name);

  constructor(
    @InjectRepository(AccesPortail)
    private readonly accesRepo: Repository<AccesPortail>,
    @InjectRepository(Patient)
    private readonly patientRepo: Repository<Patient>,
    @InjectRepository(RendezVous)
    private readonly rdvRepo: Repository<RendezVous>,
    @InjectRepository(ResultatAnalyse)
    private readonly resultatRepo: Repository<ResultatAnalyse>,
    @InjectRepository(Ordonnance)
    private readonly ordonnanceRepo: Repository<Ordonnance>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // ─────────────────────────────────────────────────────────────────────────
  //  STAFF — gestion des accès (protégé par JwtAuthGuard dans le controller)
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Crée un accès portail pour un patient du tenant courant.
   * Renvoie le mot de passe EN CLAIR une seule fois (à transmettre au patient).
   */
  async creerAcces(dto: CreateAccesDto, tenantId: string) {
    // Le patient doit exister DANS CE TENANT (empêche la création cross-tenant).
    const patient = await this.patientRepo.findOne({
      where: { id: dto.patientId, tenantId },
    });
    if (!patient) {
      throw new NotFoundException('Patient introuvable dans cet établissement');
    }

    const existant = await this.accesRepo.findOne({
      where: { patientId: dto.patientId, tenantId },
    });
    if (existant) {
      throw new ConflictException('Un accès portail existe déjà pour ce patient');
    }

    const identifiant = (dto.identifiant?.trim() || this.genererIdentifiant(patient));

    // Unicité (tenant, identifiant).
    const identifiantPris = await this.accesRepo.findOne({
      where: { tenantId, identifiant },
    });
    if (identifiantPris) {
      throw new ConflictException('Cet identifiant est déjà utilisé');
    }

    const motDePasse = dto.motDePasse?.trim() || this.genererMotDePasse();
    const motDePasseHash = await bcrypt.hash(motDePasse, 10);

    const acces = this.accesRepo.create({
      patientId: dto.patientId,
      identifiant,
      motDePasseHash,
      actif: true,
      tenantId,
    });
    const saved = await this.accesRepo.save(acces);

    return {
      id: saved.id,
      patientId: saved.patientId,
      identifiant: saved.identifiant,
      actif: saved.actif,
      // En clair, une seule fois — à communiquer au patient de vive voix.
      motDePasse,
    };
  }

  /** Liste des accès du tenant (sans hash), avec infos patient de base. */
  async listerAcces(tenantId: string) {
    const acces = await this.accesRepo.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
    if (acces.length === 0) return [];

    const patients = await this.patientRepo.find({
      where: { tenantId },
    });
    const parId = new Map(patients.map((p) => [p.id, p]));

    return acces.map((a) => {
      const p = parId.get(a.patientId);
      return {
        id: a.id,
        patientId: a.patientId,
        patientNom: p ? `${p.nom} ${p.prenom}` : null,
        patientIpp: p?.ipp ?? null,
        identifiant: a.identifiant,
        actif: a.actif,
        dateDernierAcces: a.dateDernierAcces,
        createdAt: a.createdAt,
      };
    });
  }

  /** Active ou désactive un accès (scopé tenant). */
  async definirActif(id: string, actif: boolean, tenantId: string) {
    const acces = await this.accesRepo.findOne({ where: { id, tenantId } });
    if (!acces) throw new NotFoundException('Accès portail introuvable');
    acces.actif = actif;
    await this.accesRepo.save(acces);
    return { id: acces.id, actif: acces.actif };
  }

  /** Réinitialise le mot de passe ; renvoie le nouveau en clair une seule fois. */
  async reinitialiserMotDePasse(
    id: string,
    dto: ResetMotDePasseDto,
    tenantId: string,
  ) {
    const acces = await this.accesRepo.findOne({ where: { id, tenantId } });
    if (!acces) throw new NotFoundException('Accès portail introuvable');

    const motDePasse = dto.motDePasse?.trim() || this.genererMotDePasse();
    acces.motDePasseHash = await bcrypt.hash(motDePasse, 10);
    await this.accesRepo.save(acces);

    return { id: acces.id, motDePasse };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PATIENT — authentification
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Authentifie un patient et renvoie un JWT dédié (scope 'portail').
   * Message générique en cas d'échec : pas d'énumération d'identifiants.
   */
  async login(dto: PortailLoginDto) {
    const messageGenerique = 'Identifiants incorrects';
    const tenantId = dto.tenantSlug.trim().toLowerCase();

    const acces = await this.accesRepo
      .createQueryBuilder('a')
      .addSelect('a.motDePasseHash')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.identifiant = :identifiant', { identifiant: dto.identifiant.trim() })
      .getOne();

    // Comparaison bcrypt effectuée même si l'accès est absent (anti-timing léger).
    const hash = acces?.motDePasseHash ?? '$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva';
    const motDePasseOk = await bcrypt.compare(dto.motDePasse, hash);

    if (!acces || !motDePasseOk) {
      throw new UnauthorizedException(messageGenerique);
    }
    if (!acces.actif) {
      throw new UnauthorizedException('Accès désactivé. Contactez votre établissement.');
    }

    acces.dateDernierAcces = new Date();
    await this.accesRepo.save(acces);

    const token = await this.jwtService.signAsync(
      {
        patientId: acces.patientId,
        tenantSlug: acces.tenantId,
        scope: 'portail',
      },
      {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
        expiresIn: this.configService.get<string>('PORTAIL_JWT_EXPIRY', '2h'),
      },
    );

    return { access_token: token };
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  PATIENT — lectures scopées (patientId + tenant du token portail)
  // ─────────────────────────────────────────────────────────────────────────

  async profil(patientId: string, tenantId: string) {
    const p = await this.patientRepo.findOne({ where: { id: patientId, tenantId } });
    if (!p) throw new NotFoundException('Dossier introuvable');
    // Projection minimale — aucune donnée sensible non nécessaire.
    return {
      ipp: p.ipp,
      nom: p.nom,
      prenom: p.prenom,
      dateNaissance: p.dateNaissance,
      sexe: p.sexe,
      telephone: p.telephone,
      email: (p as any).email ?? null,
      ville: p.ville,
      groupeSanguin: p.groupeSanguin ?? null,
    };
  }

  async mesRendezVous(patientId: string, tenantId: string) {
    const rdvs = await this.rdvRepo.find({
      where: { patientId, tenantId },
      order: { dateHeure: 'DESC' },
      take: 100,
    });
    return rdvs.map((r) => ({
      id: r.id,
      dateHeure: r.dateHeure,
      dureeMinutes: r.dureeMinutes,
      motif: r.motif,
      type: r.type,
      statut: r.statut,
      salle: r.salle ?? null,
    }));
  }

  async mesResultats(patientId: string, tenantId: string) {
    // Uniquement les résultats VALIDÉS sont exposés au patient.
    const resultats = await this.resultatRepo.find({
      where: { patientId, tenantId, statut: 'valide' as any },
      order: { updatedAt: 'DESC' },
      take: 100,
    });
    return resultats.map((r) => ({
      id: r.id,
      dateValidation: r.dateValidation ?? r.updatedAt,
      interpretation: r.interpretation ?? null,
      estCritique: r.estCritique,
      resultats: r.resultats ?? [],
    }));
  }

  async mesOrdonnances(patientId: string, tenantId: string) {
    const ordonnances = await this.ordonnanceRepo.find({
      where: { patientId, tenantId },
      order: { dateEmission: 'DESC' },
      take: 100,
    });
    return ordonnances.map((o) => ({
      id: o.id,
      dateEmission: o.dateEmission,
      dateExpiration: o.dateExpiration ?? null,
      statut: o.statut,
      instructions: o.instructions ?? null,
      lignes: o.lignes ?? [],
    }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  Utilitaires
  // ─────────────────────────────────────────────────────────────────────────

  private genererIdentifiant(patient: Patient): string {
    // Basé sur l'IPP si dispo, sinon aléatoire — toujours re-vérifié en amont.
    const base = (patient.ipp || 'PAT').replace(/[^A-Za-z0-9]/g, '');
    const suffixe = crypto.randomBytes(2).toString('hex').toUpperCase();
    return `${base}-${suffixe}`;
  }

  private genererMotDePasse(): string {
    // 12 caractères URL-safe, entropie suffisante pour un secret transmis.
    return crypto.randomBytes(9).toString('base64').replace(/[^A-Za-z0-9]/g, '').slice(0, 12).padEnd(12, 'x');
  }
}
