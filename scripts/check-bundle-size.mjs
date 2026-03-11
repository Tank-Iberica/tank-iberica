#!/usr/bin/env node
/**
 * check-bundle-size.mjs — Analyze Nuxt build output and flag oversized chunks.
 *
 * Usage:
 *   npm run build && node scripts/check-bundle-size.mjs
 *
 * Scans .output/public/_nuxt/ for JS chunks and reports:
 *   - All chunks > 50KB (warning)
 *   - Total bundle size
 *   - Top 10 largest chunks
 *
 * Exit code 1 if any single chunk exceeds 200KB (critical).
 */

import { readdirSync, statSync } from 'node:fs'
import { resolve, dirname, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const NUXT_DIR = resolve(ROOT, '.output', 'public', '_nuxt')

const WARN_THRESHOLD = 50 * 1024    // 50KB
const CRITICAL_THRESHOLD = 200 * 1024 // 200KB

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)}MB`
}

function scanChunks(dir) {
  const results = []
  try {
    const files = readdirSync(dir)
    for (const file of files) {
      const ext = extname(file)
      if (ext !== '.js' && ext !== '.mjs') continue
      const fullPath = resolve(dir, file)
      const stat = statSync(fullPath)
      results.push({ name: file, size: stat.size })
    }
  } catch (err) {
    console.error(`Error scanning ${dir}: ${err.message}`)
    console.error('Run "npm run build" first.')
    process.exit(1)
  }
  return results.sort((a, b) => b.size - a.size)
}

// --- Main ---
console.log('Bundle Size Analysis\n')

const chunks = scanChunks(NUXT_DIR)

if (chunks.length === 0) {
  console.error('No JS chunks found. Run "npm run build" first.')
  process.exit(1)
}

const totalSize = chunks.reduce((sum, c) => sum + c.size, 0)
const warnings = chunks.filter((c) => c.size > WARN_THRESHOLD)
const criticals = chunks.filter((c) => c.size > CRITICAL_THRESHOLD)

console.log(`Total chunks: ${chunks.length}`)
console.log(`Total JS size: ${formatSize(totalSize)}`)
console.log(`Chunks > 50KB: ${warnings.length}`)
console.log(`Chunks > 200KB (critical): ${criticals.length}`)

// Top 10
console.log('\nTop 10 largest chunks:')
console.log('-'.repeat(60))
for (const chunk of chunks.slice(0, 10)) {
  const flag = chunk.size > CRITICAL_THRESHOLD ? ' CRITICAL' : chunk.size > WARN_THRESHOLD ? ' WARNING' : ''
  console.log(`  ${formatSize(chunk.size).padStart(10)}  ${chunk.name}${flag}`)
}

// Warnings detail
if (warnings.length > 0) {
  console.log(`\nChunks exceeding 50KB (${warnings.length}):`)
  console.log('-'.repeat(60))
  for (const chunk of warnings) {
    console.log(`  ${formatSize(chunk.size).padStart(10)}  ${chunk.name}`)
  }
}

// Critical check
if (criticals.length > 0) {
  console.log(`\nCRITICAL: ${criticals.length} chunk(s) exceed 200KB:`)
  for (const chunk of criticals) {
    console.log(`  ${formatSize(chunk.size).padStart(10)}  ${chunk.name}`)
  }
  console.log('\nConsider:')
  console.log('  - Dynamic imports (defineAsyncComponent)')
  console.log('  - Manual chunks in nuxt.config.ts vite.build.rollupOptions')
  console.log('  - Tree-shaking unused exports')
  console.log('  - Smaller alternative libraries')
  process.exit(1)
}

console.log('\nAll chunks within acceptable size limits.')
