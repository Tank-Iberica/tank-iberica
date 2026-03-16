#!/usr/bin/env node
/**
 * generate-changelog-by-module.mjs
 *
 * Parses git log and generates a per-module changelog grouped by directory.
 * Useful for understanding what changed in each area of the codebase.
 *
 * Usage:
 *   node scripts/generate-changelog-by-module.mjs [--since=2026-01-01] [--until=2026-12-31] [--limit=500] [--json]
 *
 * Defaults to last 90 days.
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'

const OUTPUT_MD = join(process.cwd(), 'docs', 'tracciona-docs', 'referencia', 'CHANGELOG-POR-MODULO.md')

// ---- Parse CLI args ----
const args = process.argv.slice(2)
function getArg(name, fallback) {
  const found = args.find(a => a.startsWith(`--${name}=`))
  return found ? found.split('=')[1] : fallback
}

const outputJson = args.includes('--json')
const limit = Number.parseInt(getArg('limit', '500'), 10)

const defaultSince = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
const since = getArg('since', defaultSince)
const until = getArg('until', '')

// ---- Module mapping ----
const MODULE_MAP = [
  { prefix: 'app/components/admin/', module: 'admin-components' },
  { prefix: 'app/components/dashboard/', module: 'dashboard-components' },
  { prefix: 'app/components/catalog/', module: 'catalog-components' },
  { prefix: 'app/components/vehicle/', module: 'vehicle-components' },
  { prefix: 'app/components/auction/', module: 'auction-components' },
  { prefix: 'app/components/subastas/', module: 'subastas-components' },
  { prefix: 'app/components/auth/', module: 'auth-components' },
  { prefix: 'app/components/modals/', module: 'modals' },
  { prefix: 'app/components/layout/', module: 'layout' },
  { prefix: 'app/components/perfil/', module: 'perfil-components' },
  { prefix: 'app/components/ui/', module: 'ui-components' },
  { prefix: 'app/components/shared/', module: 'shared-components' },
  { prefix: 'app/components/', module: 'other-components' },
  { prefix: 'app/composables/admin/', module: 'admin-composables' },
  { prefix: 'app/composables/dashboard/', module: 'dashboard-composables' },
  { prefix: 'app/composables/catalog/', module: 'catalog-composables' },
  { prefix: 'app/composables/', module: 'composables' },
  { prefix: 'app/pages/admin/', module: 'admin-pages' },
  { prefix: 'app/pages/dashboard/', module: 'dashboard-pages' },
  { prefix: 'app/pages/auth/', module: 'auth-pages' },
  { prefix: 'app/pages/perfil/', module: 'perfil-pages' },
  { prefix: 'app/pages/', module: 'pages' },
  { prefix: 'app/utils/', module: 'utils' },
  { prefix: 'app/plugins/', module: 'plugins' },
  { prefix: 'app/assets/', module: 'assets-css' },
  { prefix: 'server/api/cron/', module: 'server-cron' },
  { prefix: 'server/api/infra/', module: 'server-infra' },
  { prefix: 'server/api/stripe/', module: 'server-stripe' },
  { prefix: 'server/api/', module: 'server-api' },
  { prefix: 'server/middleware/', module: 'server-middleware' },
  { prefix: 'server/utils/', module: 'server-utils' },
  { prefix: 'server/', module: 'server-other' },
  { prefix: 'supabase/migrations/', module: 'migrations' },
  { prefix: 'tests/', module: 'tests' },
  { prefix: 'scripts/', module: 'scripts' },
  { prefix: 'docs/', module: 'docs' },
  { prefix: '.github/', module: 'ci-cd' },
  { prefix: 'i18n/', module: 'i18n' },
  { prefix: '.claude/', module: 'claude-config' },
]

function getModule(filePath) {
  for (const { prefix, module } of MODULE_MAP) {
    if (filePath.startsWith(prefix)) return module
  }
  return 'root-config'
}

// ---- Parse conventional commit type ----
function getCommitType(message) {
  const match = message.match(/^(\w+)(?:\([^)]*\))?:\s/)
  if (!match) return 'other'
  const type = match[1].toLowerCase()
  const typeMap = {
    feat: 'feature',
    fix: 'fix',
    chore: 'chore',
    docs: 'docs',
    test: 'test',
    refactor: 'refactor',
    perf: 'perf',
    style: 'style',
    ci: 'ci',
  }
  return typeMap[type] || 'other'
}

// ---- Get git log ----
let gitCmd = `git log --pretty=format:"%H|%as|%s" --name-only --no-merges -${limit}`
if (since) gitCmd += ` --since="${since}"`
if (until) gitCmd += ` --until="${until}"`

let raw
try {
  raw = execSync(gitCmd, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 })
} catch (e) {
  console.error('Failed to run git log:', e.message)
  process.exit(1)
}

// ---- Parse commits ----
const commits = []
const blocks = raw.split('\n\n')

for (const block of blocks) {
  const lines = block.trim().split('\n')
  if (lines.length === 0 || !lines[0]) continue

  const headerLine = lines[0]
  const parts = headerLine.split('|')
  if (parts.length < 3) continue

  const hash = parts[0]
  const date = parts[1]
  const message = parts.slice(2).join('|')
  const files = lines.slice(1).filter(f => f.trim() !== '')

  commits.push({ hash: hash.slice(0, 7), date, message, type: getCommitType(message), files })
}

// ---- Group by module ----
/** @type {Record<string, Array<{hash: string, date: string, message: string, type: string, files: string[]}>>} */
const byModule = {}

for (const commit of commits) {
  const modulesForCommit = new Set()
  for (const file of commit.files) {
    modulesForCommit.add(getModule(file))
  }

  for (const mod of modulesForCommit) {
    if (!byModule[mod]) byModule[mod] = []
    const relevantFiles = commit.files.filter(f => getModule(f) === mod)
    byModule[mod].push({ ...commit, files: relevantFiles })
  }
}

// ---- JSON output ----
if (outputJson) {
  console.log(JSON.stringify(byModule, null, 2))
  process.exit(0)
}

// ---- Generate Markdown ----
const moduleNames = Object.keys(byModule).sort()
const totalCommits = commits.length
const dateRange = since + (until ? ` → ${until}` : ' → hoy')

let md = `# Changelog por Módulo — Tracciona

> Auto-generado por \`scripts/generate-changelog-by-module.mjs\`
> Rango: ${dateRange} | ${totalCommits} commits analizados
> Generado: ${new Date().toISOString().split('T')[0]}

## Resumen

| Módulo | Commits | Features | Fixes | Refactors |
|---|---|---|---|---|
`

for (const mod of moduleNames) {
  const entries = byModule[mod]
  const features = entries.filter(e => e.type === 'feature').length
  const fixes = entries.filter(e => e.type === 'fix').length
  const refactors = entries.filter(e => e.type === 'refactor').length
  md += `| ${mod} | ${entries.length} | ${features} | ${fixes} | ${refactors} |\n`
}

md += `\n---\n\n`

// ---- Per-module detail ----
for (const mod of moduleNames) {
  const entries = byModule[mod]
  md += `## ${mod} (${entries.length} commits)\n\n`

  // Group by type
  const byType = {}
  for (const e of entries) {
    if (!byType[e.type]) byType[e.type] = []
    byType[e.type].push(e)
  }

  const typeOrder = ['feature', 'fix', 'refactor', 'perf', 'test', 'docs', 'chore', 'ci', 'style', 'other']
  for (const type of typeOrder) {
    if (!byType[type]) continue
    md += `### ${type} (${byType[type].length})\n\n`
    for (const e of byType[type]) {
      const filesStr = e.files.length <= 3
        ? e.files.map(f => `\`${f}\``).join(', ')
        : `${e.files.length} archivos`
      md += `- \`${e.hash}\` ${e.date} — ${e.message} (${filesStr})\n`
    }
    md += '\n'
  }
}

// ---- Activity heatmap (commits per day) ----
md += `## Actividad diaria\n\n`
const byDate = {}
for (const c of commits) {
  byDate[c.date] = (byDate[c.date] || 0) + 1
}
const dates = Object.keys(byDate).sort()
if (dates.length > 0) {
  md += `| Fecha | Commits |\n|---|---|\n`
  for (const d of dates.slice(-30)) {
    const bar = '#'.repeat(Math.min(byDate[d], 40))
    md += `| ${d} | ${byDate[d]} ${bar} |\n`
  }
  md += '\n'
}

writeFileSync(OUTPUT_MD, md, 'utf-8')
console.log(`Changelog generated: ${OUTPUT_MD}`)
console.log(`  ${totalCommits} commits, ${moduleNames.length} modules, range: ${dateRange}`)
