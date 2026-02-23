<script setup lang="ts">
/**
 * Dealer Invoice Generator
 * Adapted from admin/utilidades.vue invoice generator for dealer self-service.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t, locale } = useI18n()
const supabase = useSupabaseClient()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { userId } = useAuth()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

// ============ TYPES ============
interface InvoiceLine {
  id: number
  tipo: 'Venta' | 'Alquiler' | 'Servicio' | 'Transporte' | 'Transferencia'
  concepto: string
  cantidad: number
  precioUd: number
  iva: number
}

interface VehicleOption {
  id: string
  label: string
}

interface DealerInvoiceRow {
  id: string
  invoice_number: string
  invoice_date: string
  client_name: string
  client_doc_type: string | null
  client_doc_number: string | null
  client_address: string | null
  vehicle_ids: string[] | null
  lines: InvoiceLine[]
  subtotal: number
  total_tax: number
  total: number
  conditions: string | null
  language: string | null
  status: string
  created_at: string | null
}

interface DealerFiscalRow {
  tax_id: string | null
  tax_address: string | null
}

// ============ STATE ============
const activeTab = ref<'new' | 'history'>('new')
const saving = ref(false)
const loadingHistory = ref(false)
const loadingVehicles = ref(false)
const invoiceHistory = ref<DealerInvoiceRow[]>([])
const vehicleOptions = ref<VehicleOption[]>([])
const errorMessage = ref<string | null>(null)
const successMessage = ref<string | null>(null)

// Dealer company data (pre-filled, editable)
const companyName = ref('')
const companyTaxId = ref('')
const companyAddress1 = ref('')
const companyAddress2 = ref('')
const companyAddress3 = ref('')
const companyPhone = ref('')
const companyEmail = ref('')
const companyLogoUrl = ref('')
const companyWebsite = ref('')

// Client data
const clientName = ref('')
const clientDocType = ref<'NIF' | 'DNI' | 'CIF' | 'Pasaporte'>('NIF')
const clientDocNumber = ref('')
const clientAddress1 = ref('')
const clientAddress2 = ref('')
const clientAddress3 = ref('')

// Invoice data
const invoiceDate = ref(new Date().toISOString().split('T')[0])
const invoiceNumber = ref('')
const invoiceConditions = ref('Pago a 30 dias')
const invoiceLanguage = ref<'es' | 'en'>('es')
const selectedVehicle = ref('')

// Invoice lines
const invoiceLines = ref<InvoiceLine[]>([])
let lineIdCounter = 0

// Vehicle autocomplete
const vehicleSearch = ref('')
const showVehicleDropdown = ref(false)

const filteredVehicles = computed(() => {
  const query = vehicleSearch.value.toLowerCase().trim()
  if (!query) return vehicleOptions.value
  return vehicleOptions.value.filter((v) => v.label.toLowerCase().includes(query))
})

// ============ COMPUTED ============
const isFreeUser = computed(() => currentPlan.value === 'free')

function getLineImporte(line: InvoiceLine): number {
  return line.cantidad * line.precioUd
}

function getLineSubtotal(line: InvoiceLine): number {
  const importe = getLineImporte(line)
  return importe + (importe * line.iva) / 100
}

const invoiceSubtotal = computed(() => {
  return invoiceLines.value.reduce((sum, line) => sum + getLineImporte(line), 0)
})

const invoiceTotalIva = computed(() => {
  return invoiceLines.value.reduce((sum, line) => {
    const importe = getLineImporte(line)
    return sum + (importe * line.iva) / 100
  }, 0)
})

const invoiceTotal = computed(() => {
  return invoiceSubtotal.value + invoiceTotalIva.value
})

// ============ METHODS ============
function addInvoiceLine() {
  lineIdCounter++
  invoiceLines.value.push({
    id: lineIdCounter,
    tipo: 'Venta',
    concepto: '',
    cantidad: 1,
    precioUd: 0,
    iva: 21,
  })
}

function removeInvoiceLine(id: number) {
  invoiceLines.value = invoiceLines.value.filter((l) => l.id !== id)
}

function selectVehicle(vehicle: VehicleOption) {
  selectedVehicle.value = vehicle.id
  vehicleSearch.value = vehicle.label
  showVehicleDropdown.value = false

  // Auto-fill first empty line concept with vehicle info
  const emptyLine = invoiceLines.value.find((l) => !l.concepto)
  if (emptyLine) {
    emptyLine.concepto = vehicle.label
  }
}

function clearVehicle() {
  selectedVehicle.value = ''
  vehicleSearch.value = ''
}

function formatDateDMY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

function formatCurrency(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val)
}

function formatHistoryDate(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'status-draft',
    sent: 'status-sent',
    paid: 'status-paid',
    cancelled: 'status-cancelled',
  }
  return map[status] || ''
}

// ============ DATA LOADING ============
async function loadDealerData(): Promise<void> {
  const dealer = dealerProfile.value || (await loadDealer())
  if (!dealer) return

  // Pre-fill company data from dealer profile
  const nameObj = dealer.company_name as unknown as Record<string, string> | string | null
  if (typeof nameObj === 'object' && nameObj !== null) {
    companyName.value = localizedField(nameObj, locale.value) || ''
  } else if (typeof nameObj === 'string') {
    companyName.value = nameObj
  }

  companyPhone.value = dealer.phone || ''
  companyEmail.value = dealer.email || ''
  companyLogoUrl.value = dealer.logo_url || ''
  companyWebsite.value = dealer.website || ''

  // Load fiscal data for tax_id and address
  const { data: fiscalData } = await supabase
    .from('dealer_fiscal_data')
    .select('tax_id, tax_address')
    .eq('dealer_id', dealer.id)
    .maybeSingle()

  if (fiscalData) {
    const fiscal = fiscalData as DealerFiscalRow
    companyTaxId.value = fiscal.tax_id || ''
    if (fiscal.tax_address) {
      const addressParts = fiscal.tax_address.split('\n')
      companyAddress1.value = addressParts[0] || ''
      companyAddress2.value = addressParts[1] || ''
      companyAddress3.value = addressParts[2] || ''
    }
  }

  // Fallback: use cif_nif from dealers table if fiscal data is empty
  if (!companyTaxId.value) {
    const { data: dealerRow } = await supabase
      .from('dealers')
      .select('cif_nif')
      .eq('id', dealer.id)
      .single()
    if (dealerRow) {
      companyTaxId.value = (dealerRow as { cif_nif: string | null }).cif_nif || ''
    }
  }
}

async function loadVehicleOptions(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingVehicles.value = true
  try {
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate, year')
      .eq('dealer_id', dealer.id)
      .order('brand')

    if (vehicles) {
      vehicleOptions.value = (
        vehicles as Array<{
          id: string
          brand: string | null
          model: string | null
          plate: string | null
          year: number | null
        }>
      ).map((v) => ({
        id: v.id,
        label:
          `${v.brand || ''} ${v.model || ''} ${v.plate ? `(${v.plate})` : ''} ${v.year ? `- ${v.year}` : ''}`.trim(),
      }))
    }
  } finally {
    loadingVehicles.value = false
  }
}

async function generateInvoiceNumber(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  try {
    const { data, error: rpcError } = await supabase.rpc('generate_dealer_invoice_number', {
      p_dealer_id: dealer.id,
    })

    if (rpcError || !data) {
      // Fallback: prefix + year + sequence
      const year = new Date().getFullYear()
      const nameObj = dealer.company_name as unknown as Record<string, string> | string | null
      let prefix = 'DLR'
      if (typeof nameObj === 'string' && nameObj.length >= 3) {
        prefix = nameObj.substring(0, 3).toUpperCase()
      } else if (typeof nameObj === 'object' && nameObj !== null) {
        const name = localizedField(nameObj, 'es')
        if (name.length >= 3) {
          prefix = name.substring(0, 3).toUpperCase()
        }
      }
      invoiceNumber.value = `${prefix}-${year}-0001`
    } else {
      invoiceNumber.value = data as string
    }
  } catch {
    const year = new Date().getFullYear()
    invoiceNumber.value = `DLR-${year}-0001`
  }
}

async function loadInvoiceHistory(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingHistory.value = true
  try {
    const { data, error: fetchError } = await supabase
      .from('dealer_invoices')
      .select('*')
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })
      .limit(50)

    if (fetchError) throw fetchError
    invoiceHistory.value = (data || []) as DealerInvoiceRow[]
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : t('dashboard.tools.invoice.errorLoading')
  } finally {
    loadingHistory.value = false
  }
}

// ============ SAVE INVOICE ============
async function saveInvoice(status: 'draft' | 'sent'): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  if (!clientName.value.trim()) {
    errorMessage.value = t('dashboard.tools.invoice.clientRequired')
    return
  }

  if (invoiceLines.value.length === 0) {
    errorMessage.value = t('dashboard.tools.invoice.linesRequired')
    return
  }

  saving.value = true
  errorMessage.value = null
  successMessage.value = null

  try {
    const clientAddress = [clientAddress1.value, clientAddress2.value, clientAddress3.value]
      .filter(Boolean)
      .join('\n')

    const vehicleIds = selectedVehicle.value ? [selectedVehicle.value] : []

    const insertData = {
      dealer_id: dealer.id,
      invoice_number: invoiceNumber.value,
      invoice_date: invoiceDate.value,
      client_name: clientName.value.trim(),
      client_doc_type: clientDocType.value,
      client_doc_number: clientDocNumber.value.trim() || null,
      client_address: clientAddress || null,
      vehicle_ids: vehicleIds,
      lines: invoiceLines.value.map((l) => ({
        tipo: l.tipo,
        concepto: l.concepto,
        cantidad: l.cantidad,
        precioUd: l.precioUd,
        iva: l.iva,
      })),
      subtotal: invoiceSubtotal.value,
      total_tax: invoiceTotalIva.value,
      total: invoiceTotal.value,
      conditions: invoiceConditions.value || null,
      language: invoiceLanguage.value,
      status,
    }

    const { error: insertError } = await supabase
      .from('dealer_invoices')
      .insert(insertData as never)

    if (insertError) throw insertError

    successMessage.value =
      status === 'draft'
        ? t('dashboard.tools.invoice.draftSaved')
        : t('dashboard.tools.invoice.invoiceSaved')

    // Refresh history
    await loadInvoiceHistory()
  } catch (err: unknown) {
    errorMessage.value =
      err instanceof Error ? err.message : t('dashboard.tools.invoice.errorSaving')
  } finally {
    saving.value = false
  }
}

// ============ GENERATE PDF ============
function generateInvoicePDF(): void {
  const isEnglish = invoiceLanguage.value === 'en'

  const txt = isEnglish
    ? {
        invoice: 'INVOICE',
        num: 'Invoice No:',
        date: 'Date:',
        billedTo: 'Billed to:',
        type: 'Type',
        concept: 'Concept',
        qty: 'Qty',
        price: 'Unit Price',
        amount: 'Amount',
        vat: 'VAT %',
        subtotal: 'Subtotal',
        baseAmount: 'Base Amount',
        totalVat: 'Total VAT',
        total: 'TOTAL',
        conditions: 'Payment terms:',
        lineTypes: {
          Venta: 'Sale',
          Alquiler: 'Rental',
          Servicio: 'Service',
          Transporte: 'Transport',
          Transferencia: 'Transfer',
        } as Record<string, string>,
      }
    : {
        invoice: 'FACTURA',
        num: 'N Factura:',
        date: 'Fecha:',
        billedTo: 'Facturado a:',
        type: 'Tipo',
        concept: 'Concepto',
        qty: 'Cant.',
        price: 'Precio/Ud',
        amount: 'Importe',
        vat: 'IVA %',
        subtotal: 'Subtotal',
        baseAmount: 'Base Imponible',
        totalVat: 'Total IVA',
        total: 'TOTAL',
        conditions: 'Condiciones:',
        lineTypes: {
          Venta: 'Venta',
          Alquiler: 'Alquiler',
          Servicio: 'Servicio',
          Transporte: 'Transporte',
          Transferencia: 'Transferencia',
        } as Record<string, string>,
      }

  // Build logo HTML
  const logoHtml = companyLogoUrl.value
    ? `<img src="${companyLogoUrl.value}" alt="${companyName.value}" style="max-height:50px;max-width:120px;margin-bottom:8px;" />`
    : ''

  let html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${txt.invoice} ${invoiceNumber.value}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; align-items: flex-start; }
      .header-left { flex: 1; }
      .header-right { text-align: right; }
      .company-name { font-size: 20px; font-weight: 700; margin-bottom: 4px; letter-spacing: 1px; }
      .header-accent { width: 45px; height: 2px; background: #7FD1C8; margin-bottom: 8px; }
      .invoice-title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
      .invoice-meta { font-size: 12px; opacity: 0.9; }
      .content { padding: 20px 24px; }
      .client-section { margin-bottom: 20px; }
      .section-title { font-size: 13px; font-weight: 700; color: #23424A; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th { background: #23424A; color: white; padding: 10px 8px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; }
      th.right { text-align: right; }
      td { padding: 10px 8px; border-bottom: 1px solid #e5e7eb; }
      td.right { text-align: right; }
      tr:nth-child(even) td { background: #f9fafb; }
      .totals { width: 300px; margin-left: auto; }
      .totals tr td { border: none; padding: 6px 8px; background: transparent; }
      .totals .total-row { font-size: 14px; font-weight: bold; background: #e8f5e9; }
      .conditions { margin-top: 20px; padding: 10px; background: #f5f5f5; border-radius: 4px; font-size: 10px; }
      .footer { position: fixed; bottom: 0; left: 0; right: 0; background: #23424A; color: white; padding: 10px 20px; display: flex; justify-content: space-between; font-size: 10px; }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        .footer { position: fixed; }
      }
    </style>
  </head><body>
    <div class="header">
      <div class="header-left">
        ${logoHtml}
        <div class="company-name">${companyName.value}</div>
        <div class="header-accent"></div>
        <div>${companyTaxId.value ? `NIF/CIF: ${companyTaxId.value}` : ''}</div>
        <div>${companyAddress1.value}</div>
        <div>${companyAddress2.value}</div>
        <div>${companyAddress3.value}</div>
      </div>
      <div class="header-right">
        <div class="invoice-title">${txt.invoice}</div>
        <div class="invoice-meta">
          <div>${txt.num} ${invoiceNumber.value}</div>
          <div>${txt.date} ${formatDateDMY(invoiceDate.value)}</div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="client-section">
        <div class="section-title">${txt.billedTo}</div>
        <div><strong>${clientName.value}</strong></div>
        <div>${clientAddress1.value}</div>
        <div>${clientAddress2.value}</div>
        <div>${clientAddress3.value}</div>
        <div>${clientDocType.value}: ${clientDocNumber.value}</div>
      </div>
      <table>
        <thead>
          <tr>
            <th>${txt.type}</th>
            <th>${txt.concept}</th>
            <th class="right">${txt.qty}</th>
            <th class="right">${txt.price}</th>
            <th class="right">${txt.amount}</th>
            <th class="right">${txt.vat}</th>
            <th class="right">${txt.subtotal}</th>
          </tr>
        </thead>
        <tbody>`

  for (const line of invoiceLines.value) {
    const importe = getLineImporte(line)
    const subtotal = getLineSubtotal(line)
    const tipoLabel = txt.lineTypes[line.tipo] || line.tipo
    html += `<tr>
      <td>${tipoLabel}</td>
      <td>${line.concepto}</td>
      <td class="right">${line.cantidad}</td>
      <td class="right">${line.precioUd.toFixed(2)} &euro;</td>
      <td class="right">${importe.toFixed(2)} &euro;</td>
      <td class="right">${line.iva}%</td>
      <td class="right">${subtotal.toFixed(2)} &euro;</td>
    </tr>`
  }

  html += `</tbody></table>
      <table class="totals">
        <tr><td>${txt.baseAmount}:</td><td class="right">${invoiceSubtotal.value.toFixed(2)} &euro;</td></tr>
        <tr><td>${txt.totalVat}:</td><td class="right">${invoiceTotalIva.value.toFixed(2)} &euro;</td></tr>
        <tr class="total-row"><td>${txt.total}:</td><td class="right">${invoiceTotal.value.toFixed(2)} &euro;</td></tr>
      </table>
      <div class="conditions">
        <strong>${txt.conditions}</strong> ${invoiceConditions.value}
      </div>
    </div>
    <div class="footer">
      <span>${companyPhone.value}</span>
      <span>${companyEmail.value}</span>
      <span>${companyWebsite.value}</span>
    </div>
  </body></html>`

  printHTML(html)
}

function printHTML(html: string): void {
  const existingFrame = document.getElementById('print-frame-invoice')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame-invoice'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
    // Fallback to window.open
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.focus()
    w.print()
    return
  }

  doc.open()
  doc.write(html)
  doc.close()

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
    } catch {
      const win = window.open('', '_blank')
      if (win) {
        win.document.write(html)
        win.document.close()
        win.focus()
        win.print()
      }
    }
  }, 100)
}

async function handleGeneratePDF(): Promise<void> {
  if (!clientName.value.trim()) {
    errorMessage.value = t('dashboard.tools.invoice.clientRequired')
    return
  }
  if (invoiceLines.value.length === 0) {
    errorMessage.value = t('dashboard.tools.invoice.linesRequired')
    return
  }

  generateInvoicePDF()

  // Auto-save as 'sent' after generating PDF
  await saveInvoice('sent')
}

function resetForm(): void {
  invoiceDate.value = new Date().toISOString().split('T')[0]
  invoiceConditions.value = 'Pago a 30 dias'
  invoiceLanguage.value = 'es'
  clientName.value = ''
  clientDocType.value = 'NIF'
  clientDocNumber.value = ''
  clientAddress1.value = ''
  clientAddress2.value = ''
  clientAddress3.value = ''
  selectedVehicle.value = ''
  vehicleSearch.value = ''
  invoiceLines.value = []
  lineIdCounter = 0
  errorMessage.value = null
  successMessage.value = null
  addInvoiceLine()
  generateInvoiceNumber()
}

// ============ LIFECYCLE ============
onMounted(async () => {
  await Promise.all([loadDealerData(), fetchSubscription()])

  if (!isFreeUser.value) {
    await loadVehicleOptions()
    await generateInvoiceNumber()
    if (invoiceLines.value.length === 0) {
      addInvoiceLine()
    }
    await loadInvoiceHistory()
  }
})

// Close vehicle dropdown on outside click
function onVehicleBlur(): void {
  setTimeout(() => {
    showVehicleDropdown.value = false
  }, 200)
}
</script>

<template>
  <div class="tool-page">
    <!-- Plan gate banner for free users -->
    <div v-if="isFreeUser" class="plan-gate">
      <div class="plan-gate__icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>
      <h2 class="plan-gate__title">{{ t('dashboard.tools.invoice.upgradeTitle') }}</h2>
      <p class="plan-gate__text">{{ t('dashboard.tools.invoice.upgradeText') }}</p>
      <NuxtLink to="/dashboard/suscripcion" class="plan-gate__cta">
        {{ t('dashboard.tools.invoice.upgradeCTA') }}
      </NuxtLink>
    </div>

    <!-- Main content (only for paid plans) -->
    <template v-else>
      <h1 class="tool-page__title">{{ t('dashboard.tools.invoice.title') }}</h1>
      <p class="tool-page__subtitle">{{ t('dashboard.tools.invoice.subtitle') }}</p>

      <!-- Tabs -->
      <div class="tool-tabs">
        <button
          class="tool-tabs__btn"
          :class="{ 'tool-tabs__btn--active': activeTab === 'new' }"
          @click="activeTab = 'new'"
        >
          {{ t('dashboard.tools.invoice.tabNew') }}
        </button>
        <button
          class="tool-tabs__btn"
          :class="{ 'tool-tabs__btn--active': activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          {{ t('dashboard.tools.invoice.tabHistory') }}
          <span v-if="invoiceHistory.length > 0" class="tool-tabs__badge">{{
            invoiceHistory.length
          }}</span>
        </button>
      </div>

      <!-- Messages -->
      <div v-if="errorMessage" class="message message--error">
        {{ errorMessage }}
        <button class="message__close" @click="errorMessage = null">&times;</button>
      </div>
      <div v-if="successMessage" class="message message--success">
        {{ successMessage }}
        <button class="message__close" @click="successMessage = null">&times;</button>
      </div>

      <!-- New invoice form -->
      <div v-if="activeTab === 'new'" class="invoice-form">
        <!-- Dealer / Company data section -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.dealerData') }}
          </legend>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.companyName')
              }}</label>
              <input v-model="companyName" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.taxId') }}</label>
              <input
                v-model="companyTaxId"
                type="text"
                class="form-field__input"
                placeholder="B12345678"
              >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.phone') }}</label>
              <input v-model="companyPhone" type="tel" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.email') }}</label>
              <input v-model="companyEmail" type="email" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
              <input v-model="companyAddress1" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
              <input v-model="companyAddress2" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
              <input v-model="companyAddress3" type="text" class="form-field__input" >
            </div>
          </div>
        </fieldset>

        <!-- Client data section -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.clientData') }}
          </legend>
          <div class="form-grid">
            <div class="form-field form-field--full">
              <label class="form-field__label"
                >{{ t('dashboard.tools.invoice.clientName') }} *</label
              >
              <input v-model="clientName" type="text" class="form-field__input" required >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.docType') }}</label>
              <select v-model="clientDocType" class="form-field__select">
                <option value="NIF">NIF</option>
                <option value="DNI">DNI</option>
                <option value="CIF">CIF</option>
                <option value="Pasaporte">{{ t('dashboard.tools.invoice.passport') }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.docNumber') }}</label>
              <input v-model="clientDocNumber" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 1</label>
              <input v-model="clientAddress1" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 2</label>
              <input v-model="clientAddress2" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.address') }} 3</label>
              <input v-model="clientAddress3" type="text" class="form-field__input" >
            </div>
          </div>
        </fieldset>

        <!-- Vehicle selection & invoice settings -->
        <fieldset class="form-section">
          <legend class="form-section__legend">
            {{ t('dashboard.tools.invoice.invoiceSettings') }}
          </legend>
          <div class="form-grid">
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.invoiceNumber')
              }}</label>
              <input v-model="invoiceNumber" type="text" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{
                t('dashboard.tools.invoice.invoiceDate')
              }}</label>
              <input v-model="invoiceDate" type="date" class="form-field__input" >
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.language') }}</label>
              <select v-model="invoiceLanguage" class="form-field__select">
                <option value="es">{{ t('dashboard.tools.invoice.langES') }}</option>
                <option value="en">{{ t('dashboard.tools.invoice.langEN') }}</option>
              </select>
            </div>
            <div class="form-field">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.conditions') }}</label>
              <input v-model="invoiceConditions" type="text" class="form-field__input" >
            </div>
            <div class="form-field form-field--full form-field--autocomplete">
              <label class="form-field__label">{{ t('dashboard.tools.invoice.vehicle') }}</label>
              <div class="autocomplete-wrapper">
                <input
                  v-model="vehicleSearch"
                  type="text"
                  class="form-field__input"
                  :placeholder="t('dashboard.tools.invoice.vehiclePlaceholder')"
                  @focus="showVehicleDropdown = true"
                  @blur="onVehicleBlur"
                >
                <button
                  v-if="selectedVehicle"
                  class="autocomplete-clear"
                  type="button"
                  @click="clearVehicle"
                >
                  &times;
                </button>
                <ul
                  v-if="showVehicleDropdown && filteredVehicles.length > 0"
                  class="autocomplete-dropdown"
                >
                  <li
                    v-for="v in filteredVehicles"
                    :key="v.id"
                    class="autocomplete-dropdown__item"
                    @mousedown.prevent="selectVehicle(v)"
                  >
                    {{ v.label }}
                  </li>
                </ul>
                <div
                  v-if="showVehicleDropdown && filteredVehicles.length === 0 && vehicleSearch"
                  class="autocomplete-dropdown autocomplete-dropdown--empty"
                >
                  {{ t('dashboard.tools.invoice.noVehicles') }}
                </div>
                <div v-if="loadingVehicles" class="autocomplete-loading">
                  {{ t('dashboard.tools.invoice.loading') }}...
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        <!-- Invoice lines -->
        <fieldset class="form-section">
          <legend class="form-section__legend">{{ t('dashboard.tools.invoice.lines') }}</legend>

          <!-- Desktop table view -->
          <div class="lines-table-wrapper">
            <table class="lines-table">
              <thead>
                <tr>
                  <th>{{ t('dashboard.tools.invoice.lineType') }}</th>
                  <th>{{ t('dashboard.tools.invoice.lineConcept') }}</th>
                  <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineQty') }}</th>
                  <th class="lines-table__num">{{ t('dashboard.tools.invoice.linePrice') }}</th>
                  <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineIVA') }}</th>
                  <th class="lines-table__num">{{ t('dashboard.tools.invoice.lineTotal') }}</th>
                  <th class="lines-table__action" />
                </tr>
              </thead>
              <tbody>
                <tr v-for="line in invoiceLines" :key="line.id">
                  <td>
                    <select
                      v-model="line.tipo"
                      class="form-field__select form-field__select--compact"
                    >
                      <option value="Venta">{{ t('dashboard.tools.invoice.typeVenta') }}</option>
                      <option value="Alquiler">
                        {{ t('dashboard.tools.invoice.typeAlquiler') }}
                      </option>
                      <option value="Servicio">
                        {{ t('dashboard.tools.invoice.typeServicio') }}
                      </option>
                      <option value="Transporte">
                        {{ t('dashboard.tools.invoice.typeTransporte') }}
                      </option>
                      <option value="Transferencia">
                        {{ t('dashboard.tools.invoice.typeTransferencia') }}
                      </option>
                    </select>
                  </td>
                  <td>
                    <input
                      v-model="line.concepto"
                      type="text"
                      class="form-field__input form-field__input--compact"
                      :placeholder="t('dashboard.tools.invoice.conceptPlaceholder')"
                    >
                  </td>
                  <td class="lines-table__num">
                    <input
                      v-model.number="line.cantidad"
                      type="number"
                      min="1"
                      step="1"
                      class="form-field__input form-field__input--compact form-field__input--num"
                    >
                  </td>
                  <td class="lines-table__num">
                    <input
                      v-model.number="line.precioUd"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-field__input form-field__input--compact form-field__input--num"
                    >
                  </td>
                  <td class="lines-table__num">
                    <input
                      v-model.number="line.iva"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      class="form-field__input form-field__input--compact form-field__input--num"
                    >
                  </td>
                  <td class="lines-table__num lines-table__total">
                    {{ getLineSubtotal(line).toFixed(2) }} &euro;
                  </td>
                  <td class="lines-table__action">
                    <button
                      class="btn-icon btn-icon--danger"
                      type="button"
                      :title="t('dashboard.tools.invoice.removeLine')"
                      @click="removeInvoiceLine(line.id)"
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Mobile card view for lines -->
          <div class="lines-mobile">
            <div v-for="line in invoiceLines" :key="'m-' + line.id" class="line-card">
              <div class="line-card__header">
                <select v-model="line.tipo" class="form-field__select form-field__select--compact">
                  <option value="Venta">{{ t('dashboard.tools.invoice.typeVenta') }}</option>
                  <option value="Alquiler">{{ t('dashboard.tools.invoice.typeAlquiler') }}</option>
                  <option value="Servicio">{{ t('dashboard.tools.invoice.typeServicio') }}</option>
                  <option value="Transporte">
                    {{ t('dashboard.tools.invoice.typeTransporte') }}
                  </option>
                  <option value="Transferencia">
                    {{ t('dashboard.tools.invoice.typeTransferencia') }}
                  </option>
                </select>
                <button
                  class="btn-icon btn-icon--danger"
                  type="button"
                  @click="removeInvoiceLine(line.id)"
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <input
                v-model="line.concepto"
                type="text"
                class="form-field__input"
                :placeholder="t('dashboard.tools.invoice.conceptPlaceholder')"
              >
              <div class="line-card__numbers">
                <div class="line-card__field">
                  <label>{{ t('dashboard.tools.invoice.lineQty') }}</label>
                  <input
                    v-model.number="line.cantidad"
                    type="number"
                    min="1"
                    step="1"
                    class="form-field__input form-field__input--num"
                  >
                </div>
                <div class="line-card__field">
                  <label>{{ t('dashboard.tools.invoice.linePrice') }}</label>
                  <input
                    v-model.number="line.precioUd"
                    type="number"
                    min="0"
                    step="0.01"
                    class="form-field__input form-field__input--num"
                  >
                </div>
                <div class="line-card__field">
                  <label>{{ t('dashboard.tools.invoice.lineIVA') }} %</label>
                  <input
                    v-model.number="line.iva"
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    class="form-field__input form-field__input--num"
                  >
                </div>
              </div>
              <div class="line-card__total">
                {{ t('dashboard.tools.invoice.lineTotal') }}:
                <strong>{{ getLineSubtotal(line).toFixed(2) }} &euro;</strong>
              </div>
            </div>
          </div>

          <button class="btn btn--outline btn--add-line" type="button" @click="addInvoiceLine">
            + {{ t('dashboard.tools.invoice.addLine') }}
          </button>
        </fieldset>

        <!-- Totals -->
        <div class="invoice-totals">
          <div class="invoice-totals__row">
            <span>{{ t('dashboard.tools.invoice.baseAmount') }}</span>
            <span>{{ formatCurrency(invoiceSubtotal) }}</span>
          </div>
          <div class="invoice-totals__row">
            <span>{{ t('dashboard.tools.invoice.totalIVA') }}</span>
            <span>{{ formatCurrency(invoiceTotalIva) }}</span>
          </div>
          <div class="invoice-totals__row invoice-totals__row--grand">
            <span>{{ t('dashboard.tools.invoice.grandTotal') }}</span>
            <span>{{ formatCurrency(invoiceTotal) }}</span>
          </div>
        </div>

        <!-- Actions -->
        <div class="invoice-actions">
          <button
            class="btn btn--primary"
            type="button"
            :disabled="saving"
            @click="handleGeneratePDF"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
            {{ t('dashboard.tools.invoice.generatePDF') }}
          </button>
          <button
            class="btn btn--secondary"
            type="button"
            :disabled="saving"
            @click="saveInvoice('draft')"
          >
            {{ t('dashboard.tools.invoice.saveDraft') }}
          </button>
          <button class="btn btn--ghost" type="button" @click="resetForm">
            {{ t('dashboard.tools.invoice.reset') }}
          </button>
        </div>
      </div>

      <!-- Invoice history tab -->
      <div v-if="activeTab === 'history'" class="invoice-history">
        <div v-if="loadingHistory" class="invoice-history__loading">
          {{ t('dashboard.tools.invoice.loading') }}...
        </div>

        <div v-else-if="invoiceHistory.length === 0" class="invoice-history__empty">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
          <p>{{ t('dashboard.tools.invoice.noInvoices') }}</p>
        </div>

        <div v-else class="history-list">
          <!-- Desktop table -->
          <table class="history-table">
            <thead>
              <tr>
                <th>{{ t('dashboard.tools.invoice.historyDate') }}</th>
                <th>{{ t('dashboard.tools.invoice.historyNumber') }}</th>
                <th>{{ t('dashboard.tools.invoice.historyClient') }}</th>
                <th class="history-table__num">{{ t('dashboard.tools.invoice.historyTotal') }}</th>
                <th>{{ t('dashboard.tools.invoice.historyStatus') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="inv in invoiceHistory" :key="inv.id">
                <td>{{ formatHistoryDate(inv.invoice_date) }}</td>
                <td class="history-table__number">{{ inv.invoice_number }}</td>
                <td>{{ inv.client_name }}</td>
                <td class="history-table__num">{{ formatCurrency(inv.total) }}</td>
                <td>
                  <span class="status-badge" :class="getStatusClass(inv.status)">{{
                    t(`dashboard.tools.invoice.status_${inv.status}`)
                  }}</span>
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Mobile cards for history -->
          <div class="history-mobile">
            <div v-for="inv in invoiceHistory" :key="'hm-' + inv.id" class="history-card">
              <div class="history-card__header">
                <span class="history-card__number">{{ inv.invoice_number }}</span>
                <span class="status-badge" :class="getStatusClass(inv.status)">{{
                  t(`dashboard.tools.invoice.status_${inv.status}`)
                }}</span>
              </div>
              <div class="history-card__client">{{ inv.client_name }}</div>
              <div class="history-card__footer">
                <span>{{ formatHistoryDate(inv.invoice_date) }}</span>
                <strong>{{ formatCurrency(inv.total) }}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ============ BASE / MOBILE-FIRST ============ */
.tool-page {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.tool-page__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 0.25rem;
}

.tool-page__subtitle {
  font-size: 0.9rem;
  color: #64748b;
  margin-bottom: 1.5rem;
}

/* ============ PLAN GATE ============ */
.plan-gate {
  text-align: center;
  padding: 3rem 1.5rem;
  background: #f8fafc;
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
  margin-top: 2rem;
}

.plan-gate__icon {
  color: #94a3b8;
  margin-bottom: 1rem;
}

.plan-gate__title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  margin-bottom: 0.5rem;
}

.plan-gate__text {
  color: #64748b;
  margin-bottom: 1.5rem;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

.plan-gate__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  padding: 0.75rem 2rem;
  background: var(--primary, #23424a);
  color: white;
  border-radius: 8px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 0.2s;
}

.plan-gate__cta:hover {
  opacity: 0.9;
}

/* ============ TABS ============ */
.tool-tabs {
  display: flex;
  gap: 0;
  border-bottom: 2px solid #e2e8f0;
  margin-bottom: 1.5rem;
}

.tool-tabs__btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.75rem 1.25rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.9rem;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.tool-tabs__btn:hover {
  color: var(--primary, #23424a);
}

.tool-tabs__btn--active {
  color: var(--primary, #23424a);
  border-bottom-color: var(--primary, #23424a);
  font-weight: 600;
}

.tool-tabs__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--primary, #23424a);
  color: white;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* ============ MESSAGES ============ */
.message {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.message--error {
  background: #fef2f2;
  color: #b91c1c;
  border: 1px solid #fecaca;
}

.message--success {
  background: #f0fdf4;
  color: #15803d;
  border: 1px solid #bbf7d0;
}

.message__close {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ============ FORM SECTIONS ============ */
.form-section {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
}

.form-section__legend {
  font-size: 0.8rem;
  font-weight: 700;
  color: var(--primary, #23424a);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0 0.5rem;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-field--full {
  grid-column: 1 / -1;
}

.form-field__label {
  font-size: 0.8rem;
  font-weight: 500;
  color: #475569;
}

.form-field__input,
.form-field__select {
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  color: #1e293b;
  background: white;
  transition: border-color 0.2s;
  width: 100%;
}

.form-field__input:focus,
.form-field__select:focus {
  outline: none;
  border-color: var(--primary, #23424a);
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.15);
}

.form-field__input--compact {
  min-height: 38px;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
}

.form-field__select--compact {
  min-height: 38px;
  padding: 0.375rem 0.5rem;
  font-size: 0.85rem;
}

.form-field__input--num {
  text-align: right;
  max-width: 100px;
}

/* ============ AUTOCOMPLETE ============ */
.form-field--autocomplete {
  position: relative;
}

.autocomplete-wrapper {
  position: relative;
}

.autocomplete-clear {
  position: absolute;
  right: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: #94a3b8;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-top: none;
  border-radius: 0 0 6px 6px;
  max-height: 200px;
  overflow-y: auto;
  z-index: 50;
  list-style: none;
  margin: 0;
  padding: 0;
}

.autocomplete-dropdown--empty {
  padding: 0.75rem;
  color: #94a3b8;
  font-size: 0.85rem;
}

.autocomplete-dropdown__item {
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  font-size: 0.85rem;
  min-height: 44px;
  display: flex;
  align-items: center;
  transition: background 0.15s;
}

.autocomplete-dropdown__item:hover {
  background: #f1f5f9;
}

.autocomplete-loading {
  padding: 0.5rem 0.75rem;
  color: #94a3b8;
  font-size: 0.8rem;
}

/* ============ INVOICE LINES TABLE (Desktop) ============ */
.lines-table-wrapper {
  display: none;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

.lines-table {
  width: 100%;
  border-collapse: collapse;
}

.lines-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
  white-space: nowrap;
}

.lines-table td {
  padding: 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  vertical-align: middle;
}

.lines-table__num {
  text-align: right;
  white-space: nowrap;
}

.lines-table__total {
  font-weight: 600;
  color: var(--primary, #23424a);
}

.lines-table__action {
  width: 44px;
  text-align: center;
}

/* ============ INVOICE LINES MOBILE CARDS ============ */
.lines-mobile {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.line-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.line-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.line-card__header select {
  flex: 1;
}

.line-card__numbers {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 0.5rem;
}

.line-card__field {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.line-card__field label {
  font-size: 0.7rem;
  color: #64748b;
  font-weight: 500;
}

.line-card__field .form-field__input--num {
  max-width: 100%;
}

.line-card__total {
  text-align: right;
  font-size: 0.9rem;
  color: var(--primary, #23424a);
}

/* ============ ADD LINE BUTTON ============ */
.btn--add-line {
  margin-top: 1rem;
  width: 100%;
}

/* ============ INVOICE TOTALS ============ */
.invoice-totals {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  max-width: 360px;
  margin-left: auto;
}

.invoice-totals__row {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.9rem;
  color: #475569;
}

.invoice-totals__row--grand {
  border-top: 2px solid var(--primary, #23424a);
  margin-top: 0.5rem;
  padding-top: 0.75rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--primary, #23424a);
}

/* ============ ACTIONS ============ */
.invoice-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
}

/* ============ BUTTONS ============ */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 44px;
  padding: 0.625rem 1.25rem;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition:
    opacity 0.2s,
    background 0.2s;
  text-decoration: none;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: var(--primary, #23424a);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  opacity: 0.9;
}

.btn--secondary {
  background: #e2e8f0;
  color: #334155;
}

.btn--secondary:hover:not(:disabled) {
  background: #cbd5e1;
}

.btn--ghost {
  background: transparent;
  color: #64748b;
  border: 1px solid #d1d5db;
}

.btn--ghost:hover:not(:disabled) {
  background: #f1f5f9;
}

.btn--outline {
  background: transparent;
  color: var(--primary, #23424a);
  border: 1px dashed #94a3b8;
}

.btn--outline:hover {
  border-color: var(--primary, #23424a);
  background: rgba(35, 66, 74, 0.04);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
  padding: 0;
  background: none;
  border: none;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;
}

.btn-icon--danger {
  color: #ef4444;
}

.btn-icon--danger:hover {
  background: #fef2f2;
}

/* ============ INVOICE HISTORY ============ */
.invoice-history__loading {
  text-align: center;
  padding: 2rem;
  color: #64748b;
}

.invoice-history__empty {
  text-align: center;
  padding: 3rem 1.5rem;
  color: #94a3b8;
}

.invoice-history__empty svg {
  margin-bottom: 1rem;
}

.invoice-history__empty p {
  font-size: 0.9rem;
}

/* History table (desktop) */
.history-table {
  display: none;
  width: 100%;
  border-collapse: collapse;
}

.history-table th {
  font-size: 0.75rem;
  font-weight: 600;
  color: #64748b;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 0.75rem 0.5rem;
  border-bottom: 2px solid #e2e8f0;
  text-align: left;
}

.history-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid #f1f5f9;
  font-size: 0.875rem;
}

.history-table__num {
  text-align: right;
  font-weight: 600;
}

.history-table__number {
  font-family: monospace;
  font-size: 0.8rem;
}

/* History mobile cards */
.history-mobile {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.history-card {
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
}

.history-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.history-card__number {
  font-family: monospace;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--primary, #23424a);
}

.history-card__client {
  font-size: 0.9rem;
  color: #334155;
  margin-bottom: 0.5rem;
}

.history-card__footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
  color: #64748b;
}

.history-card__footer strong {
  color: var(--primary, #23424a);
  font-size: 0.95rem;
}

/* ============ STATUS BADGES ============ */
.status-badge {
  display: inline-block;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.status-draft {
  background: #f1f5f9;
  color: #64748b;
}

.status-sent {
  background: #dbeafe;
  color: #1d4ed8;
}

.status-paid {
  background: #dcfce7;
  color: #15803d;
}

.status-cancelled {
  background: #fef2f2;
  color: #b91c1c;
}

/* ============ DESKTOP BREAKPOINT (768px+) ============ */
@media (min-width: 768px) {
  .tool-page {
    padding: 2rem;
  }

  .form-grid {
    grid-template-columns: 1fr 1fr;
  }

  .lines-table-wrapper {
    display: block;
  }

  .lines-mobile {
    display: none;
  }

  .history-table {
    display: table;
  }

  .history-mobile {
    display: none;
  }

  .btn--add-line {
    width: auto;
  }
}

/* ============ LARGE DESKTOP (1024px+) ============ */
@media (min-width: 1024px) {
  .tool-page__title {
    font-size: 1.75rem;
  }

  .form-section {
    padding: 1.5rem;
  }
}
</style>
