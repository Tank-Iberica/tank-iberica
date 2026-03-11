import { readFileSync } from 'fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))

const small = []   // 1-10 uncov
const medium = []  // 11-50 uncov in composables or server/api

for (const [path, data] of Object.entries(cov)) {
  const norm = path.replace(/\\/g, '/')
  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncov = total - covered
  if (uncov === 0) continue

  const fn = norm.split('/').pop()
  const relPath = norm.replace(/.*?\/(app|server)\//, '$1/')

  const uncovLines = []
  const sm = data.statementMap
  for (const [k, v] of Object.entries(s)) {
    if (v === 0) uncovLines.push(sm[k].start.line)
  }

  const entry = { relPath, fn, uncov, total, pct: Math.round(covered/total*100), lines: uncovLines.slice(0, 15).join(',') }

  if (uncov >= 1 && uncov <= 10) {
    small.push(entry)
  } else if (uncov >= 11 && uncov <= 50) {
    if (norm.includes('/composables/') || norm.includes('/server/api/')) {
      medium.push(entry)
    }
  }
}

small.sort((a, b) => a.uncov - b.uncov)
medium.sort((a, b) => a.uncov - b.uncov)

console.log(`\n=== SMALL GAPS (1-10 stmts) — ${small.length} files, ${small.reduce((s,f) => s+f.uncov, 0)} stmts ===\n`)
for (const f of small) {
  console.log(`[${f.uncov}] ${f.relPath} (${f.pct}%) L:${f.lines}`)
}

console.log(`\n=== MEDIUM GAPS (11-50 stmts, composables+server/api) — ${medium.length} files, ${medium.reduce((s,f) => s+f.uncov, 0)} stmts ===\n`)
for (const f of medium) {
  console.log(`[${f.uncov}] ${f.relPath} (${f.pct}%) L:${f.lines}`)
}

console.log(`\n=== TOTALS ===`)
console.log(`Small: ${small.length} files, ${small.reduce((s,f) => s+f.uncov, 0)} stmts`)
console.log(`Medium: ${medium.length} files, ${medium.reduce((s,f) => s+f.uncov, 0)} stmts`)
console.log(`Combined: ${small.length + medium.length} files, ${small.reduce((s,f) => s+f.uncov, 0) + medium.reduce((s,f) => s+f.uncov, 0)} stmts`)
