import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import * as QRCode from 'qrcode';
import { User } from '../users/entities/user.entity';
import { decrypt, encrypt } from '../payments/util/secret-crypto';
import {
  generateRecoveryCodes,
  generateSecret,
  hashCodeSecours,
  otpauthUri,
  verifyTotp,
} from './totp';

/**
 * Double authentification par application (TOTP) + codes de secours.
 * Le secret est chiffré au repos (AES-256-GCM) ; les codes de secours ne sont
 * conservés que sous forme d'empreinte et ne servent qu'une fois.
 */
@Injectable()
export class TwoFactorService {
  constructor(@InjectRepository(User) private readonly users: Repository<User>) {}

  private async charger(userId: string, avecMotDePasse = false): Promise<User> {
    const champs = ['u.twoFactorSecret', 'u.twoFactorRecoveryCodes'];
    if (avecMotDePasse) champs.push('u.password');
    const u = await this.users
      .createQueryBuilder('u')
      .addSelect(champs)
      .where('u.id = :id', { id: userId })
      .getOne();
    if (!u) throw new NotFoundException('Utilisateur introuvable');
    return u;
  }

  private empreintes(u: User): string[] {
    try {
      const v = u.twoFactorRecoveryCodes ? JSON.parse(u.twoFactorRecoveryCodes) : [];
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }

  async status(userId: string) {
    const u = await this.charger(userId);
    return { enabled: !!u.twoFactorEnabled, recoveryCodesLeft: u.twoFactorEnabled ? this.empreintes(u).length : 0 };
  }

  /** Étape 1 : génère un secret (pas encore actif) et le QR code à scanner. */
  async setup(userId: string) {
    const u = await this.charger(userId);
    if (u.twoFactorEnabled) {
      throw new BadRequestException('La double authentification est déjà activée');
    }
    const secret = generateSecret();
    u.twoFactorSecret = encrypt(secret);
    u.twoFactorEnabled = false;
    await this.users.save(u);
    const url = otpauthUri(secret, u.email);
    return { secret, otpauthUrl: url, qrDataUrl: await QRCode.toDataURL(url, { margin: 1, width: 220 }) };
  }

  /** Étape 2 : l'utilisateur prouve qu'il a scanné (premier code) → activation + codes de secours. */
  async enable(userId: string, code: string) {
    const u = await this.charger(userId);
    if (u.twoFactorEnabled) throw new BadRequestException('La double authentification est déjà activée');
    if (!u.twoFactorSecret) throw new BadRequestException("Lancez d'abord la configuration");
    const pas = verifyTotp(decrypt(u.twoFactorSecret), code);
    if (pas === null) throw new BadRequestException('Code incorrect. Vérifiez l’heure de votre téléphone.');
    const codes = generateRecoveryCodes();
    u.twoFactorEnabled = true;
    u.twoFactorLastStep = pas;
    u.twoFactorRecoveryCodes = JSON.stringify(codes.map(hashCodeSecours));
    await this.users.save(u);
    return { recoveryCodes: codes };
  }

  /**
   * Vérifie le second facteur à la connexion : code à 6 chiffres (usage unique)
   * ou code de secours (consommé). Renvoie false si invalide.
   */
  async verifierConnexion(userId: string, code: string): Promise<boolean> {
    const u = await this.charger(userId);
    if (!u.twoFactorEnabled || !u.twoFactorSecret) return false;
    const saisi = String(code ?? '').trim();
    if (/^[\d\s]{6,8}$/.test(saisi)) {
      const pas = verifyTotp(decrypt(u.twoFactorSecret), saisi, { lastStep: u.twoFactorLastStep ?? null });
      if (pas === null) return false;
      u.twoFactorLastStep = pas;
      await this.users.save(u);
      return true;
    }
    const empreinte = hashCodeSecours(saisi);
    const liste = this.empreintes(u);
    if (!liste.includes(empreinte)) return false;
    u.twoFactorRecoveryCodes = JSON.stringify(liste.filter((h) => h !== empreinte));
    await this.users.save(u);
    return true;
  }

  /** Désactivation : exige le mot de passe ET un code valide (empêche un détournement de session). */
  async disable(userId: string, password: string, code: string) {
    const u = await this.charger(userId, true);
    if (!u.twoFactorEnabled) throw new BadRequestException("La double authentification n'est pas activée");
    if (!(await bcrypt.compare(password, u.password))) {
      throw new BadRequestException('Mot de passe incorrect');
    }
    if (!(await this.verifierConnexion(userId, code))) {
      throw new BadRequestException('Code incorrect');
    }
    const frais = await this.charger(userId);
    frais.twoFactorEnabled = false;
    frais.twoFactorSecret = null;
    frais.twoFactorRecoveryCodes = null;
    frais.twoFactorLastStep = null;
    await this.users.save(frais);
  }
}
