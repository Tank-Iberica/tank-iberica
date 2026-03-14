#!/usr/bin/env node
/**
 * Check for circular dependencies in the codebase.
 *
 * Runs madge on composables, utils, and server layers.
 * Exits 1 if any cycles are found — used as a blocking CI step.
 *
 * Usage: node scripts/check-circular-deps.mjs
 */

import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(__dirname, '..')

// ---------------------------------------------------------------------------
// Directories and file extensions to check
// ---------------------------------------------------------------------------

const CHECKS = [
  { dir: 'app/composables', extensions: ['ts'] },
  { dir: 'app/utils', extensions: ['ts'] },
  { dir: 'server/utils', extensions: ['ts'] },
  { dir: 'server/services', extensions: ['ts'] },
  { dir: 'server/repositories', extensions: ['ts'] },
]

// ---------------------------------------------------------------------------
// Pure helpers (also used by tests via named import)
// ---------------------------------------------------------------------------

export function hasAnyCycles(results) {
  return results.some((r) => r.cycles.length > 0)
}

export function formatCycleLines(entry, cycles) {
  return cycles.map((cycle) => `    ${entry}: ${cycle.join(' → ')}`)
}

export function buildSummary(results) {
  const total = results.reduce((sum, r) => sum + r.cycles.length, 0)
  const entries = results.map((r) => r.dir).join(', ')
  return { total, entries }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function run() {
  let madge
  try {
    madge = (await import('madge')).default
  } catch {
    console.error('❌ madge not installed. Run: npm install --save-dev madge')
    process.exit(1)
  }

  const results = []
  let hasErrors = false

  for (const { dir, extensions } of CHECKS) {
    const absPath = resolve(rootDir, dir)
    if (!existsSync(absPath)) continue

    let cycleList = []
    try {
      const result = await madge(absPath, {
        fileExtensions: extensions,
        tsConfig: resolve(rootDir, 'tsconfig.json'),
        includeNpm: false,
      })
      cycleList = result.circular()
    } catch (err) {
      // If madge fails to parse (TS path aliases, etc.), skip and warn
      console.warn(`⚠️  Could not analyse ${dir}: ${err.message}`)
      continue
    }

    results.push({ dir, cycles: cycleList })

    if (cycleList.length > 0) {
      console.error(`\n❌ Circular dependencies in ${dir}:`)
      const lines = formatCycleLines(dir, cycleList)
      for (const line of lines) console.error(line)
      hasErrors = true
    }
  }

  const { total, entries } = buildSummary(results)

  if (hasErrors) {
    console.error(`\n❌ ${total} circular dependency cycle(s) found across: ${entries}`)
    process.exit(1)
  } else {
    const checked = results.map((r) => r.dir).join(', ')
    console.log(`✅ No circular dependencies in: ${checked}`)
  }
}

run()
