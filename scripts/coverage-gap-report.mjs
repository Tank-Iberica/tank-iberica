import { readFileSync } from 'fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))

const dirs = {}
let totalStmts = 0, totalCovered = 0

for (const [path, data] of Object.entries(cov)) {
  const norm = path.replace(/\\/g, '/')
  // Extract directory relative to project root
  const match = norm.match(/\/(app|server|tests)\/(.+?)\/[^/]+$/)
  if (!match) continue
  const dir = match[1] + '/' + match[2].split('/')[0]

  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncov = total - covered

  totalStmts += total
  totalCovered += covered

  if (!dirs[dir]) dirs[dir] = { total: 0, covered: 0, uncov: 0, files: 0, uncovFiles: [] }
  dirs[dir].total += total
  dirs[dir].covered += covered
  dirs[dir].uncov += uncov
  dirs[dir].files++

  if (uncov > 0) {
    const fn = norm.split('/').pop()
    dirs[dir].uncovFiles.push({ fn, uncov, total, pct: Math.round(covered/total*100) })
  }
}

console.log(`\n=== COVERAGE GAP REPORT ===`)
console.log(`Total: ${totalCovered}/${totalStmts} (${Math.round(totalCovered/totalStmts*100)}%)\n`)
console.log(`Uncovered stmts by directory (sorted by gap size):\n`)

const sorted = Object.entries(dirs)
  .filter(([, d]) => d.uncov > 0)
  .sort((a, b) => b[1].uncov - a[1].uncov)

for (const [dir, d] of sorted) {
  const pct = Math.round(d.covered / d.total * 100)
  console.log(`${dir}: ${d.covered}/${d.total} (${pct}%) — ${d.uncov} stmts missing, ${d.files} files`)
}

console.log(`\n--- Top 30 files with most uncovered stmts ---\n`)

const allFiles = []
for (const [dir, d] of Object.entries(dirs)) {
  for (const f of d.uncovFiles) {
    allFiles.push({ dir, ...f })
  }
}
allFiles.sort((a, b) => b.uncov - a.uncov)

for (const f of allFiles.slice(0, 30)) {
  console.log(`  ${f.dir}/${f.fn}: ${f.pct}% (${f.uncov} uncov / ${f.total} total)`)
}

console.log(`\n--- Summary by gap size bucket ---\n`)
const buckets = { '0 (100%)': 0, '1-10': 0, '11-50': 0, '51-100': 0, '101-300': 0, '300+': 0 }
for (const f of allFiles) {
  if (f.uncov === 0) buckets['0 (100%)']++
  else if (f.uncov <= 10) buckets['1-10']++
  else if (f.uncov <= 50) buckets['11-50']++
  else if (f.uncov <= 100) buckets['51-100']++
  else if (f.uncov <= 300) buckets['101-300']++
  else buckets['300+']++
}
const totalFiles = Object.values(dirs).reduce((s, d) => s + d.files, 0)
const fullFiles = totalFiles - allFiles.length
console.log(`Files at 100%: ${fullFiles}`)
for (const [bucket, count] of Object.entries(buckets)) {
  if (count > 0 && bucket !== '0 (100%)') console.log(`Files with ${bucket} uncov stmts: ${count}`)
}
console.log(`\nTotal files: ${totalFiles}`)
console.log(`Total uncov stmts: ${totalStmts - totalCovered}`)
