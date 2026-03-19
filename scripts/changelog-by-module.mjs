#!/usr/bin/env node
/**
 * Changelog by Module Generator (F16)
 * Generates changelogs grouped by domain module from git log.
 * Domains: server/, app/components/, app/composables/, app/pages/, tests/
 *
 * Usage: node scripts/changelog-by-module.mjs [--since 2026-01-01] [--limit 500]
 * Output: docs/changelog-by-module.md
 */

import { execSync } from 'node:child_process'
import { writeFileSync } from 'node:fs'
import { resolve, relative } from 'node:path'

const ROOT = resolve(import.meta.dirname, '..')
const OUTPUT = resolve(ROOT, 'docs/changelog-by-module.md')

const since = process.argv.find((a, i) => process.argv[i - 1] === '--since') || '2026-01-01'
const limit = Number.parseInt(process.argv.find((a, i) => process.argv[i - 1] === '--limit') || '500', 10)

const MODULES = [
  { pattern: 'server/api/', label: 'API Endpoints' },
  { pattern: 'server/utils/', label: 'Server Utils' },
  { pattern: 'server/services/', label: 'Server Services' },
  { pattern: 'app/composables/', label: 'Composables' },
  { pattern: 'app/components/', label: 'Components' },
  { pattern: 'app/pages/', label: 'Pages' },
  { pattern: 'supabase/migrations/', label: 'Database Migrations' },
  { pattern: 'tests/', label: 'Tests' },
  { pattern: 'scripts/', label: 'Scripts' },
  { pattern: '.github/', label: 'CI/CD' },
]

function getCommits() {
  try {
    const raw = execSync(
      `git log --since="${since}" --pretty=format:"%H|||%s|||%ai|||%an" --no-merges -n ${limit}`,
      { cwd: ROOT, encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 },
    )
    return raw.split('\n').filter(Boolean).map((line) => {
      const [hash, subject, date, author] = line.split('|||')
      return { hash: hash.slice(0, 8), subject, date: date.split(' ')[0], author }
    })
  } catch {
    return []
  }
}

function getFilesForCommit(hash) {
  try {
    return execSync(`git diff-tree --no-commit-id --name-only -r ${hash}`, {
      cwd: ROOT,
      encoding: 'utf-8',
      maxBuffer: 5 * 1024 * 1024,
    }).split('\n').filter(Boolean)
  } catch {
    return []
  }
}

function classifyCommit(subject) {
  if (subject.startsWith('feat')) return 'feature'
  if (subject.startsWith('fix')) return 'fix'
  if (subject.startsWith('test')) return 'test'
  if (subject.startsWith('docs')) return 'docs'
  if (subject.startsWith('refactor') || subject.startsWith('chore')) return 'refactor'
  if (subject.startsWith('perf')) return 'perf'
  if (subject.startsWith('style')) return 'style'
  return 'other'
}

// ── Main ──────────────────────────────────────────────────────────────────────

const commits = getCommits()
const moduleCommits = new Map() // label -> commits[]

for (const mod of MODULES) {
  moduleCommits.set(mod.label, [])
}
moduleCommits.set('Other', [])

for (const commit of commits) {
  const files = getFilesForCommit(commit.hash)
  const matched = new Set()

  for (const file of files) {
    for (const mod of MODULES) {
      if (file.startsWith(mod.pattern)) {
        matched.add(mod.label)
      }
    }
  }

  if (matched.size === 0) matched.add('Other')
  for (const label of matched) {
    moduleCommits.get(label)?.push({ ...commit, type: classifyCommit(commit.subject) })
  }
}

// ── Generate markdown ─────────────────────────────────────────────────────────

const md = []
md.push('# Changelog by Module\n')
md.push(`**Generated:** ${new Date().toISOString().split('T')[0]}`)
md.push(`**Period:** Since ${since}`)
md.push(`**Total commits:** ${commits.length}\n`)

// Summary table
md.push('## Summary\n')
md.push('| Module | Commits | Features | Fixes | Tests | Refactors |')
md.push('|--------|---------|----------|-------|-------|-----------|')

for (const [label, cmts] of moduleCommits) {
  if (cmts.length === 0) continue
  const features = cmts.filter((c) => c.type === 'feature').length
  const fixes = cmts.filter((c) => c.type === 'fix').length
  const tests = cmts.filter((c) => c.type === 'test').length
  const refactors = cmts.filter((c) => c.type === 'refactor').length
  md.push(`| ${label} | ${cmts.length} | ${features} | ${fixes} | ${tests} | ${refactors} |`)
}

// Per-module details
for (const [label, cmts] of moduleCommits) {
  if (cmts.length === 0) continue
  md.push(`\n## ${label}\n`)

  // Group by month
  const byMonth = new Map()
  for (const c of cmts) {
    const month = c.date.slice(0, 7) // YYYY-MM
    if (!byMonth.has(month)) byMonth.set(month, [])
    byMonth.get(month).push(c)
  }

  for (const [month, monthCommits] of [...byMonth.entries()].sort((a, b) => b[0].localeCompare(a[0]))) {
    md.push(`### ${month}\n`)
    for (const c of monthCommits) {
      const typeIcon = { feature: '✨', fix: '🐛', test: '🧪', docs: '📝', perf: '⚡', refactor: '♻️', style: '💄', other: '📌' }[c.type]
      md.push(`- ${typeIcon} \`${c.hash}\` ${c.subject}`)
    }
    md.push('')
  }
}

writeFileSync(OUTPUT, md.join('\n'))

console.log(`✅ Changelog by module: ${relative(ROOT, OUTPUT)}`)
console.log(`   ${commits.length} commits since ${since}`)
console.log(`   Modules with activity: ${[...moduleCommits.entries()].filter(([, c]) => c.length > 0).length}`)
