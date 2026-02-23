#!/usr/bin/env bash
# =============================================================================
# Tracciona — Backup Restore Script
# =============================================================================
#
# Downloads an encrypted backup from Backblaze B2, decrypts it, and restores
# to a target PostgreSQL instance.
#
# Usage:
#   bash scripts/backup-restore.sh [backup_name]
#
# Arguments:
#   backup_name  — (optional) Name of the backup file in B2.
#                  If omitted, lists available backups and prompts for selection.
#
# Examples:
#   # Restore latest weekly backup
#   bash scripts/backup-restore.sh weekly/tracciona_20260219_030000.sql.enc
#
#   # Interactive mode — lists available backups
#   bash scripts/backup-restore.sh
#
# Environment variables (required):
#   TARGET_DATABASE_URL      — PostgreSQL connection string for the restore target
#   BACKUP_ENCRYPTION_KEY    — Passphrase used during encryption (same as backup)
#   B2_APPLICATION_KEY_ID    — Backblaze B2 application key ID
#   B2_APPLICATION_KEY       — Backblaze B2 application key
#   B2_BUCKET_NAME           — Backblaze B2 bucket name
#
# Optional:
#   RESTORE_DIR              — Local directory for temp files (default: /tmp/tracciona-restore)
#
# Dependencies:
#   - psql (PostgreSQL client)
#   - openssl
#   - b2 CLI (pip install b2) OR aws CLI with S3-compatible endpoint
#
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

RESTORE_DIR="${RESTORE_DIR:-/tmp/tracciona-restore}"
BACKUP_NAME="${1:-}"

# ─── Logging ─────────────────────────────────────────────────────────────────

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

log_error() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1" >&2
}

log_warn() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] WARNING: $1"
}

# ─── Validation ──────────────────────────────────────────────────────────────

check_required_vars() {
  local missing=()

  if [[ -z "${TARGET_DATABASE_URL:-}" ]]; then
    missing+=("TARGET_DATABASE_URL")
  fi

  if [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
    missing+=("BACKUP_ENCRYPTION_KEY")
  fi

  if [[ -z "${B2_APPLICATION_KEY_ID:-}" ]]; then
    missing+=("B2_APPLICATION_KEY_ID")
  fi

  if [[ -z "${B2_APPLICATION_KEY:-}" ]]; then
    missing+=("B2_APPLICATION_KEY")
  fi

  if [[ -z "${B2_BUCKET_NAME:-}" ]]; then
    missing+=("B2_BUCKET_NAME")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    log_error "Missing required environment variables:"
    for var in "${missing[@]}"; do
      echo "  - ${var}"
    done
    exit 1
  fi

  # Check psql is available
  if ! command -v psql &> /dev/null; then
    log_error "psql not found. Install PostgreSQL client."
    exit 1
  fi

  # Check openssl is available
  if ! command -v openssl &> /dev/null; then
    log_error "openssl not found."
    exit 1
  fi
}

# ─── List available backups ──────────────────────────────────────────────────

list_backups() {
  log "Listing available backups in ${B2_BUCKET_NAME}..."

  if command -v b2 &> /dev/null; then
    b2 authorize-account "${B2_APPLICATION_KEY_ID}" "${B2_APPLICATION_KEY}" > /dev/null 2>&1

    echo ""
    echo "=== Weekly backups ==="
    b2 ls "${B2_BUCKET_NAME}" weekly/ 2>/dev/null || echo "  (none)"

    echo ""
    echo "=== Monthly backups ==="
    b2 ls "${B2_BUCKET_NAME}" monthly/ 2>/dev/null || echo "  (none)"

  elif command -v aws &> /dev/null; then
    export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"
    local endpoint="--endpoint-url https://s3.eu-central-003.backblazeb2.com"

    echo ""
    echo "=== Weekly backups ==="
    aws s3 ls "s3://${B2_BUCKET_NAME}/weekly/" ${endpoint} 2>/dev/null || echo "  (none)"

    echo ""
    echo "=== Monthly backups ==="
    aws s3 ls "s3://${B2_BUCKET_NAME}/monthly/" ${endpoint} 2>/dev/null || echo "  (none)"

  else
    log_error "Neither b2 CLI nor aws CLI found."
    exit 1
  fi

  echo ""
}

# ─── Download backup ────────────────────────────────────────────────────────

download_backup() {
  local remote_path="$1"
  local local_file="${RESTORE_DIR}/$(basename "${remote_path}")"

  mkdir -p "${RESTORE_DIR}"

  log "Downloading backup: ${remote_path}..."

  if command -v b2 &> /dev/null; then
    b2 authorize-account "${B2_APPLICATION_KEY_ID}" "${B2_APPLICATION_KEY}" > /dev/null 2>&1
    b2 download-file-by-name "${B2_BUCKET_NAME}" "${remote_path}" "${local_file}"

  elif command -v aws &> /dev/null; then
    export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"

    aws s3 cp \
      "s3://${B2_BUCKET_NAME}/${remote_path}" \
      "${local_file}" \
      --endpoint-url "https://s3.eu-central-003.backblazeb2.com"
  fi

  local size
  size=$(du -h "${local_file}" | cut -f1)
  log "Download complete: ${local_file} (${size})"

  echo "${local_file}"
}

# ─── Decrypt backup ─────────────────────────────────────────────────────────

decrypt_backup() {
  local encrypted_file="$1"
  local decrypted_file="${encrypted_file%.enc}"

  log "Decrypting backup..."

  openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
    -in "${encrypted_file}" \
    -out "${decrypted_file}" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}"

  local size
  size=$(du -h "${decrypted_file}" | cut -f1)
  log "Decryption complete: ${decrypted_file} (${size})"

  # Remove encrypted file
  rm -f "${encrypted_file}"

  echo "${decrypted_file}"
}

# ─── Restore to PostgreSQL ───────────────────────────────────────────────────

restore_database() {
  local sql_file="$1"

  log "Restoring to target database..."
  log_warn "This will DROP and recreate tables in the target database!"

  # Prompt for confirmation (skip in CI/non-interactive)
  if [[ -t 0 ]]; then
    echo ""
    read -r -p "Are you sure you want to restore? This will overwrite the target database. [y/N] " confirm
    if [[ "${confirm}" != "y" && "${confirm}" != "Y" ]]; then
      log "Restore cancelled."
      exit 0
    fi
  fi

  log "Running SQL restore..."
  psql "${TARGET_DATABASE_URL}" < "${sql_file}" 2>&1 | tail -5

  log "Restore complete"
}

# ─── Verify restoration ─────────────────────────────────────────────────────

verify_restore() {
  log "Verifying restoration..."

  echo ""
  echo "=== Table counts ==="

  local tables=("vehicles" "dealers" "users" "categories" "subcategories" "favorites" "search_alerts")

  for table in "${tables[@]}"; do
    local count
    count=$(psql "${TARGET_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM ${table};" 2>/dev/null | tr -d ' ')
    if [[ -n "${count}" ]]; then
      printf "  %-20s %s rows\n" "${table}" "${count}"
    else
      printf "  %-20s (table not found or error)\n" "${table}"
    fi
  done

  echo ""

  # Check extensions
  echo "=== Extensions ==="
  psql "${TARGET_DATABASE_URL}" -t -c "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');" 2>/dev/null

  echo ""

  # Check for recent data
  echo "=== Latest vehicle ==="
  psql "${TARGET_DATABASE_URL}" -t -c "SELECT id, title_es, created_at FROM vehicles ORDER BY created_at DESC LIMIT 1;" 2>/dev/null

  echo ""
  log "Verification complete. Review the counts above to ensure data integrity."
}

# ─── Cleanup ─────────────────────────────────────────────────────────────────

cleanup() {
  log "Cleaning up temp files..."
  rm -rf "${RESTORE_DIR}"
  log "Cleanup complete"
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  log "=== Tracciona Backup Restore ==="

  check_required_vars

  # If no backup name provided, list available and prompt
  if [[ -z "${BACKUP_NAME}" ]]; then
    list_backups
    echo ""
    read -r -p "Enter the backup path to restore (e.g., weekly/tracciona_20260219_030000.sql.enc): " BACKUP_NAME
    if [[ -z "${BACKUP_NAME}" ]]; then
      log_error "No backup selected. Exiting."
      exit 1
    fi
  fi

  log "Selected backup: ${BACKUP_NAME}"

  # Download
  local local_encrypted
  local_encrypted=$(download_backup "${BACKUP_NAME}")

  # Decrypt
  local local_sql
  local_sql=$(decrypt_backup "${local_encrypted}")

  # Restore
  restore_database "${local_sql}"

  # Verify
  verify_restore

  # Cleanup
  cleanup

  log ""
  log "=== Restore complete ==="
  log "Target: ${TARGET_DATABASE_URL%%@*}@***"
  log "Source: ${BACKUP_NAME}"
}

main "$@"
