# SANTAREX ERP

ERP hospitalier SaaS pour l'Afrique — développé par **IBIG SOFT**

---

## Prérequis

- Node.js 20+
- Docker & Docker Compose
- npm 10+

---

## Installation rapide

```bash
# 1. Cloner le dépôt
git clone <url-du-repo>
cd santarex-erp

# 2. Configurer les variables d'environnement
cp .env.example .env
# Editer .env avec vos valeurs

# 3. Démarrer les services Docker (PostgreSQL, Redis, Elasticsearch, MinIO, Nginx)
npm run docker:up

# 4. Installer les dépendances
npm install

# 5. Lancer le projet en mode développement
npm run dev
```

---

## Structure du projet

```
santarex-erp/
├── frontend/               # Application Next.js (React 18)
│   ├── src/
│   │   ├── app/            # App Router Next.js 14
│   │   ├── components/     # Composants UI réutilisables
│   │   ├── lib/            # Utilitaires et helpers
│   │   └── hooks/          # React hooks personnalisés
│   └── package.json
│
├── backend/                # API NestJS
│   ├── src/
│   │   ├── modules/        # Modules métier (patients, consultations, etc.)
│   │   ├── common/         # Guards, interceptors, decorators
│   │   ├── config/         # Configuration de l'application
│   │   └── main.ts
│   └── package.json
│
├── nginx/
│   └── nginx.conf          # Configuration reverse proxy
│
├── docker-compose.yml      # Services Docker
├── .env.example            # Template des variables d'environnement
├── package.json            # Workspace racine
└── README.md
```

---

## Ports utilisés

| Service           | Port  | Description                        |
|-------------------|-------|------------------------------------|
| Frontend (Next.js)| 3000  | Interface utilisateur               |
| Backend (NestJS)  | 3001  | API REST                           |
| PostgreSQL        | 5432  | Base de données principale         |
| Redis             | 6379  | Cache & sessions                   |
| Elasticsearch     | 9200  | Recherche full-text                |
| MinIO API         | 9000  | Stockage d'objets (fichiers)       |
| MinIO Console     | 9001  | Interface admin MinIO              |
| Nginx             | 80    | Reverse proxy (HTTP)               |
| Nginx             | 443   | Reverse proxy (HTTPS)              |

---

## Liens utiles (en développement)

| Ressource           | URL                                    |
|---------------------|----------------------------------------|
| Application         | http://localhost:3000                  |
| API REST            | http://localhost:3001/api/v1           |
| Swagger / API Docs  | http://localhost:3001/api-docs         |
| MinIO Console       | http://localhost:9001                  |
| Elasticsearch       | http://localhost:9200                  |

---

## Commandes Docker

```bash
# Démarrer tous les services
npm run docker:up

# Arrêter tous les services
npm run docker:down

# Voir les logs en temps réel
npm run docker:logs
```

---

## Développement

```bash
# Backend uniquement
npm run dev:backend

# Frontend uniquement
npm run dev:frontend

# Les deux en parallèle
npm run dev
```

---

## Production (build)

```bash
npm run build
```

---

## Modules principaux

- Gestion des patients (dossiers médicaux)
- Consultations & prescriptions
- Hospitalisation & lits
- Pharmacie & inventaire
- Facturation & caisse
- Ressources humaines
- Rapports & statistiques
- Multi-tenant (plusieurs établissements)

---

## Licence

Propriétaire — IBIG SOFT. Tous droits réservés.
