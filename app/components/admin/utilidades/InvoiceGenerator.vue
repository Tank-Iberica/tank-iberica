<script setup lang="ts">
interface InvoiceLine {
  id: number
  tipo: 'Venta' | 'Alquiler' | 'Servicio' | 'Reserva' | 'Otro'
  concepto: string
  cantidad: number
  precioUd: number
  iva: number
}

interface VehicleOption {
  id: string
  label: string
  source: 'vehicles' | 'historico'
}

const props = defineProps<{
  vehicleOptions: VehicleOption[]
  loadingVehicles: boolean
}>()

// Invoice state
const invoiceDate = ref(new Date().toISOString().split('T')[0])
const invoiceConditions = ref('Pago a 30 días')
const invoiceInEnglish = ref(false)
const invoiceNumber = ref('')
const numVehicles = ref(1)
const selectedVehicles = ref<string[]>([''])
const invoiceLines = ref<InvoiceLine[]>([])
let lineIdCounter = 0

// Client data
const clientName = ref('')
const clientAddress1 = ref('')
const clientAddress2 = ref('')
const clientAddress3 = ref('')
const clientDocType = ref<'NIF' | 'DNI' | 'Pasaporte' | 'CIF'>('NIF')
const clientDocNumber = ref('')

// Company data (with defaults)
const companyName = ref('TRACCIONA S.L.')
const companyNIF = ref('B12345678')
const companyAddress1 = ref('Calle Principal 123')
const companyAddress2 = ref('28001 Madrid')
const companyAddress3 = ref('España')
const companyPhone = ref('+34 900 000 000')
const companyEmail = ref('info@tracciona.com')
const companyWeb = ref('TRACCIONA.COM')
const companyLogoUrl = ref('')

// Update invoice number based on selected vehicles
function updateInvoiceNumber() {
  const year = new Date().getFullYear()
  const ids = selectedVehicles.value
    .filter((v) => v)
    .map((v) => v.split('-')[1])
    .join('-')
  invoiceNumber.value = ids ? `${year}/${ids}` : `${year}/000`
}

// Handle vehicle count change
function onNumVehiclesChange() {
  const count = numVehicles.value
  while (selectedVehicles.value.length < count) {
    selectedVehicles.value.push('')
  }
  while (selectedVehicles.value.length > count) {
    selectedVehicles.value.pop()
  }
  // Add a line for each vehicle if none exist
  if (invoiceLines.value.length === 0) {
    for (let i = 0; i < count; i++) {
      addInvoiceLine()
    }
  }
  updateInvoiceNumber()
}

// Add invoice line
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

// Remove invoice line
function removeInvoiceLine(id: number) {
  invoiceLines.value = invoiceLines.value.filter((l) => l.id !== id)
}

// Calculate line totals
function getLineImporte(line: InvoiceLine): number {
  return line.cantidad * line.precioUd
}

function getLineSubtotal(line: InvoiceLine): number {
  const importe = getLineImporte(line)
  return importe + (importe * line.iva) / 100
}

// Calculate invoice totals
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

// Auto-fill concept when vehicle is selected
function onVehicleSelected(index: number) {
  const vehicleId = selectedVehicles.value[index]
  if (!vehicleId) return

  const vehicle = props.vehicleOptions.find((v) => v.id === vehicleId)
  if (vehicle && invoiceLines.value[index]) {
    invoiceLines.value[index].concepto = vehicle.label
  }
  updateInvoiceNumber()
}

// Format date as DD-MM-YYYY
function formatDateDMY(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
}

// Generate PDF invoice
function generateInvoicePDF() {
  const isEnglish = invoiceInEnglish.value

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
      }
    : {
        invoice: 'FACTURA',
        num: 'Nº Factura:',
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
      }

  // Build HTML for PDF
  let html = `<!DOCTYPE html><html><head>
    <meta charset="UTF-8">
    <title>${txt.invoice} ${invoiceNumber.value}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1F2A2A; }
      .header { background: linear-gradient(135deg, #1A3238 0%, #23424A 100%); color: white; padding: 20px 24px; display: flex; justify-content: space-between; }
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
        <div class="company-name">${companyName.value}</div>
        <div class="header-accent"></div>
        <div>NIF: ${companyNIF.value}</div>
        <div>${companyAddress1.value}</div>
        <div>${companyAddress2.value}</div>
        <div>${companyAddress3.value}</div>
      </div>
      <div class="header-right">
        <div class="invoice-title">${txt.invoice}</div>
        <div class="invoice-meta">
          <div>${txt.num} ${invoiceNumber.value}</div>
          <div>${txt.date} ${formatDateDMY(invoiceDate.value ?? '')}</div>
        </div>
      </div>
    </div>
    <div class="content">
      <div class="client-section">
        <div class="section-title">${txt.billedTo}</div>
        <div>${clientName.value}</div>
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
    html += `<tr>
      <td>${line.tipo}</td>
      <td>${line.concepto}</td>
      <td class="right">${line.cantidad}</td>
      <td class="right">${line.precioUd.toFixed(2)} €</td>
      <td class="right">${importe.toFixed(2)} €</td>
      <td class="right">${line.iva}%</td>
      <td class="right">${subtotal.toFixed(2)} €</td>
    </tr>`
  }

  html += `</tbody></table>
      <table class="totals">
        <tr><td>${txt.baseAmount}:</td><td class="right">${invoiceSubtotal.value.toFixed(2)} €</td></tr>
        <tr><td>${txt.totalVat}:</td><td class="right">${invoiceTotalIva.value.toFixed(2)} €</td></tr>
        <tr class="total-row"><td>${txt.total}:</td><td class="right">${invoiceTotal.value.toFixed(2)} €</td></tr>
      </table>
      <div class="conditions">
        <strong>${txt.conditions}</strong> ${invoiceConditions.value}
      </div>
    </div>
    <div class="footer">
      <span>${companyPhone.value}</span>
      <span>${companyEmail.value}</span>
      <span>${companyWeb.value}</span>
    </div>
  </body></html>`

  printHTML(html)
}

// Print HTML function
function printHTML(html: string) {
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) {
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

// Reset invoice form
function resetForm() {
  invoiceDate.value = new Date().toISOString().split('T')[0]
  invoiceConditions.value = 'Pago a 30 días'
  invoiceInEnglish.value = false
  numVehicles.value = 1
  selectedVehicles.value = ['']
  invoiceLines.value = []
  lineIdCounter = 0
  clientName.value = ''
  clientAddress1.value = ''
  clientAddress2.value = ''
  clientAddress3.value = ''
  clientDocType.value = 'NIF'
  clientDocNumber.value = ''
  updateInvoiceNumber()
  addInvoiceLine()
}

// Initialize
onMounted(() => {
  updateInvoiceNumber()
  if (invoiceLines.value.length === 0) {
    addInvoiceLine()
  }
})
</script>

<template>
  <div class="tool-content">
    <div class="tool-header">
      <h2>🧾 Generador de Facturas</h2>
      <button class="btn btn-secondary btn-sm" @click="resetForm">🔄 Nueva</button>
    </div>

    <div class="invoice-form">
      <!-- Row 1: Basic Info -->
      <div class="form-row">
        <div class="form-group">
          <label>Nº Vehículos</label>
          <input
            v-model.number="numVehicles"
            type="number"
            min="0"
            max="10"
            @change="onNumVehiclesChange"
          >
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input v-model="invoiceDate" type="date" >
        </div>
        <div class="form-group">
          <label>Condiciones</label>
          <input v-model="invoiceConditions" type="text" placeholder="Pago a 30 días" >
        </div>
        <div class="form-group checkbox-inline">
          <label><input v-model="invoiceInEnglish" type="checkbox" > Emitir en Inglés</label>
        </div>
      </div>

      <!-- Vehicle Selectors -->
      <div v-if="numVehicles > 0" class="vehicles-grid">
        <div v-for="(_, idx) in selectedVehicles" :key="idx" class="form-group">
          <label>Vehículo {{ idx + 1 }}</label>
          <select
            v-model="selectedVehicles[idx]"
            :disabled="loadingVehicles"
            @change="onVehicleSelected(idx)"
          >
            <option value="">-- Seleccionar --</option>
            <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
              {{ veh.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Invoice Number -->
      <div class="form-row">
        <div class="form-group" style="max-width: 200px">
          <label>Nº Factura</label>
          <input v-model="invoiceNumber" type="text" readonly class="readonly-input" >
        </div>
      </div>

      <hr class="divider" >

      <!-- Client Data -->
      <h4 class="section-subtitle">Facturado a:</h4>
      <div class="form-grid-3">
        <div class="form-group">
          <label>Nombre/Empresa</label>
          <input v-model="clientName" type="text" >
        </div>
        <div class="form-group">
          <label>Dirección</label>
          <input v-model="clientAddress1" type="text" >
        </div>
        <div class="form-group">
          <label>CP + Ciudad</label>
          <input v-model="clientAddress2" type="text" >
        </div>
        <div class="form-group">
          <label>Provincia + País</label>
          <input v-model="clientAddress3" type="text" >
        </div>
        <div class="form-group">
          <label>Tipo Doc</label>
          <select v-model="clientDocType">
            <option>NIF</option>
            <option>DNI</option>
            <option>Pasaporte</option>
            <option>CIF</option>
          </select>
        </div>
        <div class="form-group">
          <label>Número Doc</label>
          <input v-model="clientDocNumber" type="text" >
        </div>
      </div>

      <hr class="divider" >

      <!-- Invoice Lines -->
      <div class="lines-header">
        <h4 class="section-subtitle">Conceptos:</h4>
        <button class="btn btn-secondary btn-sm" @click="addInvoiceLine">+ Añadir línea</button>
      </div>

      <div class="lines-table">
        <div class="lines-head">
          <span>Tipo</span>
          <span>Concepto</span>
          <span class="right">Cant.</span>
          <span class="right">Precio/Ud</span>
          <span class="right">Importe</span>
          <span class="right">IVA%</span>
          <span class="right">Subtotal</span>
          <span />
        </div>
        <div v-for="line in invoiceLines" :key="line.id" class="line-row">
          <select v-model="line.tipo">
            <option>Venta</option>
            <option>Alquiler</option>
            <option>Servicio</option>
            <option>Reserva</option>
            <option>Otro</option>
          </select>
          <input v-model="line.concepto" type="text" placeholder="Concepto" >
          <input v-model.number="line.cantidad" type="number" min="1" class="right" >
          <input v-model.number="line.precioUd" type="number" step="0.01" class="right" >
          <input
            :value="getLineImporte(line).toFixed(2) + ' €'"
            type="text"
            readonly
            class="right readonly-input"
          >
          <input v-model.number="line.iva" type="number" class="right" >
          <input
            :value="getLineSubtotal(line).toFixed(2) + ' €'"
            type="text"
            readonly
            class="right readonly-input total-cell"
          >
          <button class="btn-delete" @click="removeInvoiceLine(line.id)">×</button>
        </div>
      </div>

      <hr class="divider" >

      <!-- Totals -->
      <div class="totals-section">
        <div class="totals-row">
          <span>Base Imponible:</span><span>{{ invoiceSubtotal.toFixed(2) }} €</span>
        </div>
        <div class="totals-row">
          <span>Total IVA:</span><span>{{ invoiceTotalIva.toFixed(2) }} €</span>
        </div>
        <div class="totals-row total">
          <span>TOTAL:</span><span>{{ invoiceTotal.toFixed(2) }} €</span>
        </div>
      </div>

      <hr class="divider" >

      <!-- Company Data (collapsible) -->
      <details class="company-details">
        <summary>Datos de la empresa emisora</summary>
        <div class="form-grid-3">
          <div class="form-group">
            <label>Empresa</label>
            <input v-model="companyName" type="text" >
          </div>
          <div class="form-group">
            <label>NIF</label>
            <input v-model="companyNIF" type="text" >
          </div>
          <div class="form-group">
            <label>Dirección</label>
            <input v-model="companyAddress1" type="text" >
          </div>
          <div class="form-group">
            <label>CP + Ciudad</label>
            <input v-model="companyAddress2" type="text" >
          </div>
          <div class="form-group">
            <label>País</label>
            <input v-model="companyAddress3" type="text" >
          </div>
          <div class="form-group">
            <label>Teléfono</label>
            <input v-model="companyPhone" type="text" >
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="companyEmail" type="text" >
          </div>
          <div class="form-group">
            <label>Web</label>
            <input v-model="companyWeb" type="text" >
          </div>
          <div class="form-group">
            <label>Logo (URL)</label>
            <input v-model="companyLogoUrl" type="text" placeholder="https://..." >
          </div>
        </div>
      </details>

      <!-- Generate Button -->
      <div class="form-actions">
        <button class="btn btn-primary btn-lg" @click="generateInvoicePDF">
          🧾 Generar Factura PDF
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Tool Content */
.tool-content {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.tool-header {
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

/* Invoice Form */
.invoice-form {
  padding: 20px;
}

.form-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 120px;
}

.form-group label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select {
  padding: 8px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

.readonly-input {
  background: #f3f4f6 !important;
  cursor: default;
}

.checkbox-inline {
  flex-direction: row;
  align-items: center;
  gap: 8px;
  min-width: auto;
}

.checkbox-inline label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
}

.vehicles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.form-grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.divider {
  border: none;
  border-top: 2px solid #0f2a2e;
  margin: 20px 0;
}

.section-subtitle {
  margin: 0 0 12px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #0f2a2e;
}

.lines-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.lines-header h4 {
  margin: 0;
}

/* Lines Table */
.lines-table {
  margin-bottom: 16px;
}

.lines-head {
  display: grid;
  grid-template-columns: 90px 1fr 60px 90px 90px 60px 90px 32px;
  gap: 6px;
  padding: 8px 4px;
  font-size: 0.7rem;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
}

.lines-head .right {
  text-align: right;
}

.line-row {
  display: grid;
  grid-template-columns: 90px 1fr 60px 90px 90px 60px 90px 32px;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}

.line-row select,
.line-row input {
  padding: 6px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 0.85rem;
}

.line-row input.right {
  text-align: right;
}

.line-row .total-cell {
  background: #e8f5e9 !important;
  font-weight: 600;
}

.btn-delete {
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  height: 28px;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #dc2626;
}

/* Totals Section */
.totals-section {
  max-width: 300px;
  margin-left: auto;
}

.totals-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 0.9rem;
}

.totals-row.total {
  font-size: 1.1rem;
  font-weight: bold;
  background: #e8f5e9;
  padding: 10px 12px;
  border-radius: 6px;
  margin-top: 8px;
}

/* Company Details */
.company-details {
  margin-bottom: 20px;
}

.company-details summary {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  padding: 8px 0;
}

.company-details summary:hover {
  color: #374151;
}

.company-details[open] summary {
  margin-bottom: 12px;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: 1px solid #d1d5db;
  background: #fff;
  border-radius: 8px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.15s;
}

.btn:hover {
  background: #f9fafb;
}

.btn-primary {
  background: #23424a;
  color: #fff;
  border: none;
}

.btn-primary:hover {
  background: #1a3238;
}

.btn-secondary {
  background: #6b7280;
  color: #fff;
  border: none;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-lg {
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 500;
}

.btn-sm {
  padding: 6px 12px;
  font-size: 0.85rem;
}

/* Mobile */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .vehicles-grid {
    grid-template-columns: 1fr;
  }

  .lines-head {
    display: none;
  }

  .line-row {
    grid-template-columns: 1fr 1fr;
    gap: 8px;
    padding: 12px;
    background: #f9fafb;
    border-radius: 8px;
    margin-bottom: 12px;
  }

  .line-row select:first-child {
    grid-column: 1 / -1;
  }

  .line-row input[type='text'] {
    grid-column: 1 / -1;
  }

  .btn-delete {
    grid-column: 2;
    justify-self: end;
  }

  .totals-section {
    max-width: 100%;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }
}
</style>
