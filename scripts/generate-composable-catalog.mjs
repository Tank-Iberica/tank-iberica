#!/usr/bin/env node
/**
 * generate-composable-catalog.mjs
 *
 * Scans all composables and generates an auto-documented catalog
 * with exports, dependencies, LOC, and module grouping.
 *
 * Usage: node scripts/generate-composable-catalog.mjs [--json] [--markdown]
 */

import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, relative, basename, dirname } from 'node:path'

const COMPOSABLES_DIR = join(process.cwd(), 'app', 'composables')
const OUTPUT_MD = join(process.cwd(), 'docs', 'tracciona-docs', 'referencia', 'COMPOSABLE-CATALOG.md')

/** Recursively find all .ts files in a directory */
function findTsFiles(dir) {
  const results = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findTsFiles(full))
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.spec.ts')) {
      results.push(full)
    }
  }
  return results
}

/** Extract exports from a TS file */
function extractExports(content) {
  const exports = []

  // export function name
  for (const m of content.matchAll(/export\s+function\s+(\w+)/g)) {
    exports.push({ name: m[1], type: 'function' })
  }
  // export const/let/var name
  for (const m of content.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
    exports.push({ name: m[1], type: 'const' })
  }
  // export type/interface name
  for (const m of content.matchAll(/export\s+(?:type|interface)\s+(\w+)/g)) {
    exports.push({ name: m[1], type: 'type' })
  }
  // export default function name
  for (const m of content.matchAll(/export\s+default\s+function\s+(\w+)/g)) {
    exports.push({ name: m[1], type: 'default' })
  }
  // export { ... } from
  for (const m of content.matchAll(/export\s+\{([^}]+)\}\s+from/g)) {
    for (const name of m[1].split(',').map(s => s.trim().split(/\s+as\s+/).pop().trim())) {
      if (name) exports.push({ name, type: 're-export' })
    }
  }

  return exports
}

/** Extract imports/dependencies from a TS file */
function extractDependencies(content) {
  const deps = { composables: [], utils: [], external: [] }

  for (const m of content.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
    const src = m[1]
    if (src.startsWith('~/composables/') || src.startsWith('../') || src.startsWith('./')) {
      if (src.includes('composable') || src.startsWith('~/composables/') || src.startsWith('./use') || src.startsWith('../use')) {
        deps.composables.push(src)
      } else {
        deps.utils.push(src)
      }
    } else if (src.startsWith('~/utils/') || src.startsWith('~/types/')) {
      deps.utils.push(src)
    } else if (!src.startsWith('vue') && !src.startsWith('#')) {
      deps.external.push(src)
    }
  }

  return deps
}

/** Count lines of code (non-empty, non-comment) */
function countLOC(content) {
  const lines = content.split('\n')
  let loc = 0
  let inBlock = false
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('/*')) inBlock = true
    if (inBlock) {
      if (trimmed.includes('*/')) inBlock = false
      continue
    }
    if (trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('*')) continue
    loc++
  }
  return loc
}

/** Determine module group from path */
function getModule(filePath) {
  const rel = relative(COMPOSABLES_DIR, filePath)
  const dir = dirname(rel)
  if (dir === '.') return 'root'
  return dir.replace(/\\/g, '/')
}

// ---- Main ----
const files = findTsFiles(COMPOSABLES_DIR)
const catalog = []

for (const file of files) {
  const content = readFileSync(file, 'utf-8')
  const rel = relative(COMPOSABLES_DIR, file).replace(/\\/g, '/')
  const name = basename(file, '.ts')
  const exports_ = extractExports(content)
  const deps = extractDependencies(content)
  const loc = countLOC(content)
  const module = getModule(file)

  catalog.push({ name, path: rel, module, loc, exports: exports_, deps })
}

// Sort by module then name
catalog.sort((a, b) => a.module.localeCompare(b.module) || a.name.localeCompare(b.name))

// ---- Generate Markdown ----
const outputJson = process.argv.includes('--json')

if (outputJson) {
  console.log(JSON.stringify(catalog, null, 2))
  process.exit(0)
}

const modules = [...new Set(catalog.map(c => c.module))]
const totalLOC = catalog.reduce((sum, c) => sum + c.loc, 0)
const totalExports = catalog.reduce((sum, c) => sum + c.exports.length, 0)

let md = `# Composable Catalog — Tracciona

> Auto-generado por \`scripts/generate-composable-catalog.mjs\`
> Última generación: ${new Date().toISOString().split('T')[0]}

## Resumen

| Métrica | Valor |
|---|---|
| Total composables | ${catalog.length} |
| Total LOC | ${totalLOC.toLocaleString()} |
| Total exports | ${totalExports} |
| Módulos | ${modules.length} |

## Por módulo

`

for (const mod of modules) {
  const items = catalog.filter(c => c.module === mod)
  const modLOC = items.reduce((s, c) => s + c.loc, 0)
  md += `### ${mod === 'root' ? 'Raíz (app/composables/)' : `${mod}/`} — ${items.length} archivos, ${modLOC} LOC\n\n`
  md += `| Composable | LOC | Exports | Deps |\n|---|---|---|---|\n`

  for (const item of items) {
    const exportNames = item.exports.map(e => `\`${e.name}\``).join(', ') || '—'
    const depCount = item.deps.composables.length + item.deps.utils.length
    md += `| \`${item.name}\` | ${item.loc} | ${exportNames} | ${depCount} |\n`
  }
  md += '\n'
}

// Dependency graph summary
md += `## Composables con más dependencias\n\n`
const topDeps = [...catalog].sort((a, b) => {
  const aDeps = a.deps.composables.length + a.deps.utils.length
  const bDeps = b.deps.composables.length + b.deps.utils.length
  return bDeps - aDeps
}).slice(0, 15)

md += `| Composable | Módulo | Deps composables | Deps utils |\n|---|---|---|---|\n`
for (const item of topDeps) {
  md += `| \`${item.name}\` | ${item.module} | ${item.deps.composables.length} | ${item.deps.utils.length} |\n`
}
md += '\n'

// Largest files
md += `## Composables más grandes (LOC)\n\n`
const topLOC = [...catalog].sort((a, b) => b.loc - a.loc).slice(0, 15)
md += `| Composable | Módulo | LOC | Exports |\n|---|---|---|---|\n`
for (const item of topLOC) {
  md += `| \`${item.name}\` | ${item.module} | ${item.loc} | ${item.exports.length} |\n`
}
md += '\n'

writeFileSync(OUTPUT_MD, md, 'utf-8')
console.log(`✅ Catalog generated: ${OUTPUT_MD}`)
console.log(`   ${catalog.length} composables, ${totalLOC} LOC, ${totalExports} exports`)
