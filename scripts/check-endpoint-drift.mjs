#!/usr/bin/env node
/**
 * Endpoint drift detection.
 *
 * Scans server/api/ and generates a sorted list of all endpoints.
 * On each run, compares against the previous snapshot (endpoint-baseline.json).
 * Reports: NEW endpoints (need documentation/auth review) and REMOVED endpoints.
 *
 * Usage:
 *   node scripts/check-endpoint-drift.mjs          # generate/compare
 *   node scripts/check-endpoint-drift.mjs --update # update baseline
 */

import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('..', import.meta.url).pathname
  .replace(/^\/([A-Za-z]:)/, '$1') // fix Windows /C:/... → C:/...
  .replace(/\/$/, '')
const API_DIR = join(ROOT, 'server', 'api')
const BASELINE_FILE = join(ROOT, 'scripts', 'endpoint-baseline.json')
const UPDATE_MODE = process.argv.includes('--update')

/**
 * Convert file path to HTTP endpoint.
 * server/api/admin/stats.get.ts → GET /api/admin/stats
 */
function fileToEndpoint(filePath) {
  const rel = relative(API_DIR, filePath)
    .replace(/\\/g, '/')
    .replace(/\.ts$/, '')

  // Extract method from filename (stats.get → GET /api/admin/stats)
  const methodMatch = rel.match(/\.(get|post|put|patch|delete|options|head)$/)
  const method = methodMatch ? methodMatch[1].toUpperCase() : 'ANY'
  const pathPart = rel.replace(/\.(get|post|put|patch|delete|options|head)$/, '')
    .replace(/\.post$/, '')

  // Convert [param] → :param
  const httpPath = '/api/' + pathPart.replace(/\[([^\]]+)\]/g, ':$1')

  return `${method} ${httpPath}`
}

function scanDir(dir, results = []) {
  const entries = readdirSync(dir)
  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)
    if (stat.isDirectory()) {
      scanDir(fullPath, results)
    } else if (entry.endsWith('.ts') && !entry.includes('.d.ts')) {
      results.push(fileToEndpoint(fullPath))
    }
  }
  return results
}

const current = scanDir(API_DIR).sort()

if (UPDATE_MODE) {
  writeFileSync(BASELINE_FILE, JSON.stringify({ endpoints: current, updatedAt: new Date().toISOString() }, null, 2))
  console.log(`✅ Baseline updated: ${current.length} endpoints saved to endpoint-baseline.json`)
  process.exit(0)
}

if (!existsSync(BASELINE_FILE)) {
  console.log('ℹ️  No baseline found. Run with --update to create one.')
  console.log(`\nCurrent endpoints (${current.length}):`)
  current.forEach(e => console.log(' ', e))
  writeFileSync(BASELINE_FILE, JSON.stringify({ endpoints: current, updatedAt: new Date().toISOString() }, null, 2))
  console.log('\n✅ Baseline created automatically.')
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(BASELINE_FILE, 'utf-8'))
const previous = new Set(baseline.endpoints || [])
const currentSet = new Set(current)

const added = current.filter(e => !previous.has(e))
const removed = [...previous].filter(e => !currentSet.has(e))

console.log(`=== Endpoint Drift Report ===`)
console.log(`Date: ${new Date().toUTCString()}`)
console.log(`Baseline: ${baseline.updatedAt}`)
console.log(`Previous: ${previous.size} endpoints | Current: ${current.length} endpoints`)
console.log('')

if (added.length === 0 && removed.length === 0) {
  console.log('✅ No drift detected. All endpoints match baseline.')
} else {
  if (added.length > 0) {
    console.log(`🆕 NEW endpoints (${added.length}) — verify auth + documentation:`)
    added.forEach(e => console.log('  +', e))
    console.log('')
  }
  if (removed.length > 0) {
    console.log(`🗑️  REMOVED endpoints (${removed.length}):`)
    removed.forEach(e => console.log('  -', e))
    console.log('')
  }
  console.log('ℹ️  Run with --update to accept these changes as new baseline.')
}

// Write report for CI artifact
const report = { date: new Date().toISOString(), added, removed, total: current.length }
writeFileSync(join(ROOT, 'endpoint-drift-report.json'), JSON.stringify(report, null, 2))
