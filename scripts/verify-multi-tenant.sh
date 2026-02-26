#!/usr/bin/env bash
#
# verify-multi-tenant.sh — Check for hardcoded strings that break multi-tenancy
#
# Scans source files for hardcoded references to "Tracciona", "Tank Ibérica",
# hardcoded Spanish category names, and other strings that should come from
# vertical_config, getSiteName(), or i18n.
#
# Usage: ./scripts/verify-multi-tenant.sh
#

set -euo pipefail

echo "=== Multi-Tenant Verification ==="
echo "Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')"
echo ""

TOTAL_ISSUES=0
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Files to scan (source code only, excluding docs, migrations, config, tests, node_modules)
SCAN_DIRS="app server"
EXCLUDE_PATTERNS="--exclude-dir=node_modules --exclude-dir=.nuxt --exclude-dir=.output --exclude-dir=dist --exclude-dir=.git"
EXCLUDE_FILES="--exclude=*.md --exclude=*.json --exclude=*.sql --exclude=*.sh --exclude=*.yml --exclude=*.yaml --exclude=*.css --exclude=*.config.ts --exclude=*.config.js"

check_pattern() {
  local label="$1"
  local pattern="$2"
  local extra_exclude="${3:-}"

  echo "── Checking: $label ──"

  local results
  results=$(cd "$PROJECT_ROOT" && grep -rn $EXCLUDE_PATTERNS $EXCLUDE_FILES $extra_exclude "$pattern" $SCAN_DIRS 2>/dev/null || true)

  if [ -z "$results" ]; then
    echo "   ✅ No issues found"
  else
    local count
    count=$(echo "$results" | wc -l)
    TOTAL_ISSUES=$((TOTAL_ISSUES + count))
    echo "   ⚠️  $count potential issue(s):"
    echo "$results" | while IFS= read -r line; do
      echo "   → $line"
    done
  fi
  echo ""
}

# 1. Hardcoded brand names (should use getSiteName() or vertical_config)
check_pattern "Hardcoded 'Tracciona' in templates/logic" "Tracciona" "--exclude=siteConfig.ts --exclude=eventBus.ts"

# 2. Legacy brand name
check_pattern "Hardcoded 'Tank Ibérica' or 'Tank Iberica'" "Tank.Ib[eé]rica"

# 3. Hardcoded Spanish category names (should come from DB)
check_pattern "Hardcoded 'Camión' / 'Camion'" "[Cc]ami[oó]n" "--exclude=*.test.ts"
check_pattern "Hardcoded 'Remolque'" "[Rr]emolque" "--exclude=*.test.ts"
check_pattern "Hardcoded 'Grúa' / 'Grua'" "[Gg]r[uú]a" "--exclude=*.test.ts"
check_pattern "Hardcoded 'Furgoneta'" "[Ff]urgoneta" "--exclude=*.test.ts"

# 4. Hardcoded domain (should use getSiteUrl())
check_pattern "Hardcoded 'tracciona.com' domain" "tracciona\\.com" "--exclude=siteConfig.ts --exclude=cors.ts"

# 5. Hardcoded admin email (should use env var)
check_pattern "Hardcoded admin email" "tankiberica@gmail\\.com" "--exclude=notifications.ts"

# 6. Hardcoded vertical name 'vehicles' (should use useVerticalConfig)
check_pattern "Hardcoded vertical 'vehicles'" "'vehicles'" "--exclude=verticalConfig.ts --exclude=featureFlags.ts --exclude=eventBus.ts"

# ── Summary ──
echo "════════════════════════════════════════"
if [ "$TOTAL_ISSUES" -eq 0 ]; then
  echo "✅ No multi-tenant issues detected"
else
  echo "⚠️  $TOTAL_ISSUES potential issue(s) found"
  echo "   Review each finding — some may be legitimate defaults"
  echo "   (e.g., fallback values in siteConfig are expected)"
fi
echo "════════════════════════════════════════"
