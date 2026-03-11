import { readFileSync, existsSync } from 'fs'
import { basename } from 'path'

const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))
const gaps = []

for (const [k, data] of Object.entries(cov)) {
  const s = data.s
  const total = Object.keys(s).length
  if (total === 0) continue
  const covered = Object.values(s).filter(x => x > 0).length
  const uncovered = total - covered
  if (uncovered < 11 || uncovered > 50) continue
  const pct = Math.round(covered / total * 100)
  const norm = k.replace(/\\/g, '/')
  if (!norm.includes('composables/')) continue
  if (pct === 0) continue

  const bn = basename(norm, '.ts')
  const hasTest = existsSync(`tests/unit/${bn}.test.ts`)
  if (!hasTest) continue

  const sm = data.statementMap
  const uncLines = []
  for (const [idx, count] of Object.entries(s)) {
    if (count === 0 && sm[idx]) uncLines.push(sm[idx].start.line)
  }

  gaps.push({ file: norm.substring(norm.indexOf('app')), uncovered, total, pct, lines: uncLines.slice(0, 10).join(',') })
}

gaps.sort((a, b) => b.uncovered - a.uncovered)
console.log(`Composables with tests + 11-50 gaps: ${gaps.length} files, ${gaps.reduce((s, g) => s + g.uncovered, 0)} stmts`)
for (const g of gaps) {
  console.log(`[${g.uncovered}] ${g.file} (${g.pct}%) L:${g.lines}`)
}
