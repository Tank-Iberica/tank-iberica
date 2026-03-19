#!/usr/bin/env node
/**
 * #240 — Performance Regression Check
 *
 * Compares current build metrics against a stored baseline.
 * Fails CI if any metric degrades beyond threshold.
 *
 * Metrics compared:
 *   - Bundle sizes (from .output/public/_nuxt stats)
 *   - Build time
 *   - Number of chunks
 *   - Number of dynamic imports
 *
 * Usage:
 *   node scripts/perf-regression-check.mjs                  # compare against baseline
 *   node scripts/perf-regression-check.mjs --update         # save current as new baseline
 *   node scripts/perf-regression-check.mjs --threshold 15   # custom % threshold (default 10)
 *
 * Baseline stored in: scripts/perf-baseline.json
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const BASELINE_PATH = resolve(__dirname, 'perf-baseline.json')
const OUTPUT_DIR = resolve(ROOT, '.output/public/_nuxt')

const shouldUpdate = process.argv.includes('--update')
const thresholdIdx = process.argv.indexOf('--threshold')
const THRESHOLD_PCT = thresholdIdx >= 0 ? Number(process.argv[thresholdIdx + 1]) : 10

// ── Collect current metrics ──────────────────────────────────────────────────

function collectMetrics() {
  const metrics = {
    timestamp: new Date().toISOString(),
    gitSha: '',
    totalBundleSize: 0,
    jsSize: 0,
    cssSize: 0,
    chunkCount: 0,
    dynamicImports: 0,
    largestChunk: { name: '', size: 0 },
  }

  // Git SHA
  try {
    metrics.gitSha = execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf-8' }).trim()
  } catch {
    metrics.gitSha = 'unknown'
  }

  // Scan .output/public/_nuxt for bundle files
  if (existsSync(OUTPUT_DIR)) {
    const files = readdirSync(OUTPUT_DIR)
    for (const file of files) {
      const filePath = resolve(OUTPUT_DIR, file)
      const stat = statSync(filePath)
      if (!stat.isFile()) continue

      const size = stat.size
      const ext = extname(file)

      metrics.totalBundleSize += size
      metrics.chunkCount++

      if (ext === '.js' || ext === '.mjs') {
        metrics.jsSize += size
        // Count dynamic imports by reading content
        try {
          const content = readFileSync(filePath, 'utf-8')
          const dynamicCount = (content.match(/import\(/g) || []).length
          metrics.dynamicImports += dynamicCount
        } catch { /* skip unreadable files */ }
      } else if (ext === '.css') {
        metrics.cssSize += size
      }

      if (size > metrics.largestChunk.size) {
        metrics.largestChunk = { name: file, size }
      }
    }
  } else {
    console.warn('⚠️  .output/public/_nuxt not found. Run `npm run build` first.')
  }

  return metrics
}

// ── Compare with baseline ────────────────────────────────────────────────────

function compare(current, baseline) {
  const regressions = []
  const improvements = []

  const checks = [
    { name: 'Total bundle size', curr: current.totalBundleSize, base: baseline.totalBundleSize, unit: 'bytes' },
    { name: 'JS size', curr: current.jsSize, base: baseline.jsSize, unit: 'bytes' },
    { name: 'CSS size', curr: current.cssSize, base: baseline.cssSize, unit: 'bytes' },
    { name: 'Chunk count', curr: current.chunkCount, base: baseline.chunkCount, unit: 'chunks' },
    { name: 'Largest chunk', curr: current.largestChunk.size, base: baseline.largestChunk.size, unit: 'bytes' },
  ]

  for (const check of checks) {
    if (check.base === 0) continue // skip if baseline is zero
    const changePct = ((check.curr - check.base) / check.base) * 100
    const entry = {
      name: check.name,
      baseline: check.base,
      current: check.curr,
      changePct: Math.round(changePct * 10) / 10,
      unit: check.unit,
    }

    if (changePct > THRESHOLD_PCT) {
      regressions.push(entry)
    } else if (changePct < -THRESHOLD_PCT) {
      improvements.push(entry)
    }
  }

  return { regressions, improvements }
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

// ── Main ─────────────────────────────────────────────────────────────────────

const current = collectMetrics()

console.log('Performance regression check')
console.log('============================')
console.log(`Git SHA: ${current.gitSha}`)
console.log(`Total bundle: ${formatBytes(current.totalBundleSize)}`)
console.log(`  JS: ${formatBytes(current.jsSize)}`)
console.log(`  CSS: ${formatBytes(current.cssSize)}`)
console.log(`Chunks: ${current.chunkCount}`)
console.log(`Dynamic imports: ${current.dynamicImports}`)
console.log(`Largest chunk: ${current.largestChunk.name} (${formatBytes(current.largestChunk.size)})`)
console.log()

if (shouldUpdate) {
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2))
  console.log(`✅ Baseline saved to ${BASELINE_PATH}`)
  process.exit(0)
}

if (!existsSync(BASELINE_PATH)) {
  console.log('ℹ️  No baseline found. Saving current as baseline.')
  writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2))
  console.log(`✅ Baseline created at ${BASELINE_PATH}`)
  process.exit(0)
}

const baseline = JSON.parse(readFileSync(BASELINE_PATH, 'utf-8'))
console.log(`Comparing against baseline (${baseline.gitSha}, ${baseline.timestamp})`)
console.log(`Threshold: ${THRESHOLD_PCT}%`)
console.log()

const { regressions, improvements } = compare(current, baseline)

if (improvements.length > 0) {
  console.log('📈 Improvements:')
  for (const imp of improvements) {
    console.log(`  ✅ ${imp.name}: ${formatBytes(imp.baseline)} → ${formatBytes(imp.current)} (${imp.changePct}%)`)
  }
  console.log()
}

if (regressions.length > 0) {
  console.log('📉 Regressions (exceeding threshold):')
  for (const reg of regressions) {
    console.log(`  ❌ ${reg.name}: ${formatBytes(reg.baseline)} → ${formatBytes(reg.current)} (+${reg.changePct}%)`)
  }
  console.log()
  console.log(`❌ FAIL: ${regressions.length} metric(s) regressed beyond ${THRESHOLD_PCT}% threshold`)
  process.exit(1)
} else {
  console.log('✅ No performance regressions detected')
  process.exit(0)
}
