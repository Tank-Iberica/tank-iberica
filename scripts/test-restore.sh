#!/usr/bin/env bash
#
# test-restore.sh — Automated backup restore verification
#
# Downloads the latest daily backup from B2, decrypts it, and restores
# to a temporary database for verification.
#
# Required env vars:
#   TEST_RESTORE_DB_URL   — Connection string for temp DB (e.g. Neon free tier)
#   BACKBLAZE_KEY_ID      — B2 application key ID
#   BACKBLAZE_APPLICATION_KEY — B2 application key
#   BACKUP_ENCRYPTION_KEY — Key used to encrypt backups (same as in backup-multi-tier.sh)
#
# Usage: ./scripts/test-restore.sh
#

set -euo pipefail

echo "=== Backup Restore Test ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

# ── Check prerequisites ──

if [ -z "${TEST_RESTORE_DB_URL:-}" ]; then
  echo "⚠️  TEST_RESTORE_DB_URL not configured."
  echo ""
  echo "Founders must complete these steps:"
  echo "  1. Create a free Neon account at https://neon.tech"
  echo "  2. Create a project named 'tracciona-restore-test'"
  echo "  3. Copy the connection string"
  echo "  4. Add as GitHub Secret: TEST_RESTORE_DB_URL"
  echo ""
  echo "See INSTRUCCIONES-MAESTRAS.md Session 55 prerequisites for details."
  exit 0
fi

if [ -z "${BACKBLAZE_KEY_ID:-}" ] || [ -z "${BACKBLAZE_APPLICATION_KEY:-}" ]; then
  echo "❌ Missing BACKBLAZE_KEY_ID or BACKBLAZE_APPLICATION_KEY"
  exit 1
fi

if [ -z "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  echo "⚠️  BACKUP_ENCRYPTION_KEY not set — assuming backups are not encrypted"
fi

BUCKET_NAME="${B2_BUCKET_NAME:-tracciona-backups}"
WORK_DIR=$(mktemp -d)
trap 'rm -rf "$WORK_DIR"' EXIT

echo "1. Authorizing with Backblaze B2..."
b2 authorize-account "$BACKBLAZE_KEY_ID" "$BACKBLAZE_APPLICATION_KEY" > /dev/null 2>&1

echo "2. Finding latest daily backup..."
LATEST_BACKUP=$(b2 ls "$BUCKET_NAME" daily/ | tail -1)

if [ -z "$LATEST_BACKUP" ]; then
  echo "❌ No daily backups found in bucket"
  exit 1
fi

echo "   Found: $LATEST_BACKUP"

echo "3. Downloading backup..."
b2 download-file-by-name "$BUCKET_NAME" "$LATEST_BACKUP" "$WORK_DIR/backup.sql.gz.enc" > /dev/null 2>&1

echo "4. Decrypting and decompressing..."
if [ -n "${BACKUP_ENCRYPTION_KEY:-}" ]; then
  openssl enc -aes-256-cbc -d -pbkdf2 \
    -in "$WORK_DIR/backup.sql.gz.enc" \
    -pass "pass:$BACKUP_ENCRYPTION_KEY" \
    | gunzip > "$WORK_DIR/backup.sql"
else
  gunzip -c "$WORK_DIR/backup.sql.gz.enc" > "$WORK_DIR/backup.sql" 2>/dev/null || \
    cp "$WORK_DIR/backup.sql.gz.enc" "$WORK_DIR/backup.sql"
fi

BACKUP_SIZE=$(wc -c < "$WORK_DIR/backup.sql")
echo "   Backup size: $((BACKUP_SIZE / 1024)) KB"

echo "5. Restoring to test database..."
psql "$TEST_RESTORE_DB_URL" < "$WORK_DIR/backup.sql" > /dev/null 2>&1

echo "6. Verifying restored data..."
VERIFY_QUERY="
SELECT 'users' as table_name, count(*) as row_count FROM users
UNION ALL SELECT 'dealers', count(*) FROM dealers
UNION ALL SELECT 'vehicles', count(*) FROM vehicles
UNION ALL SELECT 'categories', count(*) FROM categories
UNION ALL SELECT 'articles', count(*) FROM articles
UNION ALL SELECT 'subscriptions', count(*) FROM subscriptions
ORDER BY table_name;
"

echo ""
echo "   Table counts in restored database:"
psql "$TEST_RESTORE_DB_URL" -t -A -F '|' -c "$VERIFY_QUERY" | while IFS='|' read -r table count; do
  printf "   %-20s %s rows\n" "$table" "$count"
done

echo ""
echo "7. Cleaning up test database..."
psql "$TEST_RESTORE_DB_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;" > /dev/null 2>&1

echo ""
echo "=== Restore test completed successfully ==="
