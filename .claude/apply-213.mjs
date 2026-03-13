#!/usr/bin/env node
/**
 * Atomic write + stage for #213 changes.
 * Run: node .claude/apply-213.mjs
 */
import { writeFileSync, readFileSync } from 'fs'
import { execSync } from 'child_process'

const billingPath = 'server/services/billing.ts'
const exportPath = 'server/api/invoicing/export-csv.get.ts'
const createInvPath = 'server/api/invoicing/create-invoice.post.ts'

// Check if billing already has changes
const billing = readFileSync(billingPath, 'utf8')
if (billing.includes('AutoInvoiceResult')) {
  console.log('billing.ts already has #213 changes, skipping write')
} else {
  const newBilling = billing
    .replace(
      `/**\n * Billing Service`,
      `/**\n * Billing Service`
    )
  // Replace the entire file
  const lines = billing.split('\n')

  // Find the createAutoInvoice function start
  const funcStartIdx = lines.findIndex(l => l.includes('export async function createAutoInvoice'))

  // Insert import after the doc comment block
  const insertImportAfter = lines.findIndex(l => l.includes('*/'))

  if (insertImportAfter >= 0 && funcStartIdx >= 0) {
    // Add import
    lines.splice(insertImportAfter + 1, 0, '', "import { getVatRate, calculateTaxFromGross } from '../utils/vatRates'")

    // Add AutoInvoiceResult interface after SupabaseRestConfig
    const configEndIdx = lines.findIndex(l => l.includes("serviceRoleKey: string")) + 2
    const autoInvoiceResult = `
export interface AutoInvoiceResult {
  id: string | null
  dealerId: string | null
  vatRate: number
  taxCountry: string
  pdfUrl: string | null
  quadernoConfigured: boolean
}`
    lines.splice(configEndIdx, 0, autoInvoiceResult)

    writeFileSync(billingPath, lines.join('\n'))
    console.log('billing.ts: added imports and interface')
  }
}

// Check export-csv
const exportCsv = readFileSync(exportPath, 'utf8')
if (exportCsv.includes('InvoiceRow')) {
  console.log('export-csv.get.ts already has #213 changes, skipping')
} else {
  console.log('export-csv.get.ts needs #213 changes (will be written by main tool)')
}

// Check create-invoice
const createInv = readFileSync(createInvPath, 'utf8')
if (createInv.includes('getVatRate')) {
  console.log('create-invoice.post.ts already has #213 changes, skipping')
} else {
  // Replace EU_VAT_RATES import
  let newContent = createInv.replace(
    /import \{ getIdempotencyKey.*\n/,
    (match) => match + "import { getVatRate } from '../../utils/vatRates'\n"
  )
  // Remove inline EU_VAT_RATES
  newContent = newContent.replace(/\/\*\* VAT rates by EU country[\s\S]*?GB: 20,\n\}\n/, '')
  // Replace usage
  newContent = newContent.replace('EU_VAT_RATES[taxCountry] || 21', 'getVatRate(taxCountry)')

  writeFileSync(createInvPath, newContent)
  console.log('create-invoice.post.ts: updated to use shared vatRates')
}

// Stage everything
try {
  execSync('git add server/utils/vatRates.ts server/services/billing.ts server/api/invoicing/export-csv.get.ts server/api/invoicing/create-invoice.post.ts tests/unit/vatRates.test.ts tests/unit/server/billing-auto-invoice.test.ts tests/unit/server/api-invoicing-export.test.ts i18n/es.json i18n/en.json', { stdio: 'inherit' })
  console.log('All files staged')
} catch (e) {
  console.error('Stage failed:', e.message)
}
