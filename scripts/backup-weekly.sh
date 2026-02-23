#!/usr/bin/env bash
# =============================================================================
# Tracciona — Weekly Database Backup Script
# =============================================================================
#
# Exports the full Supabase PostgreSQL database, encrypts it with AES-256,
# and uploads to Backblaze B2 (S3-compatible storage).
#
# Retention policy:
#   - 4 weekly backups (last 4 weeks)
#   - 3 monthly backups (last 3 months, kept on the 1st Sunday of month)
#
# Usage:
#   bash scripts/backup-weekly.sh
#
# Environment variables (required):
#   SUPABASE_ACCESS_TOKEN    — Supabase personal access token
#   SUPABASE_PROJECT_REF     — Supabase project reference ID
#   BACKUP_ENCRYPTION_KEY    — Passphrase for AES-256 encryption
#   B2_APPLICATION_KEY_ID    — Backblaze B2 application key ID
#   B2_APPLICATION_KEY       — Backblaze B2 application key
#   B2_BUCKET_NAME           — Backblaze B2 bucket name
#
# Optional:
#   SUPABASE_DB_URL          — Direct PostgreSQL connection string (skips CLI dump)
#   BACKUP_DIR               — Local directory for temp files (default: /tmp/tracciona-backups)
#
# Dependencies:
#   - supabase CLI (npm i -g supabase) OR pg_dump
#   - openssl
#   - b2 CLI (pip install b2) OR aws CLI with S3-compatible endpoint
#
# =============================================================================

set -euo pipefail

# ─── Configuration ───────────────────────────────────────────────────────────

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DAY_OF_MONTH=$(date +"%d")
DAY_OF_WEEK=$(date +"%u")  # 1=Monday, 7=Sunday
YEAR_MONTH=$(date +"%Y%m")
BACKUP_DIR="${BACKUP_DIR:-/tmp/tracciona-backups}"
DUMP_FILE="${BACKUP_DIR}/tracciona_${TIMESTAMP}.sql"
ENCRYPTED_FILE="${DUMP_FILE}.enc"

# Retention
WEEKLY_RETENTION=4
MONTHLY_RETENTION=3

# ─── Validation ──────────────────────────────────────────────────────────────

check_required_vars() {
  local missing=()

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

  # Need either Supabase CLI vars or direct DB URL
  if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_ACCESS_TOKEN:-}" ]]; then
    missing+=("SUPABASE_ACCESS_TOKEN or SUPABASE_DB_URL")
  fi

  if [[ -z "${SUPABASE_DB_URL:-}" && -z "${SUPABASE_PROJECT_REF:-}" ]]; then
    missing+=("SUPABASE_PROJECT_REF or SUPABASE_DB_URL")
  fi

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: Missing required environment variables:"
    for var in "${missing[@]}"; do
      echo "  - ${var}"
    done
    exit 1
  fi
}

# ─── Logging ─────────────────────────────────────────────────────────────────

log() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] $1"
}

log_error() {
  echo "[$(date +"%Y-%m-%d %H:%M:%S")] ERROR: $1" >&2
}

# ─── Step 1: Database Dump ───────────────────────────────────────────────────

dump_database() {
  mkdir -p "${BACKUP_DIR}"

  if [[ -n "${SUPABASE_DB_URL:-}" ]]; then
    log "Dumping database via pg_dump..."
    pg_dump "${SUPABASE_DB_URL}" \
      --no-owner \
      --no-acl \
      --clean \
      --if-exists \
      --format=plain \
      -f "${DUMP_FILE}"
  else
    log "Dumping database via Supabase CLI..."
    npx supabase db dump \
      --project-ref "${SUPABASE_PROJECT_REF}" \
      -f "${DUMP_FILE}"
  fi

  local size
  size=$(du -h "${DUMP_FILE}" | cut -f1)
  log "Dump complete: ${DUMP_FILE} (${size})"
}

# ─── Step 2: Encrypt ────────────────────────────────────────────────────────

encrypt_backup() {
  log "Encrypting backup with AES-256-CBC..."
  openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
    -in "${DUMP_FILE}" \
    -out "${ENCRYPTED_FILE}" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}"

  local size
  size=$(du -h "${ENCRYPTED_FILE}" | cut -f1)
  log "Encryption complete: ${ENCRYPTED_FILE} (${size})"

  # Remove unencrypted dump
  rm -f "${DUMP_FILE}"
  log "Removed unencrypted dump"
}

# ─── Step 3: Upload to B2 ───────────────────────────────────────────────────

upload_to_b2() {
  local remote_path="$1"
  local local_file="$2"

  log "Uploading to B2: ${B2_BUCKET_NAME}/${remote_path}..."

  # Method 1: Using b2 CLI (preferred)
  if command -v b2 &> /dev/null; then
    b2 authorize-account "${B2_APPLICATION_KEY_ID}" "${B2_APPLICATION_KEY}"
    b2 upload-file "${B2_BUCKET_NAME}" "${local_file}" "${remote_path}"

  # Method 2: Using AWS CLI with S3-compatible endpoint
  elif command -v aws &> /dev/null; then
    export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"

    aws s3 cp "${local_file}" \
      "s3://${B2_BUCKET_NAME}/${remote_path}" \
      --endpoint-url "https://s3.eu-central-003.backblazeb2.com"

  else
    log_error "Neither b2 CLI nor aws CLI found. Install one of them."
    exit 1
  fi

  log "Upload complete: ${remote_path}"
}

upload_backup() {
  local filename
  filename=$(basename "${ENCRYPTED_FILE}")

  # Always upload as weekly
  local weekly_path="weekly/${filename}"
  upload_to_b2 "${weekly_path}" "${ENCRYPTED_FILE}"

  # If first Sunday of the month (day 1-7), also save as monthly
  if [[ "${DAY_OF_MONTH}" -le 7 ]]; then
    local monthly_path="monthly/tracciona_${YEAR_MONTH}.sql.enc"
    upload_to_b2 "${monthly_path}" "${ENCRYPTED_FILE}"
    log "Also saved as monthly backup: ${monthly_path}"
  fi
}

# ─── Step 4: Cleanup old backups ────────────────────────────────────────────

cleanup_old_backups() {
  log "Cleaning up old backups..."

  if command -v b2 &> /dev/null; then
    # List weekly backups, keep only last WEEKLY_RETENTION
    local weekly_files
    weekly_files=$(b2 ls "${B2_BUCKET_NAME}" weekly/ | sort -r)
    local count=0

    while IFS= read -r file; do
      count=$((count + 1))
      if [[ ${count} -gt ${WEEKLY_RETENTION} ]]; then
        log "Deleting old weekly backup: ${file}"
        b2 delete-file-version "${file}" 2>/dev/null || true
      fi
    done <<< "${weekly_files}"

    # List monthly backups, keep only last MONTHLY_RETENTION
    local monthly_files
    monthly_files=$(b2 ls "${B2_BUCKET_NAME}" monthly/ | sort -r)
    count=0

    while IFS= read -r file; do
      count=$((count + 1))
      if [[ ${count} -gt ${MONTHLY_RETENTION} ]]; then
        log "Deleting old monthly backup: ${file}"
        b2 delete-file-version "${file}" 2>/dev/null || true
      fi
    done <<< "${monthly_files}"

  elif command -v aws &> /dev/null; then
    export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"
    local endpoint="--endpoint-url https://s3.eu-central-003.backblazeb2.com"

    # List and delete old weekly backups
    local weekly_list
    weekly_list=$(aws s3 ls "s3://${B2_BUCKET_NAME}/weekly/" ${endpoint} | sort -r | awk '{print $4}')
    local count=0

    for file in ${weekly_list}; do
      count=$((count + 1))
      if [[ ${count} -gt ${WEEKLY_RETENTION} ]]; then
        log "Deleting old weekly backup: weekly/${file}"
        aws s3 rm "s3://${B2_BUCKET_NAME}/weekly/${file}" ${endpoint}
      fi
    done

    # List and delete old monthly backups
    local monthly_list
    monthly_list=$(aws s3 ls "s3://${B2_BUCKET_NAME}/monthly/" ${endpoint} | sort -r | awk '{print $4}')
    count=0

    for file in ${monthly_list}; do
      count=$((count + 1))
      if [[ ${count} -gt ${MONTHLY_RETENTION} ]]; then
        log "Deleting old monthly backup: monthly/${file}"
        aws s3 rm "s3://${B2_BUCKET_NAME}/monthly/${file}" ${endpoint}
      fi
    done
  fi

  log "Cleanup complete"
}

# ─── Step 5: Local cleanup ──────────────────────────────────────────────────

cleanup_local() {
  log "Cleaning up local temp files..."
  rm -f "${ENCRYPTED_FILE}"
  log "Local cleanup complete"
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  log "=== Tracciona Weekly Backup ==="
  log "Timestamp: ${TIMESTAMP}"
  log "Backup dir: ${BACKUP_DIR}"

  check_required_vars
  dump_database
  encrypt_backup
  upload_backup
  cleanup_old_backups
  cleanup_local

  log ""
  log "=== Backup complete ==="
  log "Weekly backups retained: ${WEEKLY_RETENTION}"
  log "Monthly backups retained: ${MONTHLY_RETENTION}"
}

main "$@"
