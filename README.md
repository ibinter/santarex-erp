# SANTAREX ERP

**Logiciel SaaS de gestion hospitalière pour l'Afrique**
Produit par [IBIG SOFT (IBIG SARL)](https://ibigsoft.com) — Abidjan, Côte d'Ivoire

---

## Présentation

SANTAREX ERP est une plateforme multi-tenant Cloud permettant la gestion complète des établissements de santé : dossiers patients électroniques, pharmacie, laboratoire, facturation, urgences, hospitalisation, ressources humaines et statistiques.

## Architecture technique

| Couche | Technologie |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS |
| Backend | NestJS 10, TypeORM 0.3, PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 7j), bcrypt |
| Paiements | Moneroo (agrégateur : Orange Money, Wave, MTN MoMo, Visa/MC) |
| IA | Groq (défaut) / Anthropic / OpenAI — streaming SSE |
| i18n | next-intl — FR/EN |
| Conteneurs | Docker + docker-compose |
| CI/CD | GitHub Actions |

## Modules

- **Patients & DME** — Dossier médical électronique complet
- **Consultations** — Ordonnances, prescriptions, diagnostics
- **Pharmacie** — Stock, dispensation, alertes péremption
- **Laboratoire** — Analyses, résultats, intégration DME
- **Facturation** — Devis, factures, reçus, exports PDF/XLSX
- **Urgences** — Triage, prise en charge rapide
- **Hospitalisation** — Lits, séjours, soins continus
- **Rendez-vous** — Planning médecins, rappels patients
- **SuperAdmin** — Console de gestion tenants/licences/offres
- **Assistant IA SARA** — Streaming multi-provider (Groq/Anthropic/OpenAI)
- **Notifications** — In-app temps réel + email
- **Support tickets** — Help center intégré

## Démarrage rapide (développement)

```bash
# 1. Prérequis : Node 20+, PostgreSQL 16
git clone https://github.com/ibinter/santarex-erp.git
cd santarex-erp

# 2. Backend
cd backend
cp .env.example .env        # puis remplir les valeurs
npm install
npm run start:dev           # port 3001

# 3. Seed (données de démo)
npm run seed

# 4. Frontend
cd ../frontend
npm install
npm run dev -- -p 3003      # port 3003
```

**Comptes démo** (après seed) :

| Rôle | Email | Mot de passe |
|---|---|---|
| Admin | admin@clinique-saint-joseph.ci | Admin2025! |
| Médecin | dr.amara@clinique-saint-joseph.ci | Medecin2025! |
| Pharmacien | ahmed@clinique-saint-joseph.ci | Pharmacien2025! |
| Caissier | celestine@clinique-saint-joseph.ci | Caissiere2025! |
| Laborantin | jean@clinique-saint-joseph.ci | Labo2025! |

## Déploiement production (Docker)

```bash
# Sur le VPS
cp backend/.env.example .env.prod   # remplir toutes les valeurs
docker compose -f docker-compose.prod.yml up -d
```

**Variables d'environnement requises en production** (voir `backend/.env.example`) :
- `DB_PASSWORD` — mot de passe PostgreSQL fort
- `JWT_SECRET` / `JWT_REFRESH_SECRET` — chaînes aléatoires 64 caractères
- `SMTP_*` — configuration email transactionnel (Brevo recommandé)
- `MONEROO_SECRET_KEY` + `MONEROO_WEBHOOK_SECRET` — clés Moneroo
- `GROQ_API_KEY` — clé API Groq pour l'assistant IA SARA (gratuit)
- `APP_URL` / `FRONTEND_URL` — URLs publiques

## Tests

```bash
# Backend (Jest) — 22 tests unitaires
cd backend
npm test                # tests unitaires
npm run test:cov        # avec rapport de couverture

# E2E (Playwright)
cd frontend
npx playwright test     # nécessite le serveur frontend démarré
```

## CI/CD

GitHub Actions déclenché sur chaque push `main` :
1. **Tests backend** (Jest) — obligatoire
2. **Build frontend** (Next.js) — obligatoire
3. **Tests E2E Playwright** — sur PR uniquement
4. **Build & push images Docker** — sur `main` seulement
5. **Déploiement SSH VPS** — sur `main` seulement (env `production`)

**Secrets GitHub à configurer** :
`DOCKER_USERNAME`, `DOCKER_PASSWORD`, `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`

## Sécurité

- Helmet (headers HTTP sécurisés)
- Rate limiting : 20 req/min global, 10 req/min sur `/auth/login`
- Isolation multi-tenant stricte (`tenantId` sur toutes les entités)
- Audit trail complet (`audit_logs`) — fire-and-forget
- Fichiers sensibles exclus du repo : `.env.prod`, `docker-compose.prod.yml`
- Validation HMAC sha256 sur les webhooks Moneroo

## Ports

| Service | Développement | Production (host) |
|---|---|---|
| Frontend | 3003 | 3003 |
| Backend | 3001 | 3002 |
| PostgreSQL | 5432 | non exposé |

## Support & Contact

- Email : contact@ibigsoft.com
- Site : https://ibigsoft.com
- Guide utilisateur : https://santarex.ibigsoft.com/guide
- Tél : +225 27 22 27 60 14

---

*© 2026 IBIG SOFT (IBIG SARL) — Tous droits réservés*
