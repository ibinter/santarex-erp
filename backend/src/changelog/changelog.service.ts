import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VersionErp,
  StatutVersion,
} from './entities/version-erp.entity';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { APP_VERSION, APP_NAME } from './version.constant';

@Injectable()
export class ChangelogService {
  constructor(
    @InjectRepository(VersionErp)
    private readonly repo: Repository<VersionErp>,
  ) {}

  /** Version courante de l'application (constante serveur). */
  getVersionCourante() {
    return { version: APP_VERSION, application: APP_NAME };
  }

  /** Liste publique : versions publiées, plus récentes en premier. */
  findPubliees(): Promise<VersionErp[]> {
    return this.repo.find({
      where: { statut: StatutVersion.PUBLIEE },
      order: { datePublication: 'DESC', createdAt: 'DESC' },
    });
  }

  /** Dernière version publiée (pour la bannière « Quoi de neuf »). */
  async findDerniere(): Promise<VersionErp | null> {
    const [derniere] = await this.repo.find({
      where: { statut: StatutVersion.PUBLIEE },
      order: { datePublication: 'DESC', createdAt: 'DESC' },
      take: 1,
    });
    return derniere ?? null;
  }

  /** Admin : toutes les versions (brouillons inclus). */
  findAll(): Promise<VersionErp[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<VersionErp> {
    const v = await this.repo.findOne({ where: { id } });
    if (!v) throw new NotFoundException('Version introuvable');
    return v;
  }

  async create(dto: CreateVersionDto): Promise<VersionErp> {
    const entity = this.repo.create({
      ...dto,
      nouveautesJson: dto.nouveautesJson ?? [],
      datePublication: dto.datePublication
        ? new Date(dto.datePublication)
        : dto.statut === StatutVersion.PUBLIEE
          ? new Date()
          : null,
    });
    const saved = await this.repo.save(entity);
    this.notifierSiMajeure(saved);
    return saved;
  }

  async update(id: string, dto: UpdateVersionDto): Promise<VersionErp> {
    const v = await this.findOne(id);
    const etaitPubliee = v.statut === StatutVersion.PUBLIEE;
    Object.assign(v, {
      ...dto,
      datePublication: dto.datePublication
        ? new Date(dto.datePublication)
        : v.datePublication,
    });
    // Passage brouillon -> publiée : horodate la publication si absente.
    if (
      dto.statut === StatutVersion.PUBLIEE &&
      !etaitPubliee &&
      !v.datePublication
    ) {
      v.datePublication = new Date();
    }
    const saved = await this.repo.save(v);
    if (dto.statut === StatutVersion.PUBLIEE && !etaitPubliee) {
      this.notifierSiMajeure(saved);
    }
    return saved;
  }

  async remove(id: string): Promise<{ success: boolean }> {
    const v = await this.findOne(id);
    await this.repo.remove(v);
    return { success: true };
  }

  /**
   * TODO(mail) : à la publication d'une version MAJEURE, notifier les tenants.
   * Injecter MailService (MailModule) et envoyer un email « Nouvelle version
   * majeure {version} disponible » avec le récapitulatif `nouveautesJson`.
   * Volontairement non implémenté ici (hors périmètre de cette tâche).
   */
  private notifierSiMajeure(version: VersionErp): void {
    if (
      version.statut === StatutVersion.PUBLIEE &&
      version.estMajeure
    ) {
      // await this.mailService.envoyerNotificationVersionMajeure(version);
    }
  }
}
