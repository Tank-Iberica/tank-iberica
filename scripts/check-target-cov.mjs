import { readFileSync } from 'node:fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))
const targets = ['kmScore.ts', 'fuzzyMatch.ts', 'default.vue', 'admin.vue', 'adminProductosExport.ts', 'contractGenerator.ts', 'generateDealerCard.ts', 'generatePdf.ts', 'geoData.ts', 'invoicePdf.ts', 'parseLocation.ts']
for (const [path, data] of Object.entries(cov)) {
  const fn = path.replace(/\\/g, '/').split('/').pop()
  if (!targets.includes(fn)) continue
  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncovLines = []
  const stmtMap = data.statementMap
  for (const [k, v] of Object.entries(s)) {
    if (v === 0) uncovLines.push(stmtMap[k].start.line)
  }
  console.log(`${fn}: ${covered}/${total} (${Math.round(covered/total*100)}%)${uncovLines.length ? ' uncov: ' + uncovLines.join(',') : ' FULL 100%'}`)
}
