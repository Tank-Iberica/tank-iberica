import { readFileSync } from 'fs'
const cov = JSON.parse(readFileSync('./coverage/coverage-final.json', 'utf-8'))
const targets = [
  'ServiciosMobileCards.vue',
  'AdminWhatsAppSubmission.vue',
  'ContratoFormActions.vue',
  'HistoricoExportModal.vue',
  'HistoricoRestoreModal.vue',
  'DealerVehicleCard.vue',
]
for (const [p, d] of Object.entries(cov)) {
  const fn = p.replace(/\\/g, '/').split('/').pop()
  if (!targets.includes(fn)) continue
  const s = d.s
  const sm = d.statementMap
  for (const [k, v] of Object.entries(s)) {
    if (v === 0) console.log(`${fn}:${sm[k].start.line} (col ${sm[k].start.column})`)
  }
}
