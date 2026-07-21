// ════════════════════════════════════════════════════════════════════════════
//  DataSource TypeORM dédié à la CLI de migrations (npm run migration:run /
//  migration:revert). Il lit EXACTEMENT les mêmes variables d'environnement que
//  la configuration TypeOrmModule d'app.module.ts, afin que les migrations
//  s'exécutent sur la même base que l'application.
//
//  En production `synchronize:false` : le schéma n'est JAMAIS altéré au démarrage
//  de l'app ; il évolue uniquement via ces migrations versionnées.
// ════════════════════════════════════════════════════════════════════════════

import 'reflect-metadata';
import { DataSource } from 'typeorm';

// Charge un éventuel fichier .env (require paresseux : si `dotenv` n'est pas
// installé, on retombe silencieusement sur process.env déjà peuplé — utile en
// production où les variables sont injectées par l'orchestrateur).
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  require('dotenv').config();
} catch {
  /* dotenv absent : variables supposées déjà présentes dans l'environnement. */
}

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USER || 'santarex',
  password: process.env.DB_PASSWORD || 'santarex_secure_password',
  database: process.env.DB_NAME || 'santarex_db',
  // On charge toutes les entités du projet pour que les migrations générées
  // (le cas échéant) restent cohérentes, mais les migrations livrées sont en
  // SQL brut idempotent et ne dépendent pas de la synchronisation.
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  migrationsTableName: 'migrations_history',
  synchronize: false,
  logging: process.env.NODE_ENV === 'development',
});

export default AppDataSource;
