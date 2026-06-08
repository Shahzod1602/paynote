#!/bin/sh
set -e

# Cron job'lar minimal env bilan ishlaydi — shu sababli konteyner env'ini
# faylga saqlaymiz, backup.sh/restore.sh uni o'qiydi.
printenv > /app/env.list

SCHED="${BACKUP_SCHEDULE:-0 3 * * *}"
mkdir -p /etc/crontabs
echo "$SCHED /app/backup.sh >> /var/log/backup.log 2>&1" > /etc/crontabs/root

echo "[backup] sidecar tayyor — jadval: $SCHED (UTC)"
echo "[backup] maqsad: ${STORAGE_API_URL:-<sozlanmagan>} / bucket=${STORAGE_BUCKET:-paynote-backups}"

# Cron job loglarini konteyner stdout'iga oqizamiz (docker compose logs backup).
touch /var/log/backup.log
tail -F /var/log/backup.log &

# busybox crond — crontab katalogini aniq ko'rsatamiz (alpine'da ishonchli).
exec busybox crond -f -l 8 -c /etc/crontabs
