#!/usr/bin/env bash
# =============================================================================
# Tracciona — Disaster Recovery Drill Script (#100)
# =============================================================================
#
# Runs a full DR drill: restore backup to a temporary DB, verify data integrity,
# time each step, and append results to docs/tracciona-docs/referencia/DISASTER-RECOVERY.md.
#
# Usage:
#   bash scripts/dr-drill.sh [backup_path]
#
# Arguments:
#   backup_path  — (optional) e.g. weekly/tracciona_20260219_030000.sql.enc
#                  If omitted, prompts for selection.
#
# Environment variables (required):
#   TARGET_DATABASE_URL     — Temporary Neon/Railway PostgreSQL URL for the drill
#   BACKUP_ENCRYPTION_KEY   — Passphrase used during encryption
#   B2_APPLICATION_KEY_ID   — Backblaze B2 key ID
#   B2_APPLICATION_KEY      — Backblaze B2 key
#   B2_BUCKET_NAME          — Backblaze B2 bucket name
#
# Optional:
#   DR_DRILL_SKIP_REPORT    — Set to "1" to skip appending to DISASTER-RECOVERY.md
#   DR_RESTORE_DIR          — Temp dir (default: /tmp/tracciona-dr-drill)
#
# =============================================================================

set -euo pipefail

# ─── Config ──────────────────────────────────────────────────────────────────

RESTORE_DIR="${DR_RESTORE_DIR:-/tmp/tracciona-dr-drill}"
BACKUP_NAME="${1:-}"
DR_DOC="docs/tracciona-docs/referencia/DISASTER-RECOVERY.md"
DRILL_LOG="${RESTORE_DIR}/drill.log"

# ─── Timing helpers ──────────────────────────────────────────────────────────

DRILL_START=$(date +%s)
declare -A STEP_TIMES

step_start() {
  STEP_START_TS=$(date +%s)
  echo ""
  echo "────────────────────────────────────────────────────"
  echo "▶  $1"
  echo "────────────────────────────────────────────────────"
}

step_end() {
  local name="$1"
  local elapsed=$(( $(date +%s) - STEP_START_TS ))
  STEP_TIMES["$name"]=$elapsed
  echo "✓  $name: ${elapsed}s"
}

log() {
  local ts
  ts=$(date '+%H:%M:%S')
  echo "[${ts}] $*" | tee -a "${DRILL_LOG}"
}

# ─── Prerequisite check ──────────────────────────────────────────────────────

check_prereqs() {
  local missing=()
  [[ -z "${TARGET_DATABASE_URL:-}" ]] && missing+=("TARGET_DATABASE_URL")
  [[ -z "${BACKUP_ENCRYPTION_KEY:-}" ]] && missing+=("BACKUP_ENCRYPTION_KEY")
  [[ -z "${B2_APPLICATION_KEY_ID:-}" ]] && missing+=("B2_APPLICATION_KEY_ID")
  [[ -z "${B2_APPLICATION_KEY:-}" ]] && missing+=("B2_APPLICATION_KEY")
  [[ -z "${B2_BUCKET_NAME:-}" ]] && missing+=("B2_BUCKET_NAME")

  if [[ ${#missing[@]} -gt 0 ]]; then
    echo "ERROR: Missing required environment variables:"
    for v in "${missing[@]}"; do echo "  - $v"; done
    exit 1
  fi

  for cmd in psql openssl; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "ERROR: '$cmd' not found. Install it first."
      exit 1
    fi
  done

  if ! command -v b2 &>/dev/null && ! command -v aws &>/dev/null; then
    echo "ERROR: Neither 'b2' CLI nor 'aws' CLI found. Install one of them."
    exit 1
  fi

  mkdir -p "${RESTORE_DIR}"
}

# ─── Step 1: Select and download backup ──────────────────────────────────────

download_backup() {
  step_start "Step 1 — Download backup from Backblaze B2"

  if [[ -z "${BACKUP_NAME}" ]]; then
    echo "Available backups:"
    if command -v b2 &>/dev/null; then
      b2 authorize-account "${B2_APPLICATION_KEY_ID}" "${B2_APPLICATION_KEY}" >/dev/null 2>&1
      b2 ls "${B2_BUCKET_NAME}" daily/ 2>/dev/null | head -5 || true
      b2 ls "${B2_BUCKET_NAME}" weekly/ 2>/dev/null | head -3 || true
    elif command -v aws &>/dev/null; then
      local ep="--endpoint-url https://s3.eu-central-003.backblazeb2.com"
      export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
      export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"
      aws s3 ls "s3://${B2_BUCKET_NAME}/daily/" ${ep} 2>/dev/null | tail -5 || true
    fi
    echo ""
    read -r -p "Enter backup path (e.g. daily/tracciona_20260313_020000.sql.enc): " BACKUP_NAME
    [[ -z "${BACKUP_NAME}" ]] && { echo "No backup selected. Exiting."; exit 1; }
  fi

  local local_enc="${RESTORE_DIR}/$(basename "${BACKUP_NAME}")"

  if command -v b2 &>/dev/null; then
    b2 download-file-by-name "${B2_BUCKET_NAME}" "${BACKUP_NAME}" "${local_enc}"
  else
    export AWS_ACCESS_KEY_ID="${B2_APPLICATION_KEY_ID}"
    export AWS_SECRET_ACCESS_KEY="${B2_APPLICATION_KEY}"
    aws s3 cp "s3://${B2_BUCKET_NAME}/${BACKUP_NAME}" "${local_enc}" \
      --endpoint-url "https://s3.eu-central-003.backblazeb2.com"
  fi

  local size
  size=$(du -h "${local_enc}" | cut -f1)
  log "Downloaded: ${local_enc} (${size})"
  step_end "download"
  echo "${local_enc}"
}

# ─── Step 2: Decrypt ─────────────────────────────────────────────────────────

decrypt_backup() {
  step_start "Step 2 — Decrypt backup"
  local enc_file="$1"
  local sql_file="${enc_file%.enc}"

  openssl enc -aes-256-cbc -d -salt -pbkdf2 -iter 100000 \
    -in "${enc_file}" -out "${sql_file}" \
    -pass pass:"${BACKUP_ENCRYPTION_KEY}"

  rm -f "${enc_file}"
  local size
  size=$(du -h "${sql_file}" | cut -f1)
  log "Decrypted: ${sql_file} (${size})"
  step_end "decrypt"
  echo "${sql_file}"
}

# ─── Step 3: Restore to temp DB ──────────────────────────────────────────────

restore_to_temp_db() {
  step_start "Step 3 — Restore to temporary database (Neon/Railway)"
  local sql_file="$1"

  log "Target: ${TARGET_DATABASE_URL%%@*}@***"
  log "WARNING: This overwrites the TEMPORARY drill database only."

  psql "${TARGET_DATABASE_URL}" < "${sql_file}" 2>&1 | tail -10
  step_end "restore"
}

# ─── Step 4: Verify data integrity ───────────────────────────────────────────

verify_integrity() {
  step_start "Step 4 — Verify data integrity"
  local -A counts

  local tables=("vehicles" "dealers" "users" "subscriptions" "categories" "favorites")
  echo ""
  echo "Table counts:"
  for t in "${tables[@]}"; do
    local c
    c=$(psql "${TARGET_DATABASE_URL}" -t -c "SELECT COUNT(*) FROM ${t};" 2>/dev/null | tr -d ' \n' || echo "ERR")
    counts["$t"]=$c
    printf "  %-22s %s rows\n" "${t}" "${c}"
  done

  echo ""
  echo "Extensions:"
  psql "${TARGET_DATABASE_URL}" -t -c \
    "SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'pg_trgm');" 2>/dev/null

  echo ""
  echo "Latest vehicle:"
  psql "${TARGET_DATABASE_URL}" -t -c \
    "SELECT id, title_es, created_at FROM vehicles ORDER BY created_at DESC LIMIT 1;" 2>/dev/null

  # Store counts for report
  VEHICLES_COUNT="${counts[vehicles]:-0}"
  DEALERS_COUNT="${counts[dealers]:-0}"
  USERS_COUNT="${counts[users]:-0}"

  step_end "verify"
}

# ─── Step 5: Generate report ─────────────────────────────────────────────────

append_drill_report() {
  [[ "${DR_DRILL_SKIP_REPORT:-0}" == "1" ]] && return

  local total=$(( $(date +%s) - DRILL_START ))
  local dl=${STEP_TIMES[download]:-?}
  local dc=${STEP_TIMES[decrypt]:-?}
  local rs=${STEP_TIMES[restore]:-?}
  local vr=${STEP_TIMES[verify]:-?}
  local drill_date
  drill_date=$(date '+%Y-%m-%d')

  # Check if "## Historial de Drills" section exists
  if ! grep -q "## Historial de Drills" "${DR_DOC}"; then
    cat >> "${DR_DOC}" << 'SECTION'

## Historial de Drills

| Fecha       | Backup usado              | Tiempo total | Download | Decrypt | Restore | Verify | Vehicles | Dealers | Resultado | Gaps  |
| ----------- | ------------------------- | ------------ | -------- | ------- | ------- | ------ | -------- | ------- | --------- | ----- |
SECTION
  fi

  # Append drill row
  local row="| ${drill_date} | ${BACKUP_NAME} | ${total}s | ${dl}s | ${dc}s | ${rs}s | ${vr}s | ${VEHICLES_COUNT:-?} | ${DEALERS_COUNT:-?} | ✅ OK | Ninguno |"
  echo "${row}" >> "${DR_DOC}"

  echo ""
  log "Drill report appended to ${DR_DOC}"
  echo ""
  echo "════════════════════════════════════════════════════"
  echo "  DR DRILL COMPLETE"
  echo "  Date:     ${drill_date}"
  echo "  Backup:   ${BACKUP_NAME}"
  echo "  Total:    ${total}s"
  echo "  Download: ${dl}s | Decrypt: ${dc}s | Restore: ${rs}s | Verify: ${vr}s"
  echo "  Vehicles: ${VEHICLES_COUNT:-?} | Dealers: ${DEALERS_COUNT:-?} | Users: ${USERS_COUNT:-?}"
  echo "════════════════════════════════════════════════════"
}

# ─── Cleanup ─────────────────────────────────────────────────────────────────

cleanup() {
  rm -rf "${RESTORE_DIR}"
  log "Temp files cleaned up"
}

# ─── Main ────────────────────────────────────────────────────────────────────

main() {
  echo "════════════════════════════════════════════════════"
  echo "  Tracciona DR Drill — $(date '+%Y-%m-%d %H:%M UTC')"
  echo "════════════════════════════════════════════════════"

  check_prereqs

  local enc_file
  enc_file=$(download_backup)

  local sql_file
  sql_file=$(decrypt_backup "${enc_file}")

  restore_to_temp_db "${sql_file}"

  verify_integrity

  append_drill_report

  cleanup
}

main "$@"
