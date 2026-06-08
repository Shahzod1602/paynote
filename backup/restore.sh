#!/bin/sh
# Tiklash: storage.identify.uz'dan dump'ni yuklab olib, joriy bazaga qo'llaydi.
# DIQQAT: joriy ma'lumotlar ustiga yoziladi (dump --clean --if-exists bilan).
#
# Ishlatish (serverda):
#   docker compose exec backup /app/restore.sh                 # latest.sql.gz
#   docker compose exec backup /app/restore.sh daily/Mon.sql.gz
#   docker compose exec backup /app/restore.sh monthly/06.sql.gz
set -eu

if [ -f /app/env.list ]; then
  while IFS='=' read -r k v; do export "$k=$v" 2>/dev/null || true; done < /app/env.list
fi

: "${POSTGRES_HOST:=db}"
: "${POSTGRES_DB:=paynote}"
: "${POSTGRES_USER:=paynote}"
: "${STORAGE_BUCKET:=paynote-backups}"

OBJ="${1:-latest.sql.gz}"

if [ -z "${STORAGE_API_URL:-}" ] || [ -z "${STORAGE_SERVICE_KEY:-}" ]; then
  echo "[restore] XATO — STORAGE_API_URL / STORAGE_SERVICE_KEY sozlanmagan"
  exit 1
fi

echo "[restore] DIQQAT: '${OBJ}' bilan joriy baza (${POSTGRES_DB}) ustiga yoziladi"
curl -fsS "$STORAGE_API_URL/storage/v1/object/$STORAGE_BUCKET/$OBJ" \
  -H "Authorization: Bearer $STORAGE_SERVICE_KEY" \
  -H "apikey: $STORAGE_SERVICE_KEY" \
  -o /tmp/restore.sql.gz

gunzip -f /tmp/restore.sql.gz
PGPASSWORD="$POSTGRES_PASSWORD" psql \
  -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  -v ON_ERROR_STOP=1 -f /tmp/restore.sql
rm -f /tmp/restore.sql

echo "[restore] tugadi — ${OBJ} tiklandi"
