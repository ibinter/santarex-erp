# RECETTE SANTAREX — Section 46 (A→Z) exécutée contre la PRODUCTION

- **Cible** : https://santarex.ibigsoft.com — API : https://santarex.ibigsoft.com/api/v1
- **Date d'exécution** : 2026-07-26
- **Testeur** : agent de recette (lecture + micro-corrections sûres uniquement)
- **Comptes** : Tenant A `clinique-saint-joseph` (admin@clinique-saint-joseph.ci) — Tenant B créé pour l'isolation : `clinique-test-beta-recette` (recette-beta@example.com)

> Note d'auth : `POST /auth/login` exige `{ email, password, tenantId }` où `tenantId` = **slug** de l'établissement (ex. `clinique-saint-joseph`). Sans lui → 400.

---

## Campagne 1 — Routes & disponibilité

### 1a. Pages frontend (curl -o /dev/null -w %{http_code})

| Page | Code | Verdict |
|---|---|---|
| `/` | 200 | OK |
| `/login` | 200 | OK |
| `/inscription` | 200 | OK |
| `/dashboard` | 200 | OK (shell, auth client-side) |
| `/patients` | 200 | OK |
| `/facturation` | 200 | OK |
| `/maternite` | 200 | OK |
| `/interactions` | 200 | OK |
| `/abonnement` | 200 | OK |
| `/guide` | 200 | OK |
| `/faq` | 200 | OK |
| `/cgu` | 200 | OK |
| `/confidentialite` | 200 | OK |
| `/cookies` | 200 | OK |
| `/mentions-legales` | 200 | OK |
| `/securite` | 200 | OK |

**Aucun 404/500 sur les pages frontend.** `robots.txt`=200, `sitemap.xml`=200.

### 1b. Routes API (échantillon ~50 modules, avec token Tenant A)

Routes `list` et `/stats` testées. Résultats notables :

| Route | Code | Interprétation |
|---|---|---|
| `/patients`, `/consultations`, `/rendez-vous`, `/facturation`, `/devis`, `/urgences`, `/budget` (list) | 200 | OK |
| `/facturation/stats`, `/devis/stats`, `/urgences/stats`, `/budget/stats`, `/maternite/stats`, `/pediatrie/stats`, `/rh/stats`, `/comptabilite/stats`, `/approvisionnement/stats`, `/equipements/stats`, `/sterilisation/stats`, `/dechets-medicaux/stats`, `/incidents-qualite/stats`, `/indicateurs-qualite/stats`, `/satisfaction/stats`, `/consentements/stats`, `/interactions/stats`, `/tiers-payant/stats`, `/academie/stats`, `/plannings-gardes/stats`, `/had/stats`, `/declarations-sanitaires/stats`, `/bloc-operatoire/stats`, `/banque-sang/stats`, `/morgue/stats`, `/vaccination/stats`, `/transport/stats`, `/soins-infirmiers/stats`, `/prise-en-charge/stats`, `/dme/stats` | 200 | OK |
| `/crm/stats`, `/offres-saas/stats` | 403 | Gating premium/entitlement (attendu pour ce tenant) |
| `/patients/stats`, `/paiements/stats` | 400 | Paramètres requis (non bloquant) |
| `/consultations/stats`, `/rendez-vous/stats`, `/support-tickets/stats` | **500** | ⚠ Voir A4 : ces contrôleurs n'ont PAS de route `/stats` ; `stats` est capturé par `@Get(':id')` et un UUID invalide n'est pas validé → 500 |
| `/notifications/stats`, `/messagerie/stats`, `/audit-logs/stats`, `/exports/stats`, `/search/stats`, `/users/stats`, `/portail-patient/stats`, `/analytics/stats`, `/pharmacie/stats` … | 404 | Pas de route `/stats` sur ces modules (la ressource existe sous d'autres chemins) — non bloquant |

**Aucun 500 sur une route de liste/stats réelle.** Les 3 seuls 500 proviennent d'un défaut de validation UUID (A4), pas d'un plantage métier.

---

## Campagne 2 — Secrets exposés — 🔴 CRITIQUE CONFIRMÉ

`curl https://santarex.ibigsoft.com/` seul ne révèle rien (la clé est **obfusquée**). Recherche approfondie dans le code + les bundles servis :

- **Fichier source** : `frontend/src/components/landing/LandingPage.tsx:296`
  ```ts
  const SARA_GROQ_KEY = ['gsk_[REDACTED-CLE-GROQ]','dyb3FYJr2YGDHM37GHH2uJ8qu','wyEu1'].join('');
  // utilisée ligne 317 : headers: { 'Authorization': `Bearer ${SARA_GROQ_KEY}` } → fetch direct api.groq.com
  ```
- **Clé reconstituée** : `gsk_[REDACTED-CLE-GROQ]`
- **Preuve en PROD** : la clé est présente dans le bundle servi
  `https://santarex.ibigsoft.com/_next/static/chunks/app/page-202b841626071f83.js` (`grep` → **KEY FOUND**).
- **Impact** : n'importe quel visiteur peut extraire la clé et consommer le quota Groq / facturer le compte. Le fractionnement en tableau + `.join()` n'est **pas** une protection (contourne juste un grep naïf).
- **Recommandation** : révoquer/rotationner immédiatement la clé côté Groq, puis router SARA via un **proxy backend** (endpoint NestJS qui détient la clé en variable d'env serveur ; le front n'appelle plus jamais api.groq.com directement).

---

## Campagne 3 — i18n (clés brutes)

Recherche de motifs `nav.*`, `mod.*`, `common.*`, `guide.*`, `faq.*` non résolus dans le HTML rendu.

| Page | Résultat |
|---|---|
| `/`, `/guide`, `/faq`, `/abonnement`, `/securite`, `/cgu` | **clean** — aucune clé de traduction brute affichée |

**i18n OK** sur l'échantillon testé.

---

## Campagne 4 — Isolation multi-entreprise — 🟢 OK (aucune fuite)

Tenant B (`clinique-test-beta-recette`, base vide) tente d'accéder à des ressources du Tenant A.

| Test | Attendu | Obtenu | Verdict |
|---|---|---|---|
| B → `GET /patients/{id patient A}` (`f611b01b-…`) | 403/404 | **404** + message "introuvable" | OK |
| B → `GET /facturation/{id facture A}` (`093f2a27-…`) | 403/404 | **404** | OK |
| B → `GET /patients` (liste propre) | 0 | **0 élément** | OK |
| B → `GET /facturation` (liste propre) | 0 | **0 élément** | OK |

**Aucune fuite inter-tenant. Porte bloquante VERTE.**

---

## Campagne 5 — En-têtes de sécurité (constat avant déploiement de l'agent dédié)

| En-tête | Frontend `/`, `/login` | API `/api/v1/*` |
|---|---|---|
| Strict-Transport-Security (HSTS) | ❌ absent | ✅ `max-age=31536000; includeSubDomains` |
| X-Content-Type-Options | ❌ absent | ✅ `nosniff` |
| X-Frame-Options | ❌ absent | ✅ `SAMEORIGIN` |
| Referrer-Policy | ❌ absent | ❌ absent |
| Content-Security-Policy | ❌ absent | ❌ absent |
| Permissions-Policy | ❌ absent | ❌ absent |
| X-Powered-By (à masquer) | ⚠ `Next.js` exposé | — |

**Constat** : les en-têtes de sécurité sont posés sur le bloc `location /api` de nginx mais **pas** sur le bloc frontend ; Referrer-Policy et CSP manquent partout. `Server: nginx/1.24.0 (Ubuntu)` et `X-Powered-By: Next.js` divulguent la stack. À revérifier après le déploiement de l'agent en charge des headers.

---

## Campagne 6 — Routes premium/métier sans session — 🟢 OK

| Route (sans token) | Attendu | Obtenu |
|---|---|---|
| `/patients` | 401 | **401** |
| `/facturation` | 401 | **401** |
| `/rh/stats` | 401 | **401** |
| `/budget` | 401 | **401** |
| `/pharmacie/stats`, `/analytics/stats` | 401/404 | 404 (route inexistante, jamais 200) |

**Aucune route métier accessible sans jeton. Porte VERTE.**

---

## 46.6 — TABLEAU DES PORTES DE RECETTE

| # | Porte de recette | État | Justification |
|---|---|:---:|---|
| 1 | 0 anomalie **bloquante** | 🟢 VERT | Isolation OK, auth OK, aucune fuite |
| 2 | 0 secret exposé | 🔴 ROUGE | Clé Groq `gsk_…wyEu1` servie dans le bundle JS (A1, connu) |
| 3 | 0 fuite inter-entreprise | 🟢 VERT | Tenant B → 404 sur ressources A, listes vides |
| 4 | Routes premium/métier protégées (401 sans token) | 🟢 VERT | Toutes les routes testées → 401 |
| 5 | 0 route 500 (routes réelles) | 🟡 AMBRE | Aucun 500 métier ; 3×500 dus à validation UUID manquante (A4, non bloquant) |
| 6 | i18n sans clés brutes | 🟢 VERT | 6 pages clean |
| 7 | Responsive | ⚪ NON TESTÉ | Non testé finement (pas de rendu multi-viewport dans cette passe) |
| 8 | PWA installable | 🟢 VERT | `manifest.json` 200 (standalone, icônes 192+512, start_url), `sw.js` 200, `<link rel=manifest>` présent |
| 9 | En-têtes de sécurité complets | 🟡 AMBRE | API : HSTS/XFO/XCTO ✓ mais Referrer/CSP ✗ ; Frontend : aucun (agent dédié en cours) |
| 10 | Pages frontend sans 404/500 | 🟢 VERT | 16/16 pages → 200 |

**Portes vertes : 6/10** (2 ambres non bloquantes, 1 non testée, **1 rouge bloquante commercialement**).
**Score de recette : 60 % vertes ; 80 % si l'on inclut les ambres non bloquantes comme acceptables.**

---

## Liste des anomalies

| ID | Gravité | Preuve | Cause probable | Recommandation | Statut |
|---|---|---|---|---|---|
| **A1** | 🔴 CRITIQUE / BLOQUANTE COMMERCIALEMENT | Clé `gsk_[REDACTED-CLE-GROQ]` trouvée dans `/_next/static/chunks/app/page-202b841626071f83.js` | Clé Groq codée en dur côté client (`LandingPage.tsx:296`), fractionnée par `.join()` (fausse protection) | Révoquer la clé + proxy backend NestJS pour SARA ; ne jamais appeler api.groq.com depuis le navigateur | OUVERT — appartient à l'agent landing/SARA |
| **A2** | 🟠 MOYENNE | `curl -sI /` et `/login` → aucun HSTS/XFO/XCTO/Referrer/CSP | Bloc nginx frontend sans `add_header` ; Referrer-Policy/CSP absents aussi sur l'API | Ajouter les headers sur le bloc frontend + Referrer-Policy et CSP partout | OUVERT — agent « en-têtes de sécurité » |
| **A3** | 🟢 FAIBLE | `X-Powered-By: Next.js`, `Server: nginx/1.24.0 (Ubuntu)` | Divulgation de stack | Masquer `X-Powered-By` (poweredByHeader:false) et `server_tokens off` | OUVERT (touche next.config.js → réservé à un autre agent, documenté ici) |
| **A4** | 🟢 FAIBLE | `GET /consultations/abc` → 500 (vs `/patients/notauuid` → 400) | `@Get(':id')` sans `ParseUUIDPipe` sur `consultations`, `rendez-vous`, `support-tickets` (et probablement d'autres) → UUID invalide plante la requête DB | Ajouter `ParseUUIDPipe` sur les params `:id` pour renvoyer 400 propre | OUVERT — correctif sûr non appliqué (touche 3+ contrôleurs, laissé à l'orchestrateur pour cohérence) |

*Aucune correction n'a été appliquée par l'agent de recette : A1/A2/A3 touchent des fichiers réservés (landing, headers, next.config.js) ; A4 est un patch multi-contrôleurs laissé à l'orchestrateur.*

---

## Verdict global

- **Score de recette** : 6/10 portes vertes (60 %). Les seules portes non vertes non bloquantes sont ambres (500 UUID cosmétique, headers en cours) ou non testées (responsive).
- **VERDICT : NON COMMERCIALISABLE EN L'ÉTAT** — et pour **une seule raison bloquante** : **A1, la clé Groq exposée dans le bundle client (secret exposé)**.
- **Points bloquants restants** :
  1. 🔴 **A1** — révoquer la clé Groq et la proxifier côté backend (**impératif avant mise en vente**).
- **Non bloquant mais recommandé avant lancement** : A2 (en-têtes frontend + Referrer/CSP), A3 (masquer stack), A4 (ParseUUIDPipe).

> Dès qu'A1 est corrigée (proxy + rotation de clé) et A2 déployée, la recette repasse à **COMMERCIALISABLE** : le socle fonctionnel (isolation multi-tenant étanche, auth/401, 16/16 pages, ~30 modules `/stats` à 200, i18n propre, PWA installable) est sain.
