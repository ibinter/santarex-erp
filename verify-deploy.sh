#!/usr/bin/env bash
# Vérifie que le déploiement est opérationnel
set -e

VPS_HOST="185.98.139.38"
VPS_USER="root"
BASE_URL="https://santarex.ibigsoft.com"

echo "====================================================="
echo "  SANTAREX ERP — Vérification post-déploiement"
echo "====================================================="
echo ""

OK=0
FAIL=0

check() {
  local name="$1"
  local url="$2"
  local expected="$3"
  if curl -sf --max-time 10 "$url" | grep -q "$expected" 2>/dev/null; then
    echo "  ✅  $name"
    OK=$((OK+1))
  else
    echo "  ❌  $name — $url"
    FAIL=$((FAIL+1))
  fi
}

# Frontend
check "Page d'accueil (landing)"     "$BASE_URL"                     "SANTAREX"
check "Page de connexion"             "$BASE_URL/auth/login"          "Connexion"

# API
check "Health check API"             "$BASE_URL/api/v1/health"       ""
check "Swagger docs accessible"      "$BASE_URL/api/docs"            "swagger"

echo ""
echo "  Conteneurs sur le VPS :"
ssh "$VPS_USER@$VPS_HOST" "docker ps --format '  {{.Names}}\t{{.Status}}' | grep santarex" 2>/dev/null || echo "  (impossible de se connecter au VPS)"

echo ""
echo "  Utilisation disque :"
ssh "$VPS_USER@$VPS_HOST" "df -h /opt 2>/dev/null | tail -1" 2>/dev/null || true

echo ""
echo "====================================================="
if [ "$FAIL" -eq 0 ]; then
  echo "  ✅  Tous les checks passent ($OK/$((OK+FAIL)))"
else
  echo "  ⚠   $FAIL check(s) en échec, $OK/$((OK+FAIL)) OK"
  echo "  Consultez les logs : ssh $VPS_USER@$VPS_HOST 'docker logs santarex_backend --tail 50'"
fi
echo "====================================================="
