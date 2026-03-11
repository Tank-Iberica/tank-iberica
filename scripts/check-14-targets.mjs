import { readFileSync } from 'fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))
const targets = ['health.get.ts','merchant-feed.get.ts','try-vehicle.post.ts','slow-queries.get.ts','redirects.ts','whatsappProcessor.ts','useAuctionRegistration.ts','useFormValidation.ts','useNews.ts','useAdminMetrics.ts','useAdminVerticalConfig.ts']
// These have ambiguous names — match by path
const pathTargets = [
  { pattern: 'infra/alerts', name: 'alerts/[id].patch.ts' },
  { pattern: 'clusters/index.get', name: 'clusters/index.get.ts' },
  { pattern: 'prepare-migration', name: 'prepare-migration.post.ts' },
]
for (const [path, data] of Object.entries(cov)) {
  const norm = path.replace(/\\/g, '/')
  const fn = norm.split('/').pop()
  const matchTarget = targets.includes(fn)
  const matchPath = pathTargets.find(t => norm.includes(t.pattern))
  if (!matchTarget && !matchPath) continue
  const s = data.s
  const total = Object.keys(s).length
  const covered = Object.values(s).filter(v => v > 0).length
  const uncov = total - covered
  const lines = []
  if (uncov > 0) {
    const sm = data.statementMap
    for (const [k,v] of Object.entries(s)) { if (v === 0) lines.push(sm[k].start.line) }
  }
  const label = matchPath ? matchPath.name : fn
  console.log(`${label}: ${covered}/${total} (${Math.round(covered/total*100)}%)${uncov > 0 ? ' UNCOV: ' + lines.join(',') : ' FULL'}`)
}
