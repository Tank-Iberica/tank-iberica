/**
 * Coverage Inventory — Lists all executable files ordered by uncovered statements.
 *
 * Usage: node scripts/coverage-inventory.mjs
 * Prerequisite: npx vitest run --coverage --coverage.reporter=json
 */
import { readFileSync } from 'fs'

const data = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'))

const files = []
for (const [path, info] of Object.entries(data)) {
  const stmts = info.s || {}
  const total = Object.keys(stmts).length
  const covered = Object.values(stmts).filter(v => v > 0).length
  const uncovered = total - covered
  const short = path.includes('Tracciona/')
    ? path.split('Tracciona/').pop()
    : path.includes('Tracciona\\')
      ? path.split('Tracciona\\').pop().replaceAll('\\', '/')
      : path
  files.push({ path: short, statements: total, covered, uncovered, pct: total ? Math.round(covered / total * 1000) / 10 : 100 })
}

files.sort((a, b) => b.uncovered - a.uncovered)

const zero = files.filter(f => f.pct === 0)
const partial = files.filter(f => f.pct > 0 && f.pct < 100)
const full = files.filter(f => f.pct === 100)
const totalUncov = files.reduce((s, f) => s + f.uncovered, 0)
const totalStmts = files.reduce((s, f) => s + f.statements, 0)

console.log(`TOTAL: ${files.length} files, ${totalStmts} statements, ${totalUncov} uncovered`)
console.log(`  0% coverage: ${zero.length} files (${zero.reduce((s, f) => s + f.uncovered, 0)} uncovered stmts)`)
console.log(`  Partial:     ${partial.length} files`)
console.log(`  100%:        ${full.length} files`)
console.log()

let cumulative = 0
console.log('TOP 30 files by uncovered statements (cumulative impact on coverage):')
for (let i = 0; i < Math.min(30, files.length); i++) {
  const f = files[i]
  cumulative += f.uncovered
  const pctOfTotal = (cumulative / totalUncov * 100).toFixed(1)
  console.log(`  ${String(i + 1).padStart(2)}. ${f.path.padEnd(75)} ${String(f.uncovered).padStart(4)} stmts  (cumul: ${pctOfTotal}%)`)
}

console.log()
console.log(`Covering the top 30 files would add ~${(cumulative / totalStmts * 100).toFixed(1)}% to overall coverage.`)
