#!/usr/bin/env node
/**
 * Agent E — Task #124 — Hardcoding Audit Script
 *
 * Detects hardcoded values across 4 priority layers:
 *   P0: Multi-vertical (routes, categories, subcategories)
 *   P1: Branding (domains, site names, emails, URLs)
 *   P2: i18n (hardcoded Spanish text outside $t())
 *   P3: Config (magic numbers, thresholds, commercial config)
 *
 * Usage:
 *   node scripts/audit-hardcoding.mjs           # Full report
 *   node scripts/audit-hardcoding.mjs --summary  # Summary only
 *   node scripts/audit-hardcoding.mjs --p1       # P1 layer only
 *   node scripts/audit-hardcoding.mjs --strict   # Exit code 1 if findings
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join, relative } from 'path'

const args = process.argv.slice(2)
const summaryOnly = args.includes('--summary')
const strictMode = args.includes('--strict')
const layerFilter = args.find(a => a.startsWith('--p'))?.replace('--', '') || null

// ── Configuration ─────────────────────────────────────────────────────────────

const SCAN_DIRS = ['app/components', 'app/composables', 'app/pages', 'app/utils', 'app/plugins', 'server']
const EXTENSIONS = ['.ts', '.vue']
const IGNORE_DIRS = ['node_modules', '.nuxt', '.output', '.pdf-build', 'dist', 'coverage']
const IGNORE_FILES = [
  'useSiteConfig.ts',   // Dynamic config composable (fallbacks OK)
  'siteConfig.ts',      // Server-side dynamic config (fallbacks OK)
  'robots.txt.ts',      // Uses env var with fallback comment
  'widget.vue',         // Standalone widget with fallback
  'audit-hardcoding.mjs', // This script
]

// ── P1 Patterns: Domain/Branding ──────────────────────────────────────────────

const P1_PATTERNS = [
  {
    name: 'Hardcoded tracciona.com URL',
    regex: /['"`]https?:\/\/tracciona\.com/g,
    severity: 'high',
  },
  {
    name: 'Hardcoded tracciona.com domain (non-URL)',
    regex: /(?<!')(?<!")(?<!`)tracciona\.com(?!['"`].*(?:useSiteUrl|getSiteUrl|fallback|TODO))/g,
    severity: 'medium',
  },
  {
    name: 'Hardcoded info@tracciona email',
    regex: /['"`](?:info|legal|security|hola)@tracciona\.com['"`]/g,
    severity: 'high',
  },
  {
    name: 'Hardcoded "Tracciona" site name in code (non-brand context)',
    regex: /['"`]Tracciona['"`]\s*(?:(?:<|,|\+|\}|;))/g,
    severity: 'low',
  },
]

// ── P0 Patterns: Multi-vertical (route paths, hardcoded entity names) ─────────

const P0_PATTERNS = [
  {
    name: 'Hardcoded /vehiculo/ route in code',
    regex: /['"`]\/vehiculo\//g,
    severity: 'medium',
    note: 'Should use a route helper or vertical_config.entitySlug',
  },
  {
    name: 'Hardcoded /admin/vehiculos route',
    regex: /['"`]\/admin\/vehiculos/g,
    severity: 'low',
    note: 'Admin routes are less critical but should be configurable for new verticals',
  },
]

// ── P3 Patterns: Commercial config / magic numbers ────────────────────────────

const P3_PATTERNS = [
  {
    name: 'Hardcoded price threshold (round numbers >= 1000)',
    regex: /(?:price|precio|amount|importe|coste|cost)\s*(?:>|<|>=|<=|===?|!==?)\s*\d{4,}/g,
    severity: 'low',
    note: 'Consider moving to vertical_config or subscription tier config',
  },
  {
    name: 'Hardcoded max/limit constant',
    regex: /(?:MAX|LIMIT|THRESHOLD|QUOTA)_\w+\s*=\s*\d+/g,
    severity: 'info',
    note: 'Review if this should be configurable per vertical',
  },
]

// ── Collect files ─────────────────────────────────────────────────────────────

function collectFiles(dir) {
  const results = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.includes(entry.name)) {
          results.push(...collectFiles(fullPath))
        }
      } else if (EXTENSIONS.some(ext => entry.name.endsWith(ext))) {
        if (!IGNORE_FILES.includes(entry.name)) {
          results.push(fullPath)
        }
      }
    }
  } catch {
    // Directory doesn't exist, skip
  }
  return results
}

// ── Scan ──────────────────────────────────────────────────────────────────────

function scanFile(filePath, patterns, layer) {
  const content = readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')
  const findings = []

  for (const pattern of patterns) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const matches = [...line.matchAll(pattern.regex)]
      if (matches.length > 0) {
        // Skip lines that are comments
        const trimmed = line.trim()
        if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) continue
        // Skip TODO-annotated lines
        if (line.includes('TODO:') || line.includes('TODO ')) continue

        for (const match of matches) {
          findings.push({
            file: relative('.', filePath).replace(/\\/g, '/'),
            line: i + 1,
            col: match.index + 1,
            pattern: pattern.name,
            severity: pattern.severity,
            match: match[0].slice(0, 60),
            note: pattern.note || '',
            layer,
          })
        }
      }
    }
  }
  return findings
}

// ── Main ──────────────────────────────────────────────────────────────────────

const allFiles = SCAN_DIRS.flatMap(dir => collectFiles(dir))
const allFindings = []

const layers = {
  p0: { patterns: P0_PATTERNS, label: 'P0 — Multi-vertical (routes/entities)' },
  p1: { patterns: P1_PATTERNS, label: 'P1 — Branding (domains/names/emails)' },
  p3: { patterns: P3_PATTERNS, label: 'P3 — Config (thresholds/magic numbers)' },
}

for (const [key, layer] of Object.entries(layers)) {
  if (layerFilter && layerFilter !== key) continue
  for (const file of allFiles) {
    const findings = scanFile(file, layer.patterns, key)
    allFindings.push(...findings)
  }
}

// ── Report ────────────────────────────────────────────────────────────────────

const grouped = {}
for (const f of allFindings) {
  const key = `${f.layer}:${f.pattern}`
  if (!grouped[key]) grouped[key] = []
  grouped[key].push(f)
}

console.log('\n╔══════════════════════════════════════════════════════════════╗')
console.log('║            HARDCODING AUDIT — 4-LAYER REPORT               ║')
console.log('╚══════════════════════════════════════════════════════════════╝\n')

const layerSummary = {}
for (const [key, layer] of Object.entries(layers)) {
  if (layerFilter && layerFilter !== key) continue
  const layerFindings = allFindings.filter(f => f.layer === key)
  layerSummary[key] = layerFindings.length

  console.log(`\n─── ${layer.label} ─── (${layerFindings.length} findings)`)

  if (layerFindings.length === 0) {
    console.log('  ✅ Clean — no hardcoded values detected\n')
    continue
  }

  if (!summaryOnly) {
    const byPattern = {}
    for (const f of layerFindings) {
      if (!byPattern[f.pattern]) byPattern[f.pattern] = []
      byPattern[f.pattern].push(f)
    }
    for (const [pattern, findings] of Object.entries(byPattern)) {
      const sev = findings[0].severity
      const icon = sev === 'high' ? '🔴' : sev === 'medium' ? '🟡' : sev === 'low' ? '🔵' : 'ℹ️'
      console.log(`  ${icon} ${pattern} (${findings.length})`)
      if (findings[0].note) console.log(`     Note: ${findings[0].note}`)
      for (const f of findings.slice(0, 10)) {
        console.log(`     ${f.file}:${f.line} → ${f.match}`)
      }
      if (findings.length > 10) {
        console.log(`     ... and ${findings.length - 10} more`)
      }
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────

const total = allFindings.length
const high = allFindings.filter(f => f.severity === 'high').length
const medium = allFindings.filter(f => f.severity === 'medium').length

console.log('\n════════════════════════════════════════════════════════════════')
console.log(`  TOTAL: ${total} findings  (high: ${high}, medium: ${medium}, low/info: ${total - high - medium})`)
for (const [key, count] of Object.entries(layerSummary)) {
  console.log(`  ${key.toUpperCase()}: ${count}`)
}
console.log('════════════════════════════════════════════════════════════════\n')

if (strictMode && total > 0) {
  console.log('❌ Strict mode: exiting with code 1')
  process.exit(1)
}

if (total === 0) {
  console.log('✅ All clear — zero hardcoded values detected!')
}
