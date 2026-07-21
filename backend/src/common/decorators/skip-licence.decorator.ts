import { SetMetadata, CustomDecorator } from '@nestjs/common';

/**
 * Clé de métadonnée : marque un handler / contrôleur comme EXEMPTÉ de
 * l'application de la licence (LicenceGuard) et de l'entitlement module
 * (ModuleGuard). Utile pour des routes techniques ou transverses qui doivent
 * rester joignables même lorsqu'une licence est suspendue/expirée.
 */
export const SKIP_LICENCE_KEY = 'skipLicence';

/**
 * `@SkipLicence()` — exempte la route (ou tout le contrôleur) des gardes
 * d'application de licence et de module. À utiliser avec parcimonie : par
 * défaut, préférez laisser les gardes s'appliquer.
 *
 * @example
 *   @SkipLicence()
 *   @Get('ping')
 *   ping() { return 'ok'; }
 */
export const SkipLicence = (): CustomDecorator =>
  SetMetadata(SKIP_LICENCE_KEY, true);
