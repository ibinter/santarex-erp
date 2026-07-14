#!/usr/bin/env bash
# =============================================================
# SANTAREX ERP — Script de déploiement vers le VPS de production
# Usage : ./deploy.sh
# Prérequis : SSH configuré vers 185.98.139.38
# =============================================================
set -e

VPS_HOST="185.98.139.38"
VPS_USER="root"
APP_DIR="/opt/santarex-erp"
REPO_URL="https://github.com/ibinter/santarex-erp.git"
BRANCH="main"

echo "====================================================="
echo "  SANTAREX ERP — Déploiement production"
echo "  VPS : $VPS_HOST"
echo "  Branche : $BRANCH"
echo "====================================================="
echo ""

# Confirmation
read -p "Confirmer le déploiement ? (oui/non) : " CONFIRM
if [[ "$CONFIRM" != "oui" ]]; then
  echo "Déploiement annulé."
  exit 0
fi

echo ""
echo "[1/6] Connexion au VPS et mise à jour du code..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
set -e
APP_DIR="/opt/santarex-erp"
BRANCH="main"

# Cloner si premier déploiement
if [ ! -d "$APP_DIR/.git" ]; then
  echo "  → Premier déploiement : clonage du dépôt..."
  mkdir -p "$APP_DIR"
  cd /opt
  git clone https://github.com/ibinter/santarex-erp.git santarex-erp
  echo "  ✓ Dépôt cloné"
else
  echo "  → Mise à jour du dépôt..."
  cd "$APP_DIR"
  git fetch origin
  git checkout "$BRANCH"
  git pull origin "$BRANCH"
  echo "  ✓ Code mis à jour : $(git log -1 --oneline)"
fi
REMOTE

echo "[2/6] Vérification du fichier .env.prod sur le VPS..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
APP_DIR="/opt/santarex-erp"
if [ ! -f "$APP_DIR/.env.prod" ]; then
  echo ""
  echo "  ⚠  ATTENTION : $APP_DIR/.env.prod introuvable !"
  echo "  Créez ce fichier sur le VPS avant de continuer."
  echo "  Modèle : $APP_DIR/backend/.env.example"
  exit 1
fi
echo "  ✓ .env.prod présent"
REMOTE

echo "[3/6] Arrêt des conteneurs existants..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
cd /opt/santarex-erp
if docker compose -f docker-compose.prod.yml ps 2>/dev/null | grep -q "Up"; then
  docker compose -f docker-compose.prod.yml down --remove-orphans
  echo "  ✓ Conteneurs arrêtés"
else
  echo "  → Aucun conteneur en cours (premier déploiement)"
fi
REMOTE

echo "[4/6] Build et démarrage des conteneurs Docker..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
cd /opt/santarex-erp
docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
echo "  ✓ Conteneurs démarrés"
REMOTE

echo "[5/6] Attente que le backend soit prêt (max 60s)..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
for i in $(seq 1 12); do
  if curl -sf http://127.0.0.1:3002/api/v1/health > /dev/null 2>&1; then
    echo "  ✓ Backend opérationnel"
    break
  fi
  echo "  ... tentative $i/12"
  sleep 5
done
REMOTE

echo "[6/6] Initialisation de la base de données (seed si nécessaire)..."
ssh "$VPS_USER@$VPS_HOST" bash << 'REMOTE'
cd /opt/santarex-erp
# Lancer le seed uniquement s'il n'y a pas encore de tenants
TENANT_COUNT=$(docker compose -f docker-compose.prod.yml exec -T backend \
  node -e "
    const { DataSource } = require('typeorm');
    const ds = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: 5432,
      username: process.env.DB_USER || 'santarex',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'santarex_db',
    });
    ds.initialize().then(() => ds.query('SELECT COUNT(*) FROM tenants')).then(r => { console.log(r[0].count); ds.destroy(); }).catch(() => { console.log('0'); process.exit(0); });
  " 2>/dev/null || echo "0")

if [ "$TENANT_COUNT" = "0" ] || [ "$TENANT_COUNT" = "" ]; then
  echo "  → Exécution du seed initial..."
  docker compose -f docker-compose.prod.yml exec -T backend node dist/seeds/run-seed.js 2>/dev/null || \
  docker compose -f docker-compose.prod.yml exec -T backend npm run seed 2>/dev/null || \
  echo "  ⚠  Seed non disponible — à lancer manuellement si nécessaire"
else
  echo "  → Base de données déjà initialisée ($TENANT_COUNT tenant(s))"
fi
REMOTE

echo ""
echo "====================================================="
echo "  ✅  DÉPLOIEMENT TERMINÉ"
echo "====================================================="
echo ""
echo "  🌐  Application : https://santarex.ibigsoft.com"
echo "  📚  API Docs    : https://santarex.ibigsoft.com/api/docs"
echo "  👤  Admin       : admin@clinique-saint-joseph.ci"
echo "  🔑  Mot de passe: Admin2025!"
echo ""
echo "  Logs backend  : ssh $VPS_USER@$VPS_HOST 'docker logs santarex_backend -f'"
echo "  Logs frontend : ssh $VPS_USER@$VPS_HOST 'docker logs santarex_frontend -f'"
echo ""
