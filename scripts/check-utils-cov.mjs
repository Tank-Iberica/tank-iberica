import { readFileSync } from 'node:fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))
const targets = [
  'generateDealerCard.ts',
  'generatePdf.ts',
  'invoicePdf.ts',
  'contractGenerator.ts',
  'parseLocation.ts',
  'adminProductosExport.ts',
  'geoData.ts',
  'fuzzyMatch.ts',
  'kmScore.ts',
]
for (const [path, data] of Object.entries(cov)) {
  const fn = path.replace(/\\/g, '/').split('/').pop()
  if (!targets.includes(fn)) continue
  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncovered = total - covered
  const uncovLines = []
  const stmtMap = data.statementMap
  for (const [k, v] of Object.entries(s)) {
    if (v === 0) uncovLines.push(stmtMap[k].start.line)
  }
  console.log(`${fn}: ${covered}/${total} (${Math.round(covered/total*100)}%) uncov=${uncovered}${uncovLines.length ? ' lines: ' + uncovLines.join(',') : ''}`)
}
