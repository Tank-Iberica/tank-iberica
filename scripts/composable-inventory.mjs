#!/usr/bin/env node
/**
 * Composable Inventory Generator (F44)
 * Generates a detailed catalog of all composables with:
 * - Name, file path, line count
 * - Exported functions/constants
 * - Dependencies on other composables
 * - Domain classification (admin, dashboard, shared, etc.)
 * - Whether test file exists
 *
 * Usage: node scripts/composable-inventory.mjs
 * Output: docs/composable-inventory.md + docs/composable-inventory.json
 */

import { readFileSync, writeFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { resolve, relative, basename, dirname } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const COMPOSABLES_DIR = resolve(ROOT, 'app/composables')
const TESTS_DIR = resolve(ROOT, 'tests')
const OUTPUT_MD = resolve(ROOT, 'docs/composable-inventory.md')
const OUTPUT_JSON = resolve(ROOT, 'docs/composable-inventory.json')

function getAllFiles(dir) {
  const files = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) files.push(...getAllFiles(full))
      else if (entry.name.endsWith('.ts')) files.push(full)
    }
  } catch { /* skip */ }
  return files
}

function countLines(filePath) {
  return readFileSync(filePath, 'utf-8').split('\n').length
}

function extractExports(content) {
  const exports = []
  const funcRegex = /export\s+(?:async\s+)?function\s+(\w+)/g
  const constRegex = /export\s+const\s+(\w+)/g
  const typeRegex = /export\s+(?:type|interface)\s+(\w+)/g
  let m
  while ((m = funcRegex.exec(content)) !== null) exports.push({ name: m[1], kind: 'function' })
  while ((m = constRegex.exec(content)) !== null) exports.push({ name: m[1], kind: 'const' })
  while ((m = typeRegex.exec(content)) !== null) exports.push({ name: m[1], kind: 'type' })
  return exports
}

function extractDeps(content, allComposableNames) {
  const deps = []
  for (const name of allComposableNames) {
    const regex = new RegExp(`\\b${name}\\s*\\(`, 'g')
    if (regex.test(content)) deps.push(name)
  }
  return deps
}

function classifyDomain(filePath) {
  const rel = relative(COMPOSABLES_DIR, filePath).replace(/\\/g, '/')
  if (rel.startsWith('admin/')) return 'admin'
  if (rel.startsWith('dashboard/')) return 'dashboard'
  if (rel.startsWith('shared/')) return 'shared'
  const name = basename(filePath, '.ts')
  if (name.includes('Admin')) return 'admin'
  if (name.includes('Dashboard') || name.includes('Dealer')) return 'dashboard'
  if (name.includes('Vehicle') || name.includes('Catalog')) return 'vehicles'
  if (name.includes('Auth') || name.includes('Mfa') || name.includes('Security')) return 'auth'
  if (name.includes('Analytics') || name.includes('Tracking')) return 'analytics'
  if (name.includes('Market') || name.includes('Price')) return 'market'
  if (name.includes('Vertical') || name.includes('i18n') || name.includes('Locale')) return 'multi-vertical'
  return 'core'
}

function findTestFile(composableName) {
  const patterns = [
    `${composableName}.test.ts`,
    `${composableName.replace(/^use/, '')}.test.ts`,
  ]
  const searchDirs = [TESTS_DIR]
  function search(dir) {
    try {
      for (const entry of readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          const result = search(resolve(dir, entry.name))
          if (result) return result
        } else if (patterns.some((p) => entry.name === p || entry.name.toLowerCase() === p.toLowerCase())) {
          return relative(ROOT, resolve(dir, entry.name)).replace(/\\/g, '/')
        }
      }
    } catch { /* skip */ }
    return null
  }
  return search(TESTS_DIR)
}

// ── Main ──────────────────────────────────────────────────────────────────────

const files = getAllFiles(COMPOSABLES_DIR)
const inventory = []

// First pass: collect all composable names
const allNames = []
for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const exports = extractExports(content)
  for (const exp of exports) {
    if (exp.name.startsWith('use') && exp.kind === 'function') {
      allNames.push(exp.name)
    }
  }
}

// Second pass: build full inventory
for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const relPath = relative(ROOT, file).replace(/\\/g, '/')
  const exports = extractExports(content)
  const composableExports = exports.filter((e) => e.name.startsWith('use') && e.kind === 'function')
  const deps = extractDeps(content, allNames)
  const selfNames = composableExports.map((e) => e.name)
  const externalDeps = deps.filter((d) => !selfNames.includes(d))

  for (const exp of composableExports) {
    const testFile = findTestFile(exp.name)
    inventory.push({
      name: exp.name,
      file: relPath,
      lines: countLines(file),
      domain: classifyDomain(file),
      exports: exports.map((e) => `${e.kind} ${e.name}`),
      dependencies: externalDeps,
      hasTests: testFile !== null,
      testFile: testFile,
    })
  }
}

// Sort by domain then name
inventory.sort((a, b) => a.domain.localeCompare(b.domain) || a.name.localeCompare(b.name))

// ── Generate markdown ─────────────────────────────────────────────────────────

const md = []
md.push('# Composable Inventory\n')
md.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
md.push(`**Total composables:** ${inventory.length}`)
md.push(`**With tests:** ${inventory.filter((c) => c.hasTests).length} (${Math.round((inventory.filter((c) => c.hasTests).length / inventory.length) * 100)}%)`)
md.push(`**Files scanned:** ${files.length}\n`)

// Summary by domain
const domains = new Map()
for (const c of inventory) {
  if (!domains.has(c.domain)) domains.set(c.domain, { count: 0, tested: 0, totalLines: 0 })
  const d = domains.get(c.domain)
  d.count++
  if (c.hasTests) d.tested++
  d.totalLines += c.lines
}

md.push('## Summary by Domain\n')
md.push('| Domain | Count | Tested | Lines |')
md.push('|--------|-------|--------|-------|')
for (const [domain, stats] of [...domains.entries()].sort((a, b) => b[1].count - a[1].count)) {
  md.push(`| ${domain} | ${stats.count} | ${stats.tested}/${stats.count} | ${stats.totalLines} |`)
}

// Full inventory
md.push('\n## Full Inventory\n')
let currentDomain = ''
for (const c of inventory) {
  if (c.domain !== currentDomain) {
    currentDomain = c.domain
    md.push(`\n### ${currentDomain}\n`)
    md.push('| Composable | File | Lines | Deps | Tests |')
    md.push('|------------|------|-------|------|-------|')
  }
  const testIcon = c.hasTests ? '✅' : '❌'
  md.push(`| \`${c.name}\` | \`${c.file}\` | ${c.lines} | ${c.dependencies.length} | ${testIcon} |`)
}

// Large composables (>300 lines)
const large = inventory.filter((c) => c.lines > 300).sort((a, b) => b.lines - a.lines)
if (large.length > 0) {
  md.push('\n## Large Composables (>300 lines)\n')
  md.push('| Composable | Lines | File |')
  md.push('|------------|-------|------|')
  for (const c of large) {
    md.push(`| \`${c.name}\` | ${c.lines} | \`${c.file}\` |`)
  }
}

// Untested composables
const untested = inventory.filter((c) => !c.hasTests)
if (untested.length > 0) {
  md.push('\n## Untested Composables\n')
  md.push('| Composable | Domain | Lines |')
  md.push('|------------|--------|-------|')
  for (const c of untested) {
    md.push(`| \`${c.name}\` | ${c.domain} | ${c.lines} |`)
  }
}

writeFileSync(OUTPUT_MD, md.join('\n'))
writeFileSync(OUTPUT_JSON, JSON.stringify(inventory, null, 2))

console.log(`✅ Composable inventory generated:`)
console.log(`   ${relative(ROOT, OUTPUT_MD)} (${inventory.length} composables)`)
console.log(`   ${relative(ROOT, OUTPUT_JSON)} (JSON)`)
console.log(`   Domains: ${[...domains.keys()].join(', ')}`)
console.log(`   Tested: ${inventory.filter((c) => c.hasTests).length}/${inventory.length}`)
