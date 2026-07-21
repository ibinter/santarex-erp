import { registerAs } from '@nestjs/config';

/**
 * Lit une variable d'environnement OBLIGATOIRE. Fait échouer le démarrage
 * si elle est absente/vide, au lieu de retomber sur un secret par défaut
 * faible et prévisible (risque critique de forge de jetons JWT).
 */
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Variable d'environnement obligatoire manquante : ${name}. ` +
        `Définissez-la avant de démarrer l'application (aucun secret par défaut n'est fourni).`,
    );
  }
  return value;
}

export default registerAs('jwt', () => ({
  secret: requireEnv('JWT_SECRET'),
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshSecret: requireEnv('JWT_REFRESH_SECRET'),
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
}));
