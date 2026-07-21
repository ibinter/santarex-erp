# Application de licence & entitlement module (LicenceGuard / ModuleGuard)

Ce dossier fournit l'**application côté serveur** de la licence d'un tenant et de
l'entitlement des modules métier de sa formule. La logique de décision est
centralisée dans `LicenceLifecycleService.getTenantAccess()` (module `payments`).

## Pièces

| Élément | Fichier | Rôle |
|---|---|---|
| Décision d'accès (pure) | `payments/licence-lifecycle.service.ts` → `getTenantAccess()` | Charge la/les licence(s) du tenant, lit le cycle de vie, renvoie `{ allowed, reason, lifecycle, modules }`. |
| `LicenceGuard` | `common/guards/licence.guard.ts` | Bloque un tenant dont la licence est `SUSPENDED` / `REVOKED` / `EXPIRED` (au-delà de la grâce). |
| `ModuleGuard` | `common/guards/module.guard.ts` | Bloque l'accès à un module non inclus dans la formule (carte préfixe→module interne). |
| `@SkipLicence()` | `common/decorators/skip-licence.decorator.ts` | Exempte une route/contrôleur des deux gardes. |

## Décision de câblage : PAR CONTRÔLEUR, pas en APP_GUARD

Cette application **n'a pas de `JwtAuthGuard` global**. Le JWT est appliqué
contrôleur par contrôleur (`@UseGuards(JwtAuthGuard)`), et `req.user` (donc
`user.tenantId`) n'est posé qu'à ce moment-là.

Les gardes globaux (`APP_GUARD`) s'exécutent **avant** les gardes de contrôleur.
Enregistrer `LicenceGuard`/`ModuleGuard` en `APP_GUARD` les ferait tourner
**avant** le `JwtAuthGuard` : `req.user` serait indéfini, ils s'auto-exempteraient
(fail-open) et **n'auraient aucun effet**. C'est pourquoi ils **ne sont pas**
enregistrés en `APP_GUARD` (voir le commentaire dans `app.module.ts`).

Ils sont exposés en `providers`/`exports` de `PaymentsModule` et doivent être
appliqués **après l'authentification**, au niveau contrôleur :

```ts
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { LicenceGuard } from '../common/guards/licence.guard';
import { ModuleGuard } from '../common/guards/module.guard';

@UseGuards(JwtAuthGuard, RolesGuard, LicenceGuard, ModuleGuard)
@Controller('laboratoire')
export class LaboratoireController { /* … */ }
```

> L'ordre est important : `JwtAuthGuard` pose `req.user`, puis `LicenceGuard`
> vérifie le cycle de vie, puis `ModuleGuard` vérifie l'entitlement module.

Le module hôte du contrôleur doit importer `PaymentsModule` pour résoudre
l'injection des gardes.

### Alternative (enforcement global) — non retenue

Rendre le `JwtAuthGuard` global (`APP_GUARD`, avec un `@Public()` pour les routes
ouvertes) permettrait ensuite d'enregistrer `LicenceGuard` puis `ModuleGuard` en
`APP_GUARD` **après** lui. Non retenu ici pour ne pas modifier le modèle d'auth
existant (per-controller) en production.

## Garanties production-safe (biais fail-open)

Les gardes **ne peuvent pas verrouiller le tenant live** :

- **Aucun `req.user`** → `return true` (l'auth décide ailleurs).
- **Route exemptée** (préfixe allowlist, `@Public()` ou `@SkipLicence()`) → `true`.
- **Aucune licence pour le tenant** → `getTenantAccess` renvoie
  `allowed:true, reason:'no-licence-fail-open'` (le tenant live actuel n'a pas de
  licence : il n'est JAMAIS bloqué).
- **`modules === null`** (aucune restriction déclarée / donnée illisible) →
  `ModuleGuard` autorise tout.
- **Erreur interne** (DB indisponible, table absente…) → log `warn` + `return true`.

Seuls les états **`SUSPENDED` / `REVOKED` / `EXPIRED`** (expiré au-delà de la
grâce) produisent un `403`. `ACTIVE`, `TRIAL`, `GRACE`, `PROVISIONAL` et
`AWAITING_PAYMENT` autorisent l'accès.

## Préfixes exemptés (`LICENCE_EXEMPT_PREFIXES`)

Comparés après retrait du préfixe global `/api/v1` :

`/auth`, `/superadmin`, `/licences`, `/abonnement`, `/health`,
`/payments/webhooks`, `/ai-assistant`, `/support-tickets`.

Objectif : garder joignables l'authentification, l'administration SaaS, le
renouvellement d'abonnement (même licence expirée), la santé, les webhooks de
passerelle (sans JWT), l'assistant IA et le support.

## Carte préfixe → module (`ModuleGuard`, interne)

`/laboratoire`→`laboratoire`, `/pharmacie`→`pharmacie`,
`/hospitalisation`→`hospitalisation`, `/facturation`→`facturation`,
`/consultations`→`consultations`, `/urgences`→`urgences`,
`/rendez-vous`→`rendez-vous`, `/dme`→`dme`, `/patients`→`patients`,
`/paiements`→`paiements`.

Un chemin non mappé n'est pas restreint par le module (fail-open).
