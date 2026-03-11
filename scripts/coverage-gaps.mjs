import { readFileSync } from 'fs'

const cov = JSON.parse(readFileSync('coverage/coverage-final.json', 'utf8'))
const files = Object.keys(cov)

const TARGET_DIRS = ['app/components']

const rows = []
for (const f of files) {
  const normalized = f.split('\\').join('/')
  const idx = normalized.indexOf('Tracciona/')
  const rel = idx >= 0 ? normalized.slice(idx + 'Tracciona/'.length) : normalized
  const topTwo = rel.split('/').slice(0, 2).join('/')
  if (!TARGET_DIRS.includes(topTwo)) continue

  const s = cov[f].s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const missing = total - covered
  if (missing === 0) continue

  // Which statement indices are uncovered?
  const uncoveredLines = Object.entries(s)
    .filter(([, v]) => v === 0)
    .map(([k]) => {
      const loc = cov[f].statementMap[k]
      return loc ? loc.start.line : '?'
    })
    .filter((v, i, a) => a.indexOf(v) === i) // unique lines
    .sort((a, b) => a - b)

  rows.push({ file: rel, pct: Math.round(covered / total * 100), missing, total, lines: uncoveredLines })
}

rows.sort((a, b) => a.missing - b.missing)

for (const r of rows) {
  console.log(`\n${r.file}  (${r.pct}% — ${r.missing}/${r.total} missing)`)
  console.log(`  Uncovered lines: ${r.lines.join(', ')}`)
}
