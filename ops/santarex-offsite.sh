#!/bin/bash
# SANTAREX — copie CHIFFRÉE de la dernière sauvegarde vers Google Drive (hors du VPS).
#
# Lancé chaque nuit par cron, après santarex-backup.sh (2h40) :
#   /etc/cron.d/santarex-offsite   →   10 3 * * * root /opt/santarex/ops/santarex-offsite.sh
#
# Principe : /opt/backups/santarex-*.dump  →  chiffrement AES-256 (clé = fichier
# passphrase, jamais envoyé)  →  rclone  →  Google Drive. Google ne voit qu'un
# fichier illisible. Garde 30 jours côté Drive.
#
# Restauration (sur n'importe quelle machine, avec la passphrase) :
#   rclone copyto gdrive:santarex-backups/<fichier>.dump.enc ./sauvegarde.dump.enc
#   openssl enc -d -aes-256-cbc -pbkdf2 -pass file:PASSPHRASE -in sauvegarde.dump.enc -out sauvegarde.dump
#   pg_restore -U santarex -d santarex_db --clean sauvegarde.dump

set -u

BACKUP_DIR="${BACKUP_DIR:-/opt/backups}"
REMOTE="${REMOTE:-gdrive:santarex-backups}"
PASS_FILE="${PASS_FILE:-/root/.santarex-backup-pass}"
GARDER_JOURS="${GARDER_JOURS:-30}"
STATE_DIR="${STATE_DIR:-/var/lib/santarex-monitor}"
LOG="${LOG:-/var/log/santarex-offsite.log}"

log() { echo "$(date '+%F %T') $*" >> "$LOG" 2>/dev/null; echo "$*"; }
echec() { log "ECHEC : $*"; exit 1; }

command -v rclone >/dev/null 2>&1 || echec "rclone n'est pas installé"
command -v openssl >/dev/null 2>&1 || echec "openssl n'est pas installé"
[ -s "$PASS_FILE" ] || echec "passphrase absente ou vide : $PASS_FILE"
rclone listremotes 2>/dev/null | grep -q "^${REMOTE%%:*}:" || echec "la destination ${REMOTE%%:*} n'est pas configurée dans rclone"

dernier=$(ls -t "$BACKUP_DIR"/santarex-*.dump 2>/dev/null | head -1)
[ -n "$dernier" ] || echec "aucune sauvegarde trouvée dans $BACKUP_DIR"
# Une sauvegarde de plus de 26 h veut dire que la sauvegarde elle-même est en panne : on ne la recopie pas en silence.
[ -n "$(find "$dernier" -mmin -1560 2>/dev/null)" ] || echec "la dernière sauvegarde ($(basename "$dernier")) a plus de 26 h"

nom="$(basename "$dernier").enc"
tmp=$(mktemp "/tmp/santarex-offsite.XXXXXX") || echec "impossible de créer un fichier temporaire"
trap 'rm -f "$tmp"' EXIT

openssl enc -aes-256-cbc -pbkdf2 -salt -pass "file:$PASS_FILE" -in "$dernier" -out "$tmp" || echec "chiffrement impossible"
taille=$(stat -c %s "$tmp" 2>/dev/null || echo 0)
[ "$taille" -gt 1024 ] || echec "fichier chiffré anormalement petit ($taille octets)"

rclone copyto "$tmp" "$REMOTE/$nom" || echec "envoi vers $REMOTE impossible"

# Vérifie que Drive possède bien un fichier de la même taille.
distant=$(rclone lsl "$REMOTE/$nom" 2>/dev/null | awk '{print $1}' | head -1)
[ "$distant" = "$taille" ] || echec "taille distante ($distant) différente de la taille locale ($taille)"

# Rotation : supprime côté Drive ce qui a plus de N jours.
rclone delete "$REMOTE" --min-age "${GARDER_JOURS}d" >/dev/null 2>&1

mkdir -p "$STATE_DIR" 2>/dev/null && date '+%F %T' > "$STATE_DIR/offsite.ok"
log "OK : $nom ($taille octets) copié vers $REMOTE"
exit 0
