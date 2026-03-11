import { readFileSync } from 'fs'

const cov = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'))
const files = Object.keys(cov)
const dirs = {}

for (const f of files) {
  const normalized = f.split('\\').join('/')
  const idx = normalized.indexOf('Tracciona/')
  const rel = idx >= 0 ? normalized.slice(idx + 'Tracciona/'.length) : normalized
  const parts = rel.split('/')
  const dir = parts.slice(0, 2).join('/')
  if (!dirs[dir]) dirs[dir] = { stmts: 0, stmtsCov: 0 }
  const s = cov[f].s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  dirs[dir].stmts += total
  dirs[dir].stmtsCov += covered
}

const sorted = Object.entries(dirs)
  .map(([d, v]) => ({ dir: d, pct: v.stmts ? Math.round(v.stmtsCov / v.stmts * 100) : 0, missing: v.stmts - v.stmtsCov, total: v.stmts }))
  .sort((a, b) => a.pct - b.pct)

console.log('Directory'.padEnd(42) + 'Cov%'.padStart(6) + '  Missing'.padStart(10) + '  Total'.padStart(8))
console.log('-'.repeat(68))
for (const r of sorted) {
  console.log(r.dir.padEnd(42) + (r.pct + '%').padStart(6) + String(r.missing).padStart(10) + String(r.total).padStart(8))
}
console.log('-'.repeat(68))
const totalMissing = sorted.reduce((a, r) => a + r.missing, 0)
const totalStmts = sorted.reduce((a, r) => a + r.total, 0)
console.log('TOTAL'.padEnd(42) + (Math.round((totalStmts - totalMissing) / totalStmts * 100) + '%').padStart(6) + String(totalMissing).padStart(10) + String(totalStmts).padStart(8))
