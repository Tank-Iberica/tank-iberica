#!/usr/bin/env node
/**
 * Coupling Metrics Calculator (F48)
 * Calculates afferent (Ca) and efferent (Ce) coupling per module.
 * - Ca = number of modules that depend on this module (incoming)
 * - Ce = number of modules this module depends on (outgoing)
 * - Instability = Ce / (Ca + Ce) — 0=stable, 1=unstable
 *
 * Modules with high Ca AND high Ce are problematic (hub modules).
 *
 * Usage: node scripts/coupling-metrics.mjs [--threshold 10]
 * Output: docs/coupling-metrics.md
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT = resolve(ROOT, 'docs/coupling-metrics.md')
const THRESHOLD = Number.parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--threshold') || '10', 10)

const SCAN_DIRS = [
  { dir: 'app/composables', label: 'composables' },
  { dir: 'app/components', label: 'components' },
  { dir: 'app/pages', label: 'pages' },
  { dir: 'app/utils', label: 'app-utils' },
  { dir: 'server/api', label: 'api' },
  { dir: 'server/utils', label: 'server-utils' },
  { dir: 'server/services', label: 'services' },
]

function getAllFiles(dir, exts = ['.ts', '.vue']) {
  const files = []
  try {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = resolve(dir, entry.name)
      if (entry.isDirectory()) files.push(...getAllFiles(full, exts))
      else if (exts.some((e) => entry.name.endsWith(e))) files.push(full)
    }
  } catch { /* skip */ }
  return files
}

function extractImports(content) {
  const imports = []
  const regex = /(?:import|from)\s+['"]([^'"]+)['"]/g
  let m
  while ((m = regex.exec(content)) !== null) {
    imports.push(m[1])
  }
  return imports
}

function resolveModule(importPath) {
  // Map import paths to module labels
  if (importPath.includes('/composables/')) return 'composables'
  if (importPath.includes('/components/')) return 'components'
  if (importPath.includes('/pages/')) return 'pages'
  if (importPath.includes('/app/utils/') || importPath.match(/~\/utils\//)) return 'app-utils'
  if (importPath.includes('/server/utils/') || importPath.match(/\.\.\/utils\//)) return 'server-utils'
  if (importPath.includes('/server/services/') || importPath.match(/\.\.\/services\//)) return 'services'
  if (importPath.includes('/server/api/') || importPath.match(/\.\.\/api\//)) return 'api'
  if (importPath.startsWith('~~') || importPath.startsWith('~~/')) {
    if (importPath.includes('/composables/')) return 'composables'
    if (importPath.includes('/components/')) return 'components'
    if (importPath.includes('/utils/')) return importPath.includes('server') ? 'server-utils' : 'app-utils'
    if (importPath.includes('/services/')) return 'services'
  }
  return null // external or unresolvable
}

// ── Collect all files and their imports ───────────────────────────────────────

const moduleFiles = new Map() // label -> files[]
const allFiles = []

for (const { dir, label } of SCAN_DIRS) {
  const dirPath = resolve(ROOT, dir)
  const files = getAllFiles(dirPath)
  moduleFiles.set(label, files)
  for (const f of files) allFiles.push({ file: f, module: label })
}

// ── Calculate coupling ────────────────────────────────────────────────────────

const ca = new Map() // afferent: who depends on me
const ce = new Map() // efferent: who I depend on

for (const label of SCAN_DIRS.map((s) => s.label)) {
  ca.set(label, new Set())
  ce.set(label, new Set())
}

for (const { file, module: sourceModule } of allFiles) {
  const content = readFileSync(file, 'utf-8')
  const imports = extractImports(content)
  for (const imp of imports) {
    const targetModule = resolveModule(imp)
    if (targetModule && targetModule !== sourceModule && ca.has(targetModule)) {
      ce.get(sourceModule)?.add(targetModule)
      ca.get(targetModule)?.add(sourceModule)
    }
  }
}

// ── Generate report ───────────────────────────────────────────────────────────

const metrics = []
for (const label of SCAN_DIRS.map((s) => s.label)) {
  const caCount = ca.get(label)?.size || 0
  const ceCount = ce.get(label)?.size || 0
  const instability = caCount + ceCount > 0 ? ceCount / (caCount + ceCount) : 0
  const fileCount = moduleFiles.get(label)?.length || 0
  metrics.push({ module: label, ca: caCount, ce: ceCount, instability, files: fileCount })
}

metrics.sort((a, b) => (b.ca + b.ce) - (a.ca + a.ce))

const md = []
md.push('# Coupling Metrics Report\n')
md.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
md.push(`**Threshold:** Ca+Ce > ${THRESHOLD} flagged as high coupling\n`)
md.push('## Module Coupling\n')
md.push('| Module | Files | Ca (incoming) | Ce (outgoing) | Total | Instability | Flag |')
md.push('|--------|-------|---------------|---------------|-------|-------------|------|')

for (const m of metrics) {
  const total = m.ca + m.ce
  const flag = total > THRESHOLD ? '⚠️ HIGH' : ''
  md.push(`| ${m.module} | ${m.files} | ${m.ca} | ${m.ce} | ${total} | ${m.instability.toFixed(2)} | ${flag} |`)
}

md.push('\n## Interpretation\n')
md.push('- **Ca (Afferent):** How many modules depend on this one. High Ca = stable, hard to change.')
md.push('- **Ce (Efferent):** How many modules this depends on. High Ce = fragile, many reasons to change.')
md.push('- **Instability:** Ce/(Ca+Ce). 0=maximally stable, 1=maximally unstable.')
md.push('- **Flag:** Modules with Ca+Ce > threshold are hub modules that may need refactoring.\n')

// Dependency details
md.push('## Dependency Details\n')
for (const m of metrics) {
  const caSet = ca.get(m.module)
  const ceSet = ce.get(m.module)
  if ((caSet?.size || 0) + (ceSet?.size || 0) > 0) {
    md.push(`### ${m.module}`)
    if (caSet?.size) md.push(`- **Depended on by:** ${[...caSet].join(', ')}`)
    if (ceSet?.size) md.push(`- **Depends on:** ${[...ceSet].join(', ')}`)
    md.push('')
  }
}

writeFileSync(OUTPUT, md.join('\n'))

const flagged = metrics.filter((m) => m.ca + m.ce > THRESHOLD)
console.log(`✅ Coupling metrics: ${relative(ROOT, OUTPUT)}`)
console.log(`   ${metrics.length} modules analyzed`)
if (flagged.length > 0) {
  console.log(`   ⚠️  ${flagged.length} modules exceed threshold (${THRESHOLD}): ${flagged.map((m) => m.module).join(', ')}`)
} else {
  console.log(`   All modules within threshold (${THRESHOLD})`)
}
