import { readFileSync } from 'fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))

for (const [path, data] of Object.entries(cov)) {
  const norm = path.replace(/\\/g, '/')
  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncov = total - covered
  if (uncov !== 1) continue

  const sm = data.statementMap
  for (const [k, v] of Object.entries(s)) {
    if (v === 0) {
      const loc = sm[k]
      const relPath = norm.replace(/.*?\/(app|server)\//, '$1/')
      console.log(`${relPath}:${loc.start.line}`)
    }
  }
}
