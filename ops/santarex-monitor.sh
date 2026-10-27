#!/usr/bin/env bash
# =============================================================================
# SANTAREX ERP — Surveillance du site (à installer sur le VPS, exécutée chaque minute)
#
#  Vérifie : site web, API + base de données, conteneurs Docker, base PostgreSQL,
#  démo, espace disque, fraîcheur de la sauvegarde, certificat HTTPS.
#  Alerte (e-mail, et notification téléphone optionnelle) seulement quand un
#  problème dure 2 minutes de suite, puis envoie « rétabli » à la reprise.
#  Pas de spam : une alerte par panne, pas une par minute.
#
#  Installation :  cp /opt/santarex/ops/santarex-monitor.sh /usr/local/bin/ && chmod +x ...
#  Test d'alerte :  santarex-monitor.sh test
#  Voir sans alerter :  DRY_RUN=1 santarex-monitor.sh
# =============================================================================
set -u

CONF=/etc/santarex-monitor.conf
[ -f "$CONF" ] && . "$CONF"

ALERT_TO="${ALERT_TO:-patriceky1er@gmail.com}"   # destinataire des alertes
NTFY_TOPIC="${NTFY_TOPIC:-}"                      # optionnel : sujet ntfy.sh (alerte sur téléphone)
ENV_FILE="${ENV_FILE:-/opt/santarex/.env.prod}"
SITE="${SITE:-https://santarex.ibigsoft.com}"
DEMO="${DEMO:-https://demo.santarex.ibigsoft.com}"
BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
STATE_DIR="${STATE_DIR:-/var/lib/santarex-monitor}"
LOG="${LOG:-/var/log/santarex-monitor.log}"
FAILS_BEFORE_ALERT="${FAILS_BEFORE_ALERT:-2}"
DRY_RUN="${DRY_RUN:-0}"

mkdir -p "$STATE_DIR" 2>/dev/null || { STATE_DIR=/tmp/santarex-monitor; mkdir -p "$STATE_DIR"; }
# Un seul exemplaire à la fois (verrou facultatif : absent = on continue).
if command -v flock >/dev/null 2>&1; then exec 9>"$STATE_DIR/.lock"; flock -n 9 || exit 0; fi

log() { echo "$(date '+%F %T') $*" >> "$LOG" 2>/dev/null; }

# ── envoi d'alerte ───────────────────────────────────────────────────────────
env_val() { grep -E "^$1=" "$ENV_FILE" 2>/dev/null | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//"; }

envoyer() {  # $1 = sujet (ASCII), $2 = corps
  local sujet="$1" corps="$2"
  log "ALERTE: $sujet — $corps"
  [ "$DRY_RUN" = "1" ] && { echo "[DRY_RUN] $sujet : $corps"; return; }

  local host port user pass from secure proto tmp
  host=$(env_val SMTP_HOST); port=$(env_val SMTP_PORT); user=$(env_val SMTP_USER)
  pass=$(env_val SMTP_PASS); from=$(env_val SMTP_FROM); secure=$(env_val SMTP_SECURE)
  : "${port:=587}"; : "${from:=$user}"
  if [ -n "$host" ] && [ -n "$user" ] && [ -n "$pass" ]; then
    tmp=$(mktemp)
    {
      echo "From: SANTAREX Surveillance <$from>"
      echo "To: $ALERT_TO"
      echo "Subject: $sujet"
      echo "Content-Type: text/plain; charset=UTF-8"
      echo
      echo "$corps"
      echo
      echo "Serveur : $(hostname) — $(date '+%F %T')"
    } > "$tmp"
    if [ "$secure" = "true" ] || [ "$port" = "465" ]; then proto="smtps"; else proto="smtp"; fi
    local err
    if [ "$proto" = "smtp" ]; then
      err=$(curl -sS --max-time 30 --ssl-reqd "smtp://$host:$port" --mail-from "$from" --mail-rcpt "$ALERT_TO" \
        --user "$user:$pass" -T "$tmp" 2>&1 >/dev/null) || log "échec envoi e-mail (smtp $host:$port) : $(echo "$err" | tail -1)"
    else
      err=$(curl -sS --max-time 30 "smtps://$host:$port" --mail-from "$from" --mail-rcpt "$ALERT_TO" \
        --user "$user:$pass" -T "$tmp" 2>&1 >/dev/null) || log "échec envoi e-mail (smtps $host:$port) : $(echo "$err" | tail -1)"
    fi
    rm -f "$tmp"
  else
    log "e-mail non envoyé : SMTP_* absents de $ENV_FILE"
  fi
  if [ -n "$NTFY_TOPIC" ]; then
    curl -s --max-time 15 -H "Title: $sujet" -H "Priority: high" -d "$corps" "https://ntfy.sh/$NTFY_TOPIC" >/dev/null 2>&1
  fi
}

# ── machine d'état : alerte après N échecs consécutifs, « rétabli » à la reprise ─
verifier() {  # $1 = nom, $2 = "ok" ou "ko", $3 = détail
  local nom="$1" etat="$2" detail="$3"
  local f="$STATE_DIR/$nom.fails" a="$STATE_DIR/$nom.alerted" n
  if [ "$etat" = "ok" ]; then
    if [ -f "$a" ]; then
      envoyer "[SANTAREX] RETABLI : $nom" "Le contrôle « $nom » est revenu à la normale. $detail"
      rm -f "$a"
    fi
    rm -f "$f"
    [ "$DRY_RUN" = "1" ] && echo "OK    $nom  $detail"
  else
    n=$(( $(cat "$f" 2>/dev/null || echo 0) + 1 ))
    echo "$n" > "$f"
    [ "$DRY_RUN" = "1" ] && echo "PANNE $nom  $detail"
    if [ "$n" -ge "$FAILS_BEFORE_ALERT" ] && [ ! -f "$a" ]; then
      envoyer "[SANTAREX] ALERTE : $nom" "Problème détecté sur « $nom » depuis ~$n minute(s). $detail"
      touch "$a"
    fi
  fi
}

# ── mode test ────────────────────────────────────────────────────────────────
if [ "${1:-}" = "test" ]; then
  DRY_RUN=0
  envoyer "[SANTAREX] TEST de surveillance" "Si vous recevez ce message, les alertes fonctionnent."
  echo "Alerte de test envoyée à $ALERT_TO (voir $LOG si rien n'arrive)."
  exit 0
fi

# ── 1. Site web ──────────────────────────────────────────────────────────────
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$SITE/")
[ "$code" = "200" ] && verifier "site-web" ok "HTTP $code" || verifier "site-web" ko "$SITE/ répond HTTP $code (attendu 200)"

# ── 2. API + base de données (health réel : teste la base) ───────────────────
rep=$(curl -s -w '\n%{http_code}' --max-time 20 "$SITE/api/v1/health")
code=$(echo "$rep" | tail -1); corps=$(echo "$rep" | head -n -1)
if [ "$code" = "200" ] && echo "$corps" | grep -q '"status":"ok"'; then
  verifier "api-et-base" ok "HTTP $code, statut ok"
else
  verifier "api-et-base" ko "/api/v1/health : HTTP $code ; réponse : $(echo "$corps" | head -c 160)"
fi

# ── 3. Conteneurs de production ──────────────────────────────────────────────
if command -v docker >/dev/null 2>&1; then
  arret=""
  for c in santarex_backend santarex_frontend santarex_postgres santarex_redis; do
    [ "$(docker inspect -f '{{.State.Running}}' "$c" 2>/dev/null)" = "true" ] || arret="$arret $c"
  done
  [ -z "$arret" ] && verifier "conteneurs" ok "4/4 en marche" || verifier "conteneurs" ko "arrêtés :$arret"

  # ── 4. PostgreSQL directement ──────────────────────────────────────────────
  if docker exec santarex_postgres pg_isready -U santarex >/dev/null 2>&1; then
    verifier "postgresql" ok "accepte les connexions"
  else
    verifier "postgresql" ko "pg_isready échoue sur santarex_postgres"
  fi
fi

# ── 5. Démo (importance moindre) ─────────────────────────────────────────────
code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 20 "$DEMO/api/v1/health")
[ "$code" = "200" ] && verifier "demo" ok "HTTP $code" || verifier "demo" ko "démo HTTP $code (les prospects ne peuvent pas l'essayer)"

# ── 6. Espace disque ─────────────────────────────────────────────────────────
use=$(df -P / 2>/dev/null | awk 'NR==2 {gsub("%","",$5); print $5}')
case "$use" in
  ''|*[!0-9]*) ;;   # valeur illisible : on ne déclenche pas de fausse alerte
  *) [ "$use" -lt 90 ] && verifier "disque" ok "${use}% utilisé" || verifier "disque" ko "disque rempli à ${use}% (seuil 90%)" ;;
esac

# ── 7. Sauvegarde récente (moins de 26 h) ────────────────────────────────────
dernier=$(ls -t "$BACKUP_DIR"/santarex-*.dump 2>/dev/null | head -1)
if [ -n "$dernier" ] && [ -n "$(find "$dernier" -mmin -1560 2>/dev/null)" ]; then
  verifier "sauvegarde" ok "$(basename "$dernier")"
else
  verifier "sauvegarde" ko "aucune sauvegarde de moins de 26 h dans $BACKUP_DIR (dernière : ${dernier:-aucune})"
fi

# ── 8. Certificat HTTPS (plus de 10 jours) ───────────────────────────────────
host=$(echo "$SITE" | sed -e 's#https\?://##' -e 's#/.*##')
fin=$(echo | openssl s_client -servername "$host" -connect "$host:443" 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
if [ -n "$fin" ]; then
  jours=$(( ( $(date -d "$fin" +%s) - $(date +%s) ) / 86400 ))
  [ "$jours" -gt 10 ] && verifier "certificat-https" ok "expire dans $jours jours" || verifier "certificat-https" ko "le certificat HTTPS expire dans $jours jours"
fi

exit 0
