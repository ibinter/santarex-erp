# PaymentsModule — branchement & exploitation

Module de paiement SaaS universel. Tables préfixées `pay_` (isolées des tables
`paiements_saas` existantes).

## 1. Brancher le module dans `src/app.module.ts`

Ajouter l'import en tête de fichier :

```ts
import { PaymentsModule } from './payments/payments.module';
```

puis l'ajouter au tableau `imports` du décorateur `@Module` (n'importe où dans la
liste, p.ex. après `LicencesModule`) :

```ts
    LicencesModule,
    PaymentsModule,
```

## 2. Dépendances npm requises

Le module utilise deux paquets NestJS non encore installés :

```bash
npm install @nestjs/schedule
npm install @nestjs/axios   # déjà déclaré dans package.json, à installer
```

- `@nestjs/axios` (`HttpModule`) : appels sortants vers les passerelles.
- `@nestjs/schedule` (`ScheduleModule.forRoot()`) : cron du cycle de vie des
  licences (`LicenceSchedulerService`).

`ScheduleModule.forRoot()` est activé **dans PaymentsModule** car aucune
activation globale n'existe dans `src/app.module.ts`. Si une autre partie de
l'app venait à l'activer globalement, retirer l'appel ici pour éviter le double
enregistrement.

## 3. Variables d'environnement

| Variable            | Obligatoire | Rôle |
|---------------------|-------------|------|
| `PAYMENTS_ENC_KEY`  | Oui (prod)  | Clé de chiffrement AES-256-GCM des secrets passerelles (au repos). À défaut, dérivée de `JWT_SECRET` avec avertissement — **à définir en production**. |
| `DB_HOST` / `DB_PORT` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` | Oui | Base Postgres (mêmes valeurs que l'app ; lues par `data-source.ts`). |
| `NODE_ENV`          | Oui (prod)  | `production` ⇒ `synchronize:false` ⇒ le schéma n'évolue que par migrations. |
| `FRONTEND_URL`      | Recommandé  | Base des URLs de retour passerelle (redirection après paiement). |
| `PAYMENTS_PROOF_DIR`| Optionnel   | Répertoire de stockage **privé** des preuves (hors `/public`). Défaut géré par `ProofStorageService`. |

Les URLs de callback / webhook par passerelle sont stockées **en base**
(`pay_method_configs.publicConfig` / `secretConfig`), pas en variables d'env.

## 4. Migrations (obligatoire en production, `synchronize:false`)

Aucune infra de migration n'existait : elle est fournie par
`src/database/data-source.ts` + `src/database/migrations/*`. Scripts ajoutés à
`package.json` :

```bash
npm run migration:run      # applique CreatePaymentsTables (idempotent)
npm run migration:revert   # annule la dernière migration
```

La migration `1750000000000-CreatePaymentsTables` crée les 5 tables `pay_*`
(+ enums + index + contrainte unique `(gateway, eventId)`) en SQL idempotent
(`CREATE TABLE IF NOT EXISTS`, `DO $$ ... IF NOT EXISTS` pour les enums) : elle
cohabite sans erreur avec `synchronize:true` en développement et peut être
rejouée.

## 5. Webhooks — `rawBody` requis

La vérification de signature des passerelles a besoin du **corps brut** de la
requête (le JSON re-sérialisé casse la signature). Activer `rawBody` au bootstrap
dans `src/main.ts` :

```ts
const app = await NestFactory.create(AppModule, { rawBody: true });
```

`WebhooksController` lit alors `req.rawBody` (Buffer) pour recalculer le HMAC
avant tout parsing. Ne jamais faire confiance à un webhook dont la signature
n'est pas validée à partir du corps brut.
