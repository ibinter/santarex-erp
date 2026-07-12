# AUDIT_FINALISATION_SANTAREX.md
**Logiciel :** SANTAREX ERP  
**Éditeur :** IBIG SOFT — Intermark Business International Group  
**Secteur :** Santé / Gestion hospitalière  
**Domaine :** santarex.ibigsoft.com → santarex.com (futur)  
**Date d'audit :** 12 juillet 2026  
**Version du projet :** 1.0.0  
**Statut global :** MVP fonctionnel — nécessite finalisation commerciale et sécuritaire complète

---

## 1. ÉTAT ACTUEL DU PROJET

### Architecture détectée
| Couche | Technologie | Version | État |
|--------|-------------|---------|------|
| Frontend | Next.js (App Router) | 14.2.0 | ✅ Opérationnel |
| Backend | NestJS | 10.x | ✅ Opérationnel |
| ORM | TypeORM | 0.3.20 | ✅ Opérationnel |
| Base de données | PostgreSQL | 16 | ✅ Opérationnel |
| Cache | Redis | 7 | ⚠️ Installé, non utilisé |
| Fichiers | MinIO | — | ⚠️ En dev seulement |
| Recherche | Elasticsearch | 8.12 | ⚠️ En dev seulement |
| Infrastructure | Docker + nginx | — | ✅ En production |
| HTTPS | Let's Encrypt | — | ✅ Actif |
| Typographie | Inter | — | ✅ |
| Couleurs | #0D47A1 (bleu) + #00BCD4 (cyan) | — | ✅ Définie |

### Multi-tenant
Stratégie par colonne `tenantId` sur les 19 entités. Un seul tenant actif : `clinique-saint-joseph`.

---

## 2. FONCTIONNALITÉS OPÉRATIONNELLES

| # | Module | Fonctionnalité | État |
|---|--------|---------------|------|
| 1 | Auth | Connexion JWT, refresh token, déconnexion | ✅ |
| 2 | Auth | RBAC (8 rôles) via décorateur @Roles | ✅ |
| 3 | Patients | CRUD complet + IPP auto + recherche | ✅ |
| 4 | DME | Antécédents, allergies, documents (lecture) | ✅ |
| 5 | Consultations | CRUD + ordonnances + changement de statut | ✅ |
| 6 | Rendez-vous | Agenda + disponibilités + statuts | ✅ |
| 7 | Facturation | Factures + lignes + statuts + paiements patients | ✅ |
| 8 | Urgences | Triage, CIMU, admission, sortie | ✅ |
| 9 | Pharmacie | Stock, lots, mouvements, alertes rupture/péremption | ✅ |
| 10 | Laboratoire | Demandes, prélèvements, résultats, validation | ✅ |
| 11 | Hospitalisation | Lits, séjours, notes évolution, soins infirmiers | ✅ |
| 12 | Dashboard | Statistiques temps réel (données réelles) | ✅ |
| 13 | Frontend | 28 pages, composants UI réutilisables | ✅ |
| 14 | Logo/Favicons | Intégrés partout (header, login, PWA) | ✅ |
| 15 | HTTPS | santarex.ibigsoft.com avec cert Let's Encrypt | ✅ |

---

## 3. FONCTIONNALITÉS INCOMPLÈTES OU ABSENTES

| # | Section PM | Manquant | Priorité |
|---|-----------|---------|---------|
| 1 | §5 | Page de vente publique (créée mais non déployée) | HAUTE |
| 2 | §6 | Système de licences SaaS (essai, abonnement, expiration) | CRITIQUE |
| 3 | §7 | Intégration paiements SaaS (CinetPay, Orange Money, etc.) | CRITIQUE |
| 4 | §8 | Emails automatiques (bienvenue, relance, expiration, reçu) | HAUTE |
| 5 | §9 | Console Superadmin IBIG SOFT | CRITIQUE |
| 6 | §9.2 | CRM Prospects | HAUTE |
| 7 | §11 | Assistant IA (page vente + espace authentifié) | MOYENNE |
| 8 | §12 | Guide utilisateur PDF | MOYENNE |
| 9 | §13 | Exports PDF / Excel / CSV | HAUTE |
| 10 | §14 | Multilingue FR/EN | HAUTE |
| 11 | §17 | Rate limiting, Helmet, MFA, journal d'audit | CRITIQUE |
| 12 | §18 | Journal d'audit des actions | HAUTE |
| 13 | §19 | Centre de notifications unifié | MOYENNE |
| 14 | §20 | Import données XLSX/CSV | MOYENNE |
| 15 | §21 | Recherche globale | MOYENNE |
| 16 | §25 | Sauvegardes automatiques configurables | HAUTE |
| 17 | §26 | Pages légales (CGU, politique confidentialité) | HAUTE |
| 18 | §27 | SEO (meta, sitemap, Open Graph) | MOYENNE |
| 19 | §29 | Tests (unitaires, intégration, sécurité) | HAUTE |
| 20 | §30 | Environnement de démonstration | HAUTE |
| 21 | §31 | Onboarding nouvel établissement | HAUTE |

---

## 4. ANOMALIES ET BUGS IDENTIFIÉS

### 🔴 CRITIQUE — Sécurité

| ID | Fichier | Description | Impact |
|----|---------|-------------|--------|
| SEC-01 | `backend/src/database/seed.module.ts` | Endpoint `GET /api/v1/admin/seed` sans authentification | N'importe qui peut réinitialiser toutes les données |
| SEC-02 | `backend/src/auth/auth.service.ts` | Secret JWT avec valeur par défaut hardcodée | Si JWT_SECRET absent, app fonctionne avec clé connue |
| SEC-03 | `.env.prod.example` | Mot de passe DB prod + secrets JWT prod versionnés dans Git | Exposition des credentials de production |
| SEC-04 | `frontend/src/lib/auth.ts` | Tokens stockés en localStorage | Vulnérabilité XSS |
| SEC-05 | `backend/src/main.ts` | Absence de Helmet (headers sécurité HTTP) | Pas de protection CSP, HSTS côté NestJS |
| SEC-06 | Tous les controllers | Absence de rate limiting (@nestjs/throttler) | Brute force sur /auth/login possible |
| SEC-07 | `docker-compose.prod.yml` | Password PostgreSQL prod en clair dans le fichier versionné | Exposition credentials prod |

### 🟠 IMPORTANT — Fonctionnel

| ID | Fichier | Description |
|----|---------|-------------|
| FUNC-01 | `frontend/src/app/(dashboard)/dme/[patientId]/page.tsx` | Ordonnances et analyses en données mock, non connectées à l'API |
| FUNC-02 | `backend/src/config/database.config.ts` | `synchronize: false` en production — migration initiale requiert NODE_ENV=development |
| FUNC-03 | Tous modules | Aucun système de pagination côté frontend (tous les résultats chargés) |
| FUNC-04 | `frontend/src/lib/api.ts` | Aucune gestion de l'expiration du token avec retry automatique |
| FUNC-05 | Redis | Installé mais non utilisé — cache, sessions, queues non implémentés |
| FUNC-06 | MinIO | Stockage fichiers prévu mais non implémenté — documents médicaux sans fichiers réels |
| FUNC-07 | `frontend` | Aucune page 403 (accès refusé) — redirection vers login |
| FUNC-08 | Backend | Aucun mécanisme de sauvegarde automatique |

### 🟡 MOYEN — UX / Design

| ID | Description |
|----|-------------|
| UX-01 | Tableaux sans pagination visible côté frontend |
| UX-02 | Formulaires sans conservation des données en cas d'erreur réseau |
| UX-03 | Aucun état vide explicatif sur les modules à données nulles |
| UX-04 | Pas d'indicateur de chargement sur certaines transitions de page |
| UX-05 | Textes "À implémenter" visibles en placeholder sur certaines sections |
| UX-06 | Caisse (paiements) — interface non reliée visuellement à la facturation |
| UX-07 | Profil utilisateur — modifications non sauvegardées (API manquante) |

---

## 5. RISQUES TECHNIQUES

| Risque | Probabilité | Impact | Mitigation |
|--------|-------------|--------|------------|
| Endpoint seed accessible publiquement | CERTAIN | CRITIQUE | Corriger immédiatement (SEC-01) |
| Brute force sur login | HAUTE | ÉLEVÉ | Ajouter throttler NestJS |
| Fuite de données inter-tenant | FAIBLE | CRITIQUE | Tester les queries avec tenant différent |
| Perte de données (synchronize:false sans migration) | MOYENNE | ÉLEVÉ | Créer un pipeline de migration |
| Dépassement mémoire sur listes non paginées | MOYENNE | MOYEN | Implémenter pagination backend |

---

## 6. ÉCARTS PAR RAPPORT AU CAHIER DES CHARGES

| § PM | Exigence | État actuel |
|------|---------|-------------|
| §5 | Page de vente haute conversion | Créée hors projet, non déployée |
| §6 | Licences et offres SaaS | Absent |
| §7 | Paiements SaaS (CinetPay, etc.) | Absent |
| §8 | 12 séquences d'emails automatiques | Absent |
| §9 | Console Superadmin complète | Absent |
| §11 | Assistant IA | Absent |
| §12 | Guide utilisateur + PDF | Absent |
| §13 | Exports PDF/XLSX/CSV | Absent |
| §14 | Multilingue FR/EN | Absent |
| §15 | Gestion fine des permissions | Partiel (RBAC basique) |
| §17 | Audit sécurité + corrections | Partiel |
| §18 | Journal d'audit complet | Absent |
| §19 | Notifications (app/email/SMS) | Partiel (icône UI seulement) |
| §20 | Import XLSX/CSV | Absent |
| §21 | Recherche globale | Partiel (barre UI sans backend) |
| §25 | Sauvegardes automatiques | Absent |
| §26 | Pages légales | Absent |
| §29 | Tests | Absent (0% couverture) |
| §30 | Environnement démo | Partiel (seed unique) |
| §31 | Onboarding | Absent |

---

## 7. ÉTAT DE L'IDENTITÉ VISUELLE

| Élément | État |
|---------|------|
| Couleur primaire (`#0D47A1`) | ✅ Définie dans tailwind.config.js et globals.css |
| Couleur secondaire/teal (`#00838F`) | ✅ Définie |
| Accent cyan (`#00BCD4`) | ✅ Défini |
| Police Inter | ✅ Via Google Fonts |
| Logo PNG | ✅ Dans /public — header + login |
| Favicon 16/32px | ✅ Générés |
| Apple Touch Icon | ✅ Généré |
| PWA manifest | ✅ Créé |
| Page de connexion | ✅ Logo intégré |
| Header dashboard | ✅ Logo intégré |
| Composants UI cohérents (Badge, Button, Card) | ✅ |
| Design tokens centralisés (CSS vars) | ✅ globals.css |
| Mode sombre | ❌ Absent |
| Emails brandés | ❌ Absent |
| Documents PDF brandés | ❌ Absent |
| Page de vente aux couleurs SANTAREX | ✅ Créée, non déployée |

---

## 8. PLAN D'EXÉCUTION PAR PHASES

### PHASE 1 — SÉCURITÉ CRITIQUE (Immédiat — 1-2 jours)
- [ ] SEC-01 : Protéger l'endpoint seed avec guard + rôle SUPERADMIN
- [ ] SEC-02 : Supprimer les secrets JWT par défaut hardcodés
- [ ] SEC-03 : Retirer .env.prod.example du dépôt Git + .gitignore
- [ ] SEC-04 : Migrer vers httpOnly cookies (access + refresh tokens)
- [ ] SEC-05 : Ajouter Helmet à NestJS main.ts
- [ ] SEC-06 : Installer et configurer @nestjs/throttler (rate limiting)
- [ ] SEC-07 : Sécuriser docker-compose.prod.yml (variables d'env)

### PHASE 2 — FONDATIONS MANQUANTES (3-5 jours)
- [ ] Ajouter entité `tenants` (établissements) + API de gestion
- [ ] Ajouter entité `licences` + moteur de licences SaaS
- [ ] Ajouter entité `offres_saas` + gestion des plans
- [ ] Ajouter entité `audit_logs` + journal d'audit
- [ ] Installer @nestjs-modules/mailer + configurer SMTP
- [ ] Créer les 12 templates d'emails automatiques
- [ ] Ajouter pagination côté backend et frontend

### PHASE 3 — CONSOLE SUPERADMIN (5-7 jours)
- [ ] Module superadmin backend (rôle SUPERADMIN IBIG SOFT)
- [ ] Dashboard global (tenants, licences, revenus, alertes)
- [ ] Gestion des tenants (création, suspension, paramètres)
- [ ] CRM prospects (pipeline configurable)
- [ ] Gestion des licences (activation, suspension, renouvellement)
- [ ] Gestion des offres SaaS (plans, prix, modules inclus)
- [ ] Paramètres éditeur (coordonnées, SMTP, paiements)

### PHASE 4 — EXPÉRIENCE PRODUIT (5-7 jours)
- [ ] Page de vente déployée sur le VPS (route publique dans Next.js)
- [ ] FAQ administrable
- [ ] Exports PDF (factures, ordonnances, résultats labo)
- [ ] Exports XLSX (listes patients, stock, résultats)
- [ ] Recherche globale backend + frontend
- [ ] Onboarding nouvel établissement (wizard multi-étapes)
- [ ] Pages légales (CGU, confidentialité, cookies)
- [ ] SEO (meta, sitemap, Open Graph)

### PHASE 5 — MULTILINGUE + PAIEMENTS (5-7 jours)
- [ ] i18n frontend (next-i18next) + traductions FR/EN
- [ ] i18n backend (messages d'erreur, emails)
- [ ] Intégration CinetPay (paiement SaaS principal)
- [ ] Intégration Orange Money CI
- [ ] Paiement manuel + validation IBIG SOFT
- [ ] Webhooks paiement + activation licence idempotente

### PHASE 6 — ASSISTANCE + GUIDE (3-5 jours)
- [ ] Assistant IA configurable (Groq/Anthropic/OpenAI)
- [ ] Guide utilisateur complet (FR + EN)
- [ ] Export PDF du guide
- [ ] Centre d'aide + tickets support
- [ ] Notifications (app + email)

### PHASE 7 — TESTS + LIVRAISON (3-5 jours)
- [ ] Tests unitaires backend (auth, licences, paiements)
- [ ] Tests d'intégration API
- [ ] Tests sécurité (IDOR, RBAC, isolation tenant)
- [ ] Tests E2E critiques (login, facturation, licence)
- [ ] Environnement démo avec données réalistes
- [ ] Documentation technique complète
- [ ] Déploiement production final

---

## 9. FICHIERS À MODIFIER / CRÉER

### Modifications critiques immédiates
```
backend/src/database/seed.module.ts         — Ajouter guard SUPERADMIN
backend/src/auth/auth.service.ts            — Supprimer secrets par défaut
backend/src/main.ts                         — Ajouter Helmet + Throttler
backend/src/auth/strategies/jwt.strategy.ts — httpOnly cookies
.gitignore                                  — Ajouter .env.prod.example
```

### Nouveaux modules à créer
```
backend/src/superadmin/               — Console IBIG SOFT
backend/src/licences/                 — Moteur de licences SaaS
backend/src/tenants/                  — Gestion établissements
backend/src/mailer/                   — Service emails
backend/src/paiements-saas/           — Paiements abonnements
backend/src/audit/                    — Journal d'audit
frontend/src/app/(superadmin)/        — Interface superadmin
frontend/src/app/(public)/            — Page de vente + pages légales
```

---

## 10. RISQUES DE RÉGRESSION

| Action | Risque |
|--------|--------|
| Migration cookies httpOnly | Breaking change sur le frontend — à coordonner |
| Ajout throttler global | Peut bloquer les appels rapides en dev |
| Migration schéma BDD (entités licences/tenants) | Requiert migration TypeORM propre |
| Ajout guard sur SeedController | Bloque le seed — prévoir commande CLI alternative |

---

## 11. STATUT FINAL DE CHAQUE INTERVENTION

*Ce tableau sera mis à jour à chaque correction.*

| ID | Section PM | Description | Statut | Date |
|----|-----------|-------------|--------|------|
| P1-01 | §17 | Protéger endpoint seed | 🔴 À faire | — |
| P1-02 | §17 | Supprimer secrets JWT par défaut | 🔴 À faire | — |
| P1-03 | §17 | Retirer .env.prod.example du dépôt | 🔴 À faire | — |
| P1-04 | §17 | Migrer tokens vers httpOnly cookies | 🔴 À faire | — |
| P1-05 | §17 | Ajouter Helmet | 🔴 À faire | — |
| P1-06 | §17 | Ajouter rate limiting | 🔴 À faire | — |
| ... | ... | ... | ... | — |
