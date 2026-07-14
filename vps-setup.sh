#!/usr/bin/env bash
# =============================================================
# SANTAREX ERP — Configuration initiale du VPS (à exécuter UNE SEULE FOIS)
# À copier sur le VPS et exécuter avec : bash vps-setup.sh
# =============================================================
set -e

DOMAIN="santarex.ibigsoft.com"
EMAIL="contact@ibigsoft.com"
APP_DIR="/opt/santarex-erp"

echo "====================================================="
echo "  SANTAREX ERP — Setup VPS"
echo "  Domaine : $DOMAIN"
echo "====================================================="

# 1. Mise à jour système
echo "[1/7] Mise à jour du système..."
apt-get update -qq && apt-get upgrade -y -qq

# 2. Docker
echo "[2/7] Installation Docker..."
if ! command -v docker &>/dev/null; then
  curl -fsSL https://get.docker.com | sh
  systemctl enable docker
  systemctl start docker
  echo "  ✓ Docker installé"
else
  echo "  → Docker déjà présent : $(docker --version)"
fi

# 3. Nginx
echo "[3/7] Installation Nginx..."
if ! command -v nginx &>/dev/null; then
  apt-get install -y nginx
  systemctl enable nginx
  echo "  ✓ Nginx installé"
else
  echo "  → Nginx déjà présent"
fi

# 4. Certbot (SSL)
echo "[4/7] Installation Certbot..."
if ! command -v certbot &>/dev/null; then
  apt-get install -y certbot python3-certbot-nginx
  echo "  ✓ Certbot installé"
else
  echo "  → Certbot déjà présent"
fi

# 5. Configuration Nginx
echo "[5/7] Configuration Nginx pour $DOMAIN..."
cat > /etc/nginx/sites-available/santarex << NGINX_CONF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 50M;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;

    # API backend (NestJS sur port 3002)
    location /api/ {
        proxy_pass http://127.0.0.1:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 120s;
    }

    # Frontend Next.js (port 3003)
    location / {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINX_CONF

ln -sf /etc/nginx/sites-available/santarex /etc/nginx/sites-enabled/santarex
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
echo "  ✓ Nginx configuré (HTTP)"

# 6. Certificat SSL
echo "[6/7] Génération du certificat SSL Let's Encrypt..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" --redirect 2>/dev/null || \
  echo "  ⚠  SSL non configuré (vérifiez que le domaine pointe vers ce serveur)"

# 7. Dossier app
echo "[7/7] Préparation du répertoire $APP_DIR..."
mkdir -p "$APP_DIR"
echo "  ✓ Répertoire créé"

echo ""
echo "====================================================="
echo "  ✅  Setup VPS terminé"
echo ""
echo "  Étapes suivantes :"
echo "  1. Créer /opt/santarex-erp/.env.prod (voir backend/.env.example)"
echo "  2. Lancer le déploiement : ./deploy.sh (depuis votre machine locale)"
echo "====================================================="
