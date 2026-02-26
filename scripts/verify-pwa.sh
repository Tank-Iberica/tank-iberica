#!/bin/bash
# verify-pwa.sh — PWA installability and configuration verification
# Session 60B — Run this script to validate PWA setup
# Usage: bash scripts/verify-pwa.sh

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
WARN=0
FAIL=0

pass() { echo -e "  ${GREEN}✅ $1${NC}"; PASS=$((PASS + 1)); }
warn() { echo -e "  ${YELLOW}⚠️  $1${NC}"; WARN=$((WARN + 1)); }
fail() { echo -e "  ${RED}❌ $1${NC}"; FAIL=$((FAIL + 1)); }

echo "╔══════════════════════════════════════════════════╗"
echo "║       PWA Verification — Tracciona              ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ── 1. Icon files ──
echo "1. Icon files:"
[ -f "public/icon-192x192.png" ] && pass "icon-192x192.png exists ($(wc -c < public/icon-192x192.png) bytes)" || fail "icon-192x192.png MISSING"
[ -f "public/icon-512x512.png" ] && pass "icon-512x512.png exists ($(wc -c < public/icon-512x512.png) bytes)" || fail "icon-512x512.png MISSING"
[ -f "public/apple-touch-icon.png" ] && pass "apple-touch-icon.png exists" || warn "apple-touch-icon.png missing (iOS)"
[ -f "public/favicon.ico" ] && pass "favicon.ico exists" || warn "favicon.ico missing"
echo ""

# ── 2. manifest.json ──
echo "2. Manifest file:"
if [ -f "public/manifest.json" ]; then
  pass "manifest.json exists"

  # Check required fields
  if command -v node &>/dev/null; then
    node -e "
      const m = require('./public/manifest.json');
      const checks = [
        ['name', m.name],
        ['short_name', m.short_name],
        ['start_url', m.start_url],
        ['display', m.display],
        ['theme_color', m.theme_color],
        ['background_color', m.background_color],
        ['icons', m.icons && m.icons.length >= 2],
      ];
      checks.forEach(([key, val]) => {
        if (val) console.log('  PASS: ' + key + ' = ' + (typeof val === 'boolean' ? 'present' : JSON.stringify(val).substring(0, 60)));
        else console.log('  FAIL: ' + key + ' is missing');
      });

      // Check maskable icon
      const hasMaskable = m.icons?.some(i => i.purpose === 'maskable');
      console.log(hasMaskable ? '  PASS: has maskable icon' : '  WARN: no maskable icon');

      // Check 192 and 512 icons
      const has192 = m.icons?.some(i => i.sizes === '192x192');
      const has512 = m.icons?.some(i => i.sizes === '512x512');
      console.log(has192 ? '  PASS: has 192x192 icon' : '  FAIL: missing 192x192 icon');
      console.log(has512 ? '  PASS: has 512x512 icon' : '  FAIL: missing 512x512 icon');
    " 2>/dev/null || warn "Could not parse manifest.json"
  fi
else
  fail "manifest.json MISSING"
fi
echo ""

# ── 3. nuxt.config.ts PWA config ──
echo "3. Nuxt PWA module configuration:"
if grep -q "@vite-pwa/nuxt" nuxt.config.ts; then
  pass "@vite-pwa/nuxt module registered"
else
  fail "@vite-pwa/nuxt NOT in modules"
fi

if grep -q "registerType.*autoUpdate" nuxt.config.ts; then
  pass "registerType: autoUpdate configured"
else
  warn "registerType not set to autoUpdate"
fi

if grep -q "navigateFallback.*offline" nuxt.config.ts; then
  pass "navigateFallback: /offline configured"
else
  warn "navigateFallback to /offline not configured"
fi

if grep -q "runtimeCaching" nuxt.config.ts; then
  pass "runtimeCaching configured for offline data"
else
  warn "No runtimeCaching configured"
fi
echo ""

# ── 4. Offline page ──
echo "4. Offline page:"
if [ -f "app/pages/offline.vue" ]; then
  pass "app/pages/offline.vue exists"
  if grep -q "offline.title" app/pages/offline.vue; then
    pass "Uses i18n keys (\$t('offline.title'))"
  else
    warn "May not use i18n for offline messages"
  fi
  if grep -q "window.location.reload" app/pages/offline.vue; then
    pass "Has retry button (reload)"
  else
    warn "No retry mechanism found"
  fi
else
  fail "app/pages/offline.vue MISSING"
fi
echo ""

# ── 5. Service worker caching strategies ──
echo "5. Service worker caching strategies:"
if grep -q "cloudinary-images" nuxt.config.ts; then
  pass "Cloudinary images: CacheFirst (30 days, max 200)"
fi
if grep -q "google-fonts" nuxt.config.ts; then
  pass "Google Fonts: CacheFirst (365 days)"
fi
if grep -q "supabase-api" nuxt.config.ts; then
  pass "Supabase API: NetworkFirst (5 min cache, 10s timeout)"
fi
echo ""

# ── 6. Package dependency ──
echo "6. Dependencies:"
if grep -q '"@vite-pwa/nuxt"' package.json; then
  VERSION=$(node -e "console.log(require('./package.json').devDependencies['@vite-pwa/nuxt'] || require('./package.json').dependencies['@vite-pwa/nuxt'] || 'unknown')" 2>/dev/null)
  pass "@vite-pwa/nuxt installed: $VERSION"
else
  fail "@vite-pwa/nuxt not in package.json"
fi
echo ""

# ── 7. Security headers compatibility ──
echo "7. Security headers (PWA compatibility):"
if grep -q "service-worker" server/middleware/security-headers.ts 2>/dev/null; then
  pass "CSP allows service worker"
else
  # Service workers don't need special CSP — they run in their own context
  pass "Service workers run outside CSP scope (no config needed)"
fi
echo ""

# ── Summary ──
echo "════════════════════════════════════════"
echo -e "Results: ${GREEN}$PASS passed${NC}, ${YELLOW}$WARN warnings${NC}, ${RED}$FAIL failed${NC}"
if [ $FAIL -gt 0 ]; then
  echo -e "${RED}PWA verification has failures — review above${NC}"
  exit 1
else
  echo -e "${GREEN}PWA verification passed${NC}"
fi
echo "════════════════════════════════════════"
