# Backup sidecar: pg_dump (db bilan bir xil PG17) + curl orqali storage.identify.uz ga yuklaydi.
FROM postgres:17-alpine

RUN apk add --no-cache curl ca-certificates tzdata

WORKDIR /app
COPY entrypoint.sh backup.sh restore.sh /app/
RUN chmod +x /app/entrypoint.sh /app/backup.sh /app/restore.sh

ENTRYPOINT ["/app/entrypoint.sh"]
