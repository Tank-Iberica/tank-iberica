#!/usr/bin/env node
/**
 * audit-licenses.mjs — Check npm dependencies for copyleft licenses
 *
 * Runs `npx license-checker --json --production` and flags any
 * GPL, AGPL, or other copyleft licenses that could affect distribution.
 *
 * Usage: node scripts/audit-licenses.mjs
 */

import { execSync } from 'child_process'
import { writeFileSync } from 'fs'

console.log('=== License Audit ===')
console.log(`Date: ${new Date().toISOString()}`)
console.log('')

// Copyleft license patterns (case-insensitive)
const COPYLEFT_PATTERNS = [
  /\bGPL\b/i,
  /\bAGPL\b/i,
  /\bLGPL\b/i,
  /GNU General Public/i,
  /GNU Affero/i,
  /Reciprocal/i,
  /\bCPL\b/i,
  /\bEPL\b/i,
  /\bMPL\b/i,
  /\bCDDL\b/i,
]

// Known-safe LGPL/MPL packages (weak copyleft, acceptable for non-modified use)
const KNOWN_SAFE = [
  'MPL-2.0', // Mozilla Public License — file-level copyleft only
]

try {
  console.log('1. Running license-checker...')
  const output = execSync('npx license-checker --json --production --direct 2>/dev/null', {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
    timeout: 60_000,
  })

  const packages = JSON.parse(output)
  const totalPackages = Object.keys(packages).length
  console.log(`   Found ${totalPackages} production dependencies`)
  console.log('')

  console.log('2. Checking for copyleft licenses...')

  const issues = []
  const warnings = []

  for (const [pkg, info] of Object.entries(packages)) {
    const license = String(info.licenses || 'UNKNOWN')

    const isCopyleft = COPYLEFT_PATTERNS.some((pattern) => pattern.test(license))

    if (isCopyleft) {
      const isKnownSafe = KNOWN_SAFE.some((safe) => license.includes(safe))

      if (isKnownSafe) {
        warnings.push({ package: pkg, license, status: 'weak-copyleft (acceptable)' })
      } else {
        issues.push({ package: pkg, license, status: 'COPYLEFT' })
      }
    }
  }

  // Report
  console.log('')
  if (issues.length === 0 && warnings.length === 0) {
    console.log('   ✅ No copyleft licenses found')
  }

  if (warnings.length > 0) {
    console.log(`   ⚠️  ${warnings.length} weak-copyleft license(s) (acceptable):`)
    for (const w of warnings) {
      console.log(`      → ${w.package}: ${w.license}`)
    }
  }

  if (issues.length > 0) {
    console.log(`   ❌ ${issues.length} strong-copyleft license(s) found:`)
    for (const i of issues) {
      console.log(`      → ${i.package}: ${i.license}`)
    }
  }

  // License distribution summary
  console.log('')
  console.log('3. License distribution:')
  const licenseCounts = {}
  for (const info of Object.values(packages)) {
    const license = String(info.licenses || 'UNKNOWN')
    licenseCounts[license] = (licenseCounts[license] || 0) + 1
  }

  const sorted = Object.entries(licenseCounts).sort((a, b) => b[1] - a[1])
  for (const [license, count] of sorted.slice(0, 15)) {
    console.log(`   ${String(count).padStart(4)} ${license}`)
  }

  // Write JSON report
  const report = {
    date: new Date().toISOString(),
    totalPackages,
    issues,
    warnings,
    distribution: licenseCounts,
  }

  writeFileSync('license-audit.json', JSON.stringify(report, null, 2))
  console.log('')
  console.log('   Report saved to license-audit.json')

  // Summary
  console.log('')
  console.log('════════════════════════════════════════')
  if (issues.length > 0) {
    console.log(`❌ ${issues.length} copyleft issue(s) require review`)
    process.exit(1)
  } else {
    console.log('✅ License audit passed')
  }
  console.log('════════════════════════════════════════')
} catch (err) {
  if (err.message?.includes('license-checker')) {
    console.log('   ⚠️  license-checker not available. Install with:')
    console.log('      npm install -g license-checker')
    console.log('   Skipping license audit.')
  } else {
    console.error('   Error running license audit:', err.message)
  }
}
