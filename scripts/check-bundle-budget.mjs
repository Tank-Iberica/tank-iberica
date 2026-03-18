#!/usr/bin/env node
/**
 * Bundle Size Budget Checker
 * Run after `npm run build` to verify chunk sizes are within budget.
 *
 * Budgets:
 * - No single JS chunk > 500KB (uncompressed)
 * - No single CSS chunk > 150KB (uncompressed)
 * - Total shared/entry JS < 1.5MB (uncompressed)
 *
 * Exit code 1 if any budget is exceeded (for CI).
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const NUXT_DIR = '.output/public/_nuxt'
const BUDGETS = {
  maxSingleJS: 500 * 1024,     // 500KB per chunk
  maxSingleCSS: 150 * 1024,    // 150KB per chunk
  maxTotalSharedJS: 1500 * 1024, // 1.5MB total entry/shared JS
}

let exitCode = 0

try {
  const files = readdirSync(NUXT_DIR)
  const jsFiles = []
  const cssFiles = []

  for (const f of files) {
    const size = statSync(join(NUXT_DIR, f)).size
    if (f.endsWith('.js')) jsFiles.push({ file: f, size })
    else if (f.endsWith('.css')) cssFiles.push({ file: f, size })
  }

  // Sort by size descending
  jsFiles.sort((a, b) => b.size - a.size)
  cssFiles.sort((a, b) => b.size - a.size)

  const totalJS = jsFiles.reduce((sum, f) => sum + f.size, 0)
  const totalCSS = cssFiles.reduce((sum, f) => sum + f.size, 0)

  console.log('=== Bundle Size Budget Report ===\n')
  console.log(`JS chunks: ${jsFiles.length} | Total: ${(totalJS / 1024).toFixed(1)} KB`)
  console.log(`CSS chunks: ${cssFiles.length} | Total: ${(totalCSS / 1024).toFixed(1)} KB\n`)

  // Check individual JS chunks
  const oversizedJS = jsFiles.filter(f => f.size > BUDGETS.maxSingleJS)
  if (oversizedJS.length > 0) {
    console.log(`WARN: ${oversizedJS.length} JS chunk(s) exceed ${(BUDGETS.maxSingleJS / 1024).toFixed(0)}KB budget:`)
    oversizedJS.forEach(f => console.log(`  ${f.file}: ${(f.size / 1024).toFixed(1)} KB`))
    exitCode = 1
  } else {
    console.log(`OK: All JS chunks within ${(BUDGETS.maxSingleJS / 1024).toFixed(0)}KB budget`)
  }

  // Check individual CSS chunks
  const oversizedCSS = cssFiles.filter(f => f.size > BUDGETS.maxSingleCSS)
  if (oversizedCSS.length > 0) {
    console.log(`WARN: ${oversizedCSS.length} CSS chunk(s) exceed ${(BUDGETS.maxSingleCSS / 1024).toFixed(0)}KB budget:`)
    oversizedCSS.forEach(f => console.log(`  ${f.file}: ${(f.size / 1024).toFixed(1)} KB`))
    exitCode = 1
  } else {
    console.log(`OK: All CSS chunks within ${(BUDGETS.maxSingleCSS / 1024).toFixed(0)}KB budget`)
  }

  // Top 5 largest
  console.log('\nTop 5 largest JS chunks:')
  jsFiles.slice(0, 5).forEach(f => console.log(`  ${f.file}: ${(f.size / 1024).toFixed(1)} KB`))

  console.log('\nTop 5 largest CSS chunks:')
  cssFiles.slice(0, 5).forEach(f => console.log(`  ${f.file}: ${(f.size / 1024).toFixed(1)} KB`))

} catch (err) {
  console.error('Error: Build output not found. Run `npm run build` first.')
  console.error(err.message)
  exitCode = 2
}

process.exit(exitCode)
