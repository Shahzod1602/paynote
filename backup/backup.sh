#!/bin/sh
# Kunlik: pg_dump -> gzip -> storage.identify.uz (storagedb Storage API).
# Retention "aylanma nomlar" bilan: storagedb'da obyekt ro'yxati endpoint'i yo'q,
# lekin yuklash upsert (ustiga yozadi). Shuning uchun nomlarni qayta ishlatamiz:
#   latest.sql.gz            — har doim eng so'nggi (restore uchun qulay)
#   daily/<Mon..Sun>.sql.gz  — 7 kunlik aylanma
#   monthly/<01..12>.sql.gz  — har oyning 1-kuni, 12 oylik aylanma
set -eu

# Cron minimal env bilan ishlaganga, env'ni fayldan tiklaymiz.
if [ -f /app/env.list ]; then
  while IFS='=' read -r k v; do export "$k=$v" 2>/dev/null || true; done < /app/env.list
fi

: "${POSTGRES_HOST:=db}"
: "${POSTGRES_DB:=paynote}"
: "${POSTGRES_USER:=paynote}"
: "${STORAGE_BUCKET:=paynote-backups}"

ts() { date -u '+%F %T'; }

if [ -z "${STORAGE_API_URL:-}" ] || [ -z "${STORAGE_SERVICE_KEY:-}" ]; then
  echo "[backup] $(ts) SKIP — STORAGE_API_URL / STORAGE_SERVICE_KEY sozlanmagan"
  exit 0
fi

TMP="/tmp/paynote-dump.sql.gz"
echo "[backup] $(ts) start — pg_dump ${POSTGRES_DB}@${POSTGRES_HOST}"

# pg_dump xato bersa, gzip baribir 0 qaytarishi mumkin — quyida hajmni tekshiramiz.
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump \
  -h "$POSTGRES_HOST" -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  --no-owner --no-privileges --clean --if-exists \
  | gzip -9 > "$TMP"

SIZE=$(wc -c < "$TMP")
if [ "$SIZE" -lt 100 ]; then
  echo "[backup] $(ts) XATO — dump juda kichik (${SIZE} bayt). To'xtatildi."
  rm -f "$TMP"
  exit 1
fi
echo "[backup] dump tayyor — ${SIZE} bayt"

upload() { # $1 = bucket ichidagi obyekt yo'li
  if curl -fsS -X POST "$STORAGE_API_URL/storage/v1/object/$STORAGE_BUCKET/$1" \
       -H "Authorization: Bearer $STORAGE_SERVICE_KEY" \
       -H "apikey: $STORAGE_SERVICE_KEY" \
       -H "Content-Type: application/gzip" \
       --data-binary "@$TMP" -o /dev/null; then
    echo "[backup] yuklandi -> $1"
  else
    echo "[backup] XATO yuklashda -> $1"
    return 1
  fi
}

DOW=$(date -u +%a)   # Mon..Sun
upload "latest.sql.gz"
upload "daily/${DOW}.sql.gz"
if [ "$(date -u +%d)" = "01" ]; then
  upload "monthly/$(date -u +%m).sql.gz"
fi

rm -f "$TMP"
echo "[backup] $(ts) tugadi"
