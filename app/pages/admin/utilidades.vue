<script setup lang="ts">
import {
  useAdminBalance,
  type BalanceEntry,
  type BalanceFilters,
  BALANCE_REASONS,
  BALANCE_STATUS_LABELS,
} from '~/composables/admin/useAdminBalance'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()

const { entries, loading, availableYears, summary, fetchEntries } = useAdminBalance()

// Filters for balance export
const filters = reactive<BalanceFilters>({
  year: new Date().getFullYear(),
  tipo: null,
  razon: null,
  estado: null,
  subcategory_id: null,
  type_id: null,
  search: '',
})

// Export options for balance
const exportFormat = ref<'excel' | 'pdf'>('pdf')
const exportDataScope = ref<'all' | 'filtered'>('filtered')
const exportColumns = reactive({
  tipo: true,
  fecha: true,
  razon: true,
  detalle: true,
  importe: true,
  estado: true,
  notas: false,
})
const resumenOptions = reactive({
  totales: true,
  desglose: true,
  mensual: true,
})

// Active tool
const activeTool = ref<'facturas' | 'contratos' | 'exportar' | null>('facturas')

// ============ INVOICE GENERATOR ============
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

// Available vehicles for selection
const vehicleOptions = ref<VehicleOption[]>([])
const loadingVehicles = ref(false)

// Load vehicles from database
async function loadVehicleOptions() {
  loadingVehicles.value = true
  try {
    // Load active vehicles
    const { data: vehicles } = await supabase
      .from('vehicles')
      .select('id, brand, model, plate, year')
      .order('brand')

    // Load historical vehicles if table exists
    let historico: { id: string; brand: string; model: string; plate?: string; year?: number }[] =
      []
    try {
      const { data } = await supabase
        .from('historico')
        .select('id, brand, model, plate, year')
        .order('brand')
      if (data) historico = data
    } catch {
      // Table might not exist yet
    }

    const options: VehicleOption[] = []

    if (vehicles) {
      for (const v of vehicles) {
        options.push({
          id: `V-${v.id}`,
          label: `${v.brand || ''} ${v.model || ''} (${v.plate || ''}) - ${v.year || ''}`,
          source: 'vehicles',
        })
      }
    }

    for (const h of historico) {
      options.push({
        id: `H-${h.id}`,
        label: `${h.brand || ''} ${h.model || ''} (${h.plate || ''}) [H]`,
        source: 'historico',
      })
    }

    vehicleOptions.value = options
  } finally {
    loadingVehicles.value = false
  }
}

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

  const vehicle = vehicleOptions.value.find((v) => v.id === vehicleId)
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
          <div>${txt.date} ${formatDateDMY(invoiceDate.value)}</div>
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

// Reset invoice form
function resetInvoiceForm() {
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

// ============ CONTRACT GENERATOR ============
type ContractType = 'arrendamiento' | 'venta'

// Contract state
const contractType = ref<ContractType>('arrendamiento')
const contractDate = ref(new Date().toISOString().split('T')[0])
const contractLocation = ref('León')
const contractVehicle = ref('')

// Lessor/Seller data (company - arrendador/vendedor)
const lessorRepresentative = ref('Vicente González Martín')
const lessorRepresentativeNIF = ref('09725688T')
const lessorCompany = ref('TRUCKTANKIBERICA SL')
const lessorCIF = ref('B24724684')
const lessorAddress = ref('Onzonilla (León) ctra. Nacional 630 km 9')

// Lessee/Buyer data (client - arrendatario/comprador)
const lesseeType = ref<'persona' | 'empresa'>('persona')
const lesseeName = ref('')
const lesseeNIF = ref('')
const lesseeCompany = ref('')
const lesseeCIF = ref('')
const lesseeRepresentative = ref('')
const lesseeRepresentativeNIF = ref('')
const lesseeAddress = ref('')

// Vehicle data (from selection or manual)
const contractVehicleType = ref('semirremolque cisterna')
const contractVehiclePlate = ref('')
const contractVehicleResidualValue = ref(13000)

// Contract terms
const contractMonthlyRent = ref(1200)
const contractDeposit = ref(2400)
const contractDuration = ref(8)
const contractDurationUnit = ref<'meses' | 'años'>('meses')
const contractPaymentDays = ref(10)

// Purchase option (for rental contracts)
const contractHasPurchaseOption = ref(true)
const contractPurchasePrice = ref(10000)
const contractPurchaseNotice = ref(14)
const contractRentMonthsToDiscount = ref(3)

// Sale-specific
const contractSalePrice = ref(0)
const contractSalePaymentMethod = ref('Transferencia bancaria')

// Jurisdiction
const contractJurisdiction = ref('León')

// Get vehicle info when selected
function onContractVehicleSelected() {
  const vehicleId = contractVehicle.value
  if (!vehicleId) return

  const vehicle = vehicleOptions.value.find((v) => v.id === vehicleId)
  if (vehicle) {
    // Extract plate from label (format: "Brand Model (PLATE) - Year")
    const plateMatch = vehicle.label.match(/\(([^)]+)\)/)
    if (plateMatch) {
      contractVehiclePlate.value = plateMatch[1]
    }
    // Try to detect vehicle type from label
    const labelLower = vehicle.label.toLowerCase()
    if (labelLower.includes('cisterna')) {
      contractVehicleType.value = 'semirremolque cisterna'
    } else if (labelLower.includes('semirremolque')) {
      contractVehicleType.value = 'semirremolque'
    } else if (labelLower.includes('trailer')) {
      contractVehicleType.value = 'trailer'
    } else if (labelLower.includes('tractora')) {
      contractVehicleType.value = 'cabeza tractora'
    } else {
      contractVehicleType.value = 'vehículo'
    }
  }
}

// Format number as words (Spanish)
function numberToWords(n: number): string {
  const units = [
    '',
    'UN',
    'DOS',
    'TRES',
    'CUATRO',
    'CINCO',
    'SEIS',
    'SIETE',
    'OCHO',
    'NUEVE',
    'DIEZ',
    'ONCE',
    'DOCE',
    'TRECE',
    'CATORCE',
    'QUINCE',
    'DIECISEIS',
    'DIECISIETE',
    'DIECIOCHO',
    'DIECINUEVE',
  ]
  const tens = [
    '',
    '',
    'VEINTE',
    'TREINTA',
    'CUARENTA',
    'CINCUENTA',
    'SESENTA',
    'SETENTA',
    'OCHENTA',
    'NOVENTA',
  ]
  const hundreds = [
    '',
    'CIEN',
    'DOSCIENTOS',
    'TRESCIENTOS',
    'CUATROCIENTOS',
    'QUINIENTOS',
    'SEISCIENTOS',
    'SETECIENTOS',
    'OCHOCIENTOS',
    'NOVECIENTOS',
  ]

  if (n === 0) return 'CERO'
  if (n < 20) return units[n]
  if (n < 100) {
    const t = Math.floor(n / 10)
    const u = n % 10
    if (t === 2 && u > 0) return `VEINTI${units[u]}`
    return u > 0 ? `${tens[t]} Y ${units[u]}` : tens[t]
  }
  if (n < 1000) {
    const h = Math.floor(n / 100)
    const rest = n % 100
    if (n === 100) return 'CIEN'
    return rest > 0 ? `${hundreds[h]} ${numberToWords(rest)}` : hundreds[h]
  }
  if (n < 10000) {
    const th = Math.floor(n / 1000)
    const rest = n % 1000
    const thWord = th === 1 ? 'MIL' : `${units[th]} MIL`
    return rest > 0 ? `${thWord} ${numberToWords(rest)}` : thWord
  }
  // For larger numbers, just return the formatted number
  return n.toLocaleString('es-ES')
}

// Format date in Spanish
function formatDateSpanish(dateStr: string): string {
  const months = [
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
  ]
  const d = new Date(dateStr)
  return `${d.getDate()} de ${months[d.getMonth()]} de ${d.getFullYear()}`
}

// Generate rental contract
function generateRentalContract(): string {
  const date = formatDateSpanish(contractDate.value)
  const monthlyRentWords = numberToWords(contractMonthlyRent.value)
  const depositWords = numberToWords(contractDeposit.value)
  const durationWords = numberToWords(contractDuration.value)
  const residualWords = numberToWords(contractVehicleResidualValue.value)
  const purchasePriceWords = numberToWords(contractPurchasePrice.value)
  const noticeWords = numberToWords(contractPurchaseNotice.value)
  const rentMonthsWords = numberToWords(contractRentMonthsToDiscount.value)

  // Build lessee section based on type
  let lesseeSection = ''
  if (lesseeType.value === 'persona') {
    lesseeSection = `De otra parte D. ${lesseeName.value.toUpperCase()}, mayor de edad, con NIF ${lesseeNIF.value}, con domicilio en ${lesseeAddress.value}, en adelante arrendatario.`
  } else {
    lesseeSection = `De otra parte D. ${lesseeRepresentative.value}, mayor de edad, con NIF ${lesseeRepresentativeNIF.value}, en nombre y representación de la mercantil ${lesseeCompany.value.toUpperCase()}, con CIF ${lesseeCIF.value}, con domicilio en ${lesseeAddress.value}, en adelante arrendatario.`
  }

  let contract = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Arrendamiento - ${contractVehiclePlate.value}</title>
  <style>
    @page { margin: 2.5cm 2cm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; }
    h1 { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
    h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
    .header-location { text-align: right; margin-bottom: 30px; }
    .section { margin-bottom: 15px; }
    .clause { margin-bottom: 15px; text-align: justify; }
    .clause-title { font-weight: bold; }
    ul { margin: 10px 0 10px 30px; }
    li { margin-bottom: 5px; }
    .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-block { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 80px; padding-top: 10px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>CONTRATO DE ARRENDAMIENTO DE ${contractVehicleType.value.toUpperCase()}</h1>

  <p class="header-location">En ${contractLocation.value} a ${date}</p>

  <h2>REUNIDOS</h2>

  <p class="section">De una parte D. ${lessorRepresentative.value}, mayor de edad, con DNI ${lessorRepresentativeNIF.value}, en nombre y representación de la mercantil ${lessorCompany.value.toUpperCase()}, con el CIF ${lessorCIF.value}, con domicilio en ${lessorAddress.value} (en adelante arrendador).</p>

  <p class="section">${lesseeSection}</p>

  <p class="section">Las partes, reconociéndose capacidad suficiente para celebrar el presente contrato de arrendamiento de ${contractVehicleType.value},</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el arrendador es propietario de ${contractVehicleType.value} matrícula ${contractVehiclePlate.value}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el arrendatario está interesado en arrendar dicho vehículo para su explotación.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  En virtud del presente contrato el arrendador cede el ${contractVehicleType.value} en arrendamiento al arrendatario y este la toma en arrendamiento para su explotación como transportista por su cuenta y riesgo para las operaciones de transporte, carga y descarga durante todo el periodo que dure el presente contrato.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- UTILIZACIÓN DEL VEHÍCULO</span><br>
  La utilización del vehículo por el arrendatario respetará en todo momento la vigente normativa, y en especial, la legislación en materia de transporte y tráfico, la legislación sobre protección y conservación del medio ambiente y las normas sobre Seguridad e Higiene en el Trabajo.</p>

  <p class="clause"><span class="clause-title">TERCERA.- CESIÓN DEL VEHÍCULO</span><br>
  Queda terminantemente prohibida toda cesión del vehículo a terceros por parte del arrendatario, en cualquier forma o modalidad, bien sea a título oneroso o gratuito, sin la previa autorización por escrito del arrendador.</p>

  <p class="clause"><span class="clause-title">CUARTA.- ALTERACIONES EN EL VEHÍCULO</span><br>
  El arrendatario no podrá llevar a cabo, por sí mismo o a través de terceros, alteración o modificación alguna en la naturaleza, condiciones o prestaciones del ${contractVehicleType.value} que suponga o permita un uso distinto para el que es cedido en arrendamiento.</p>

  <p class="clause"><span class="clause-title">QUINTA.- MANTENIMIENTO Y REPARACIONES DEL VEHÍCULO</span><br>
  El arrendador asume el desgaste mecánico normal del vehículo teniendo en cuenta el uso para el que se destina por parte del arrendatario. Los gastos de mantenimiento, reparación de averías sufridas por el vehículo y cambio de ruedas durante el tiempo de arrendamiento son de cargo del arrendatario.<br><br>
  El arrendatario deberá informar al arrendador de cualquier incidencia que afecte al normal uso del vehículo en un plazo no superior a 7 días desde que se produzca dicha incidencia.<br><br>
  El arrendador facilitará el vehículo con la ITV pasada, significando esto que todos sus componentes son aptos para el correcto funcionamiento del mismo. Cualquier renovación que requiriese el vehículo durante el periodo de arrendamiento será gestionado por el arrendatario.</p>

  <p class="clause"><span class="clause-title">SEXTA.- DESPERFECTOS Y DAÑOS POR MAL USO</span><br>
  El arrendatario responderá íntegramente de los desperfectos que el vehículo sufra, excepto de los daños cuya reparación sea superior al valor residual del vehículo, el cual las partes fijan en ${residualWords} (${contractVehicleResidualValue.value.toLocaleString('es-ES')} €).<br><br>
  En caso de discrepancia sobre el importe y valoración de los daños, el arrendador designará un perito para que haga una valoración de los mismos.</p>

  <p class="clause"><span class="clause-title">SÉPTIMA.- INSPECCIÓN DEL VEHÍCULO</span><br>
  El Arrendador podrá inspeccionar la instalación, conservación y utilización del vehículo en cualquier momento, dentro del horario laboral del Arrendatario, el cual garantizará a los representantes del Arrendador el acceso al vehículo para su inspección.</p>

  <p class="clause"><span class="clause-title">OCTAVA.- PÓLIZA DE SEGURO</span><br>
  El arrendador entrega el vehículo con seguro de circulación básico siendo por cuenta del arrendatario asegurar la carga y la responsabilidad civil de la misma.</p>

  <p class="clause"><span class="clause-title">NOVENA.- PRECIO Y FIANZA</span><br>
  El arrendador percibirá del arrendatario la cantidad de ${monthlyRentWords} (${contractMonthlyRent.value.toLocaleString('es-ES')} €) MENSUALES MÁS EL IVA.<br><br>
  Dicho precio se hará efectivo dentro de los ${contractPaymentDays.value} días naturales siguientes a la emisión por parte del arrendador de la correspondiente factura.<br><br>
  Se establece una fianza de ${depositWords} EUROS (${contractDeposit.value.toLocaleString('es-ES')} €) pagadera junto con la primera mensualidad y también por anticipado.</p>

  <p class="clause"><span class="clause-title">DÉCIMA.- DURACIÓN</span><br>
  El presente contrato entrará en vigor en la fecha indicada en el encabezamiento y tendrá una duración de ${durationWords} (${contractDuration.value}) ${contractDurationUnit.value.toUpperCase()} pudiéndose prorrogar al final del vencimiento, mes a mes por acuerdo expreso de las partes.</p>

  <p class="clause"><span class="clause-title">UNDÉCIMA.- VENCIMIENTO ANTICIPADO</span><br>
  El presente contrato quedará resuelto automáticamente a instancia de la parte no incursa en causa de resolución y sin necesidad de preaviso alguno, cuando concurra cualquiera de las siguientes circunstancias:</p>
  <ul>
    <li>Incumplimiento, total o parcial, de cualesquiera de las cláusulas establecidas en el contrato.</li>
    <li>Por destrucción o menoscabo del vehículo que haga inviable su uso.</li>
    <li>Por estar inmerso cualquiera de las partes en los supuestos de insolvencia o concurso de acreedores.</li>
  </ul>
  <p class="clause">En tales casos, el Contrato se entenderá resuelto a la recepción de la notificación escrita. El arrendador tendrá derecho a recuperar el vehículo de forma inmediata.</p>

  <p class="clause"><span class="clause-title">DUODÉCIMA.- PROPIEDAD DEL VEHÍCULO</span><br>
  El vehículo es siempre, y en todo momento, propiedad exclusiva del arrendador, y consiguientemente, el arrendatario se obliga a adoptar cuantas medidas sean necesarias para proclamar, respetar y hacer respetar a terceros el derecho de propiedad.</p>

  <p class="clause"><span class="clause-title">DECIMOTERCERA.- GASTOS E IMPUESTOS</span><br>
  Todos cuantos gastos e impuestos se originen con motivo del presente Contrato serán sufragados por las partes conforme a lo dispuesto en la Ley.</p>

  <p class="clause"><span class="clause-title">DECIMOCUARTA.- LEY APLICABLE Y JURISDICCIÓN</span><br>
  El presente Contrato se regirá por la legislación española.<br><br>
  Para la solución de cualquier cuestión litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${contractJurisdiction.value} renunciando expresamente al fuero de los que por cualquier motivo pudiera corresponderles.</p>`

  // Add purchase option clause if enabled
  if (contractHasPurchaseOption.value) {
    contract += `
  <p class="clause"><span class="clause-title">DECIMOQUINTA.- OPCIÓN DE COMPRA Y APLICACIÓN DE RENTAS</span><br>
  <strong>1. Concesión de la opción.</strong><br>
  El Arrendador concede al Arrendatario una opción de compra sobre el bien objeto del presente contrato (${contractVehicleType.value} matrícula ${contractVehiclePlate.value}). La opción podrá ejercitarse durante la vigencia del arrendamiento mediante notificación escrita al Arrendador con una antelación mínima de ${noticeWords} (${contractPurchaseNotice.value}) días.<br><br>
  <strong>2. Precio de ejercicio.</strong><br>
  El precio de compraventa se fija en ${purchasePriceWords} EUR (${contractPurchasePrice.value.toLocaleString('es-ES')} €), impuestos no incluidos, salvo modificación pactada por escrito entre las partes.<br><br>
  <strong>3. Imputación de rentas al precio de compraventa.</strong><br>
  En caso de ejercitarse la opción de compra, únicamente se descontará del precio de compraventa el importe correspondiente a las ${rentMonthsWords} (${contractRentMonthsToDiscount.value}) últimas mensualidades de renta efectivamente pagadas por el Arrendatario inmediatamente anteriores a la fecha de ejercicio de la opción.<br>
  Ninguna otra renta, fianza ni cantidad abonada por el Arrendatario será objeto de deducción, salvo pacto expreso y por escrito.<br><br>
  <strong>4. Formalización de la compraventa.</strong><br>
  Ejercida la opción, las partes suscribirán la documentación de transmisión en un plazo máximo de ${noticeWords} (${contractPurchaseNotice.value}) días desde la notificación. Los gastos, tasas e impuestos derivados de la transmisión serán asumidos por la parte legalmente obligada.</p>`
  }

  // Signatures
  const lesseeSignatureName =
    lesseeType.value === 'persona'
      ? lesseeName.value.toUpperCase()
      : `${lesseeCompany.value.toUpperCase()}<br>D. ${lesseeRepresentative.value}`

  const lesseeSignatureDoc =
    lesseeType.value === 'persona' ? `NIF: ${lesseeNIF.value}` : `CIF: ${lesseeCIF.value}`

  contract += `
  <p style="margin-top: 40px;">Y en prueba de conformidad con el presente Contrato, las partes lo firman por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.</p>

  <div class="signatures">
    <div class="signature-block">
      <p>El Arrendador</p>
      <div class="signature-line">
        ${lessorCompany.value.toUpperCase()}<br>
        CIF: ${lessorCIF.value}<br>
        D. ${lessorRepresentative.value}
      </div>
    </div>
    <div class="signature-block">
      <p>El Arrendatario</p>
      <div class="signature-line">
        ${lesseeSignatureName}<br>
        ${lesseeSignatureDoc}
      </div>
    </div>
  </div>
</body>
</html>`

  return contract
}

// Generate sale contract
function generateSaleContract(): string {
  const date = formatDateSpanish(contractDate.value)
  const salePriceWords = numberToWords(contractSalePrice.value)

  // Build seller and buyer sections
  let buyerSection = ''
  if (lesseeType.value === 'persona') {
    buyerSection = `De otra parte D. ${lesseeName.value.toUpperCase()}, mayor de edad, con NIF ${lesseeNIF.value}, con domicilio en ${lesseeAddress.value}, en adelante comprador.`
  } else {
    buyerSection = `De otra parte D. ${lesseeRepresentative.value}, mayor de edad, con NIF ${lesseeRepresentativeNIF.value}, en nombre y representación de la mercantil ${lesseeCompany.value.toUpperCase()}, con CIF ${lesseeCIF.value}, con domicilio en ${lesseeAddress.value}, en adelante comprador.`
  }

  const buyerSignatureName =
    lesseeType.value === 'persona'
      ? lesseeName.value.toUpperCase()
      : `${lesseeCompany.value.toUpperCase()}<br>D. ${lesseeRepresentative.value}`

  const buyerSignatureDoc =
    lesseeType.value === 'persona' ? `NIF: ${lesseeNIF.value}` : `CIF: ${lesseeCIF.value}`

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Compraventa - ${contractVehiclePlate.value}</title>
  <style>
    @page { margin: 2.5cm 2cm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.6; color: #000; }
    h1 { text-align: center; font-size: 14pt; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
    h2 { font-size: 12pt; font-weight: bold; margin-top: 20px; margin-bottom: 10px; }
    .header-location { text-align: right; margin-bottom: 30px; }
    .section { margin-bottom: 15px; }
    .clause { margin-bottom: 15px; text-align: justify; }
    .clause-title { font-weight: bold; }
    .signatures { margin-top: 60px; display: flex; justify-content: space-between; }
    .signature-block { width: 45%; text-align: center; }
    .signature-line { border-top: 1px solid #000; margin-top: 80px; padding-top: 10px; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>
  <h1>CONTRATO DE COMPRAVENTA DE ${contractVehicleType.value.toUpperCase()}</h1>

  <p class="header-location">En ${contractLocation.value} a ${date}</p>

  <h2>REUNIDOS</h2>

  <p class="section">De una parte D. ${lessorRepresentative.value}, mayor de edad, con DNI ${lessorRepresentativeNIF.value}, en nombre y representación de la mercantil ${lessorCompany.value.toUpperCase()}, con el CIF ${lessorCIF.value}, con domicilio en ${lessorAddress.value} (en adelante vendedor).</p>

  <p class="section">${buyerSection}</p>

  <p class="section">Las partes, reconociéndose capacidad suficiente para celebrar el presente contrato de compraventa,</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el vendedor es propietario de ${contractVehicleType.value} matrícula ${contractVehiclePlate.value}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el comprador está interesado en adquirir dicho vehículo y el vendedor en transmitirlo.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  El vendedor vende y transmite al comprador, que acepta y adquiere, el ${contractVehicleType.value} con matrícula ${contractVehiclePlate.value}, libre de cargas y gravámenes.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- PRECIO</span><br>
  El precio de la compraventa se fija en ${salePriceWords} EUROS (${contractSalePrice.value.toLocaleString('es-ES')} €) más el IVA correspondiente.</p>

  <p class="clause"><span class="clause-title">TERCERA.- FORMA DE PAGO</span><br>
  El pago se realizará mediante ${contractSalePaymentMethod.value} en el momento de la firma del presente contrato.</p>

  <p class="clause"><span class="clause-title">CUARTA.- ENTREGA</span><br>
  El vendedor se compromete a entregar el vehículo al comprador en el estado en que se encuentra, el cual ha sido examinado y aceptado por el comprador.</p>

  <p class="clause"><span class="clause-title">QUINTA.- DOCUMENTACIÓN</span><br>
  El vendedor entregará al comprador toda la documentación necesaria para la circulación del vehículo y el cambio de titularidad, incluyendo ficha técnica, permiso de circulación e informe de la DGT.</p>

  <p class="clause"><span class="clause-title">SEXTA.- GASTOS E IMPUESTOS</span><br>
  Los gastos e impuestos derivados de la transmisión serán asumidos por la parte legalmente obligada. El Impuesto de Transmisiones Patrimoniales será por cuenta del comprador.</p>

  <p class="clause"><span class="clause-title">SÉPTIMA.- LEY APLICABLE Y JURISDICCIÓN</span><br>
  El presente Contrato se regirá por la legislación española.<br><br>
  Para la solución de cualquier cuestión litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${contractJurisdiction.value}.</p>

  <p style="margin-top: 40px;">Y en prueba de conformidad con el presente Contrato, las partes lo firman por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.</p>

  <div class="signatures">
    <div class="signature-block">
      <p>El Vendedor</p>
      <div class="signature-line">
        ${lessorCompany.value.toUpperCase()}<br>
        CIF: ${lessorCIF.value}<br>
        D. ${lessorRepresentative.value}
      </div>
    </div>
    <div class="signature-block">
      <p>El Comprador</p>
      <div class="signature-line">
        ${buyerSignatureName}<br>
        ${buyerSignatureDoc}
      </div>
    </div>
  </div>
</body>
</html>`
}

// Generate contract PDF
function generateContractPDF() {
  const html =
    contractType.value === 'arrendamiento' ? generateRentalContract() : generateSaleContract()

  printHTML(html)
}

// Reset contract form
function resetContractForm() {
  contractType.value = 'arrendamiento'
  contractDate.value = new Date().toISOString().split('T')[0]
  contractVehicle.value = ''
  contractVehiclePlate.value = ''
  lesseeType.value = 'persona'
  lesseeName.value = ''
  lesseeNIF.value = ''
  lesseeCompany.value = ''
  lesseeCIF.value = ''
  lesseeRepresentative.value = ''
  lesseeRepresentativeNIF.value = ''
  lesseeAddress.value = ''
  contractMonthlyRent.value = 1200
  contractDeposit.value = 2400
  contractDuration.value = 8
  contractHasPurchaseOption.value = true
  contractPurchasePrice.value = 10000
  contractSalePrice.value = 0
}

// Load data
onMounted(async () => {
  await fetchEntries(filters)
  // Initialize invoice form
  await loadVehicleOptions()
  updateInvoiceNumber()
  if (invoiceLines.value.length === 0) {
    addInvoiceLine()
  }
})

// Watch filters
watch(
  filters,
  () => {
    fetchEntries(filters)
  },
  { deep: true },
)

// Monthly breakdown for export
const monthlyBreakdown = computed(() => {
  const months: Record<string, { ingresos: number; gastos: number }> = {}
  for (const e of entries.value) {
    const month = e.fecha.substring(0, 7)
    if (!months[month]) {
      months[month] = { ingresos: 0, gastos: 0 }
    }
    if (e.tipo === 'ingreso') {
      months[month].ingresos += e.importe
    } else {
      months[month].gastos += e.importe
    }
  }
  return Object.entries(months).sort((a, b) => b[0].localeCompare(a[0]))
})

// Export functions
async function exportBalance() {
  let dataToExport = [...entries.value]

  if (exportDataScope.value === 'all') {
    // Fetch all entries without filters for full export
    await fetchEntries({})
    dataToExport = [...entries.value]
    // Re-fetch with current filters to restore the view
    await fetchEntries(filters)
  }

  if (exportFormat.value === 'excel') {
    exportToExcel(dataToExport)
  } else {
    exportToPDF(dataToExport)
  }
}

function exportToExcel(data: BalanceEntry[]) {
  const headers: string[] = []
  if (exportColumns.tipo) headers.push('Tipo')
  if (exportColumns.fecha) headers.push('Fecha')
  if (exportColumns.razon) headers.push('Razón')
  if (exportColumns.detalle) headers.push('Detalle')
  if (exportColumns.importe) headers.push('Importe')
  if (exportColumns.estado) headers.push('Estado')
  if (exportColumns.notas) headers.push('Notas')

  const rows = data.map((e) => {
    const row: string[] = []
    if (exportColumns.tipo) row.push(e.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')
    if (exportColumns.fecha) row.push(e.fecha)
    if (exportColumns.razon) row.push(BALANCE_REASONS[e.razon])
    if (exportColumns.detalle) row.push(e.detalle || '')
    if (exportColumns.importe)
      row.push(`${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€`)
    if (exportColumns.estado) row.push(BALANCE_STATUS_LABELS[e.estado])
    if (exportColumns.notas) row.push(e.notas || '')
    return row
  })

  const csv = [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  downloadFile(csv, `balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportToPDF(data: BalanceEntry[]) {
  let html = `<!DOCTYPE html><html><head><title>Balance ${filters.year || 'Todos'}</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      h1 { font-size: 18px; }
      table { width: 100%; border-collapse: collapse; margin-top: 20px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
      th { background: #f3f4f6; }
      .ingreso { color: green; }
      .gasto { color: red; }
      .totals { margin-top: 20px; }
      @media print { body { margin: 0; } }
    </style>
  </head><body>
    <h1>Balance ${filters.year || 'Todos los años'}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>
    <table><thead><tr>`

  if (exportColumns.tipo) html += '<th>Tipo</th>'
  if (exportColumns.fecha) html += '<th>Fecha</th>'
  if (exportColumns.razon) html += '<th>Razón</th>'
  if (exportColumns.detalle) html += '<th>Detalle</th>'
  if (exportColumns.importe) html += '<th>Importe</th>'
  if (exportColumns.estado) html += '<th>Estado</th>'
  if (exportColumns.notas) html += '<th>Notas</th>'

  html += '</tr></thead><tbody>'

  for (const e of data) {
    html += '<tr>'
    if (exportColumns.tipo) html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '↑' : '↓'}</td>`
    if (exportColumns.fecha) html += `<td>${e.fecha}</td>`
    if (exportColumns.razon) html += `<td>${BALANCE_REASONS[e.razon]}</td>`
    if (exportColumns.detalle) html += `<td>${e.detalle || ''}</td>`
    if (exportColumns.importe)
      html += `<td class="${e.tipo}">${e.tipo === 'ingreso' ? '+' : '-'}${e.importe.toFixed(2)}€</td>`
    if (exportColumns.estado) html += `<td>${BALANCE_STATUS_LABELS[e.estado]}</td>`
    if (exportColumns.notas) html += `<td>${e.notas || ''}</td>`
    html += '</tr>'
  }

  html += `</tbody></table>
    <div class="totals">
      <p><strong>Total Ingresos:</strong> +${summary.value.totalIngresos.toFixed(2)}€</p>
      <p><strong>Total Gastos:</strong> -${summary.value.totalGastos.toFixed(2)}€</p>
      <p><strong>Balance Neto:</strong> ${summary.value.balanceNeto.toFixed(2)}€</p>
    </div>
  </body></html>`

  printHTML(html)
}

function exportResumen() {
  if (exportFormat.value === 'excel') {
    exportResumenExcel()
  } else {
    exportResumenPDF()
  }
}

function exportResumenExcel() {
  const lines: string[] = ['Concepto;Ingresos;Gastos;Neto']

  if (resumenOptions.totales) {
    lines.push(`TOTAL INGRESOS;+${summary.value.totalIngresos.toFixed(2)}€;;`)
    lines.push(`TOTAL GASTOS;;-${summary.value.totalGastos.toFixed(2)}€;`)
    lines.push(`BALANCE NETO;;;${summary.value.balanceNeto.toFixed(2)}€`)
    lines.push('')
  }

  if (resumenOptions.desglose) {
    lines.push('DESGLOSE POR RAZÓN;;;')
    for (const [key, label] of Object.entries(BALANCE_REASONS)) {
      const data = summary.value.byReason[key]
      if (data) {
        const neto = (data.ingresos || 0) - (data.gastos || 0)
        lines.push(
          `${label};+${(data.ingresos || 0).toFixed(2)}€;-${(data.gastos || 0).toFixed(2)}€;${neto.toFixed(2)}€`,
        )
      }
    }
    lines.push('')
  }

  if (resumenOptions.mensual) {
    lines.push('DESGLOSE MENSUAL;;;')
    for (const [month, data] of monthlyBreakdown.value) {
      const neto = data.ingresos - data.gastos
      lines.push(
        `${month};+${data.ingresos.toFixed(2)}€;-${data.gastos.toFixed(2)}€;${neto.toFixed(2)}€`,
      )
    }
  }

  downloadFile(lines.join('\n'), `resumen_balance_${filters.year || 'todos'}.csv`, 'text/csv')
}

function exportResumenPDF() {
  let html = `<!DOCTYPE html><html><head><title>Resumen Balance</title>
    <style>
      body { font-family: 'Inter', 'Segoe UI', Arial, sans-serif; font-size: 12px; margin: 0; color: #1F2A2A; }
      h1, h2 { margin-bottom: 10px; }
      h1 { font-size: 18px; }
      h2 { font-size: 14px; margin-top: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
      th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: right; }
      th { background: #f3f4f6; text-align: left; }
      td:first-child { text-align: left; }
      .positive { color: green; }
      .negative { color: red; }
      @media print { body { margin: 0; } }
    </style>
  </head><body>
    <h1>Resumen Balance ${filters.year || 'Todos los años'}</h1>
    <p>Generado: ${new Date().toLocaleDateString('es-ES')}</p>`

  if (resumenOptions.totales) {
    html += `<h2>Totales</h2>
      <table>
        <tr><td>Total Ingresos</td><td class="positive">+${summary.value.totalIngresos.toFixed(2)}€</td></tr>
        <tr><td>Total Gastos</td><td class="negative">-${summary.value.totalGastos.toFixed(2)}€</td></tr>
        <tr><td><strong>Balance Neto</strong></td><td class="${summary.value.balanceNeto >= 0 ? 'positive' : 'negative'}"><strong>${summary.value.balanceNeto.toFixed(2)}€</strong></td></tr>
      </table>`
  }

  if (resumenOptions.desglose) {
    html += `<h2>Desglose por Razón</h2>
      <table><thead><tr><th>Razón</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
    for (const [key, label] of Object.entries(BALANCE_REASONS)) {
      const data = summary.value.byReason[key]
      if (data && (data.ingresos > 0 || data.gastos > 0)) {
        const neto = (data.ingresos || 0) - (data.gastos || 0)
        html += `<tr><td>${label}</td><td class="positive">+${(data.ingresos || 0).toFixed(2)}€</td><td class="negative">-${(data.gastos || 0).toFixed(2)}€</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}€</td></tr>`
      }
    }
    html += '</tbody></table>'
  }

  if (resumenOptions.mensual) {
    html += `<h2>Desglose Mensual</h2>
      <table><thead><tr><th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Neto</th></tr></thead><tbody>`
    for (const [month, data] of monthlyBreakdown.value) {
      const neto = data.ingresos - data.gastos
      html += `<tr><td>${month}</td><td class="positive">+${data.ingresos.toFixed(2)}€</td><td class="negative">-${data.gastos.toFixed(2)}€</td><td class="${neto >= 0 ? 'positive' : 'negative'}">${neto.toFixed(2)}€</td></tr>`
    }
    html += '</tbody></table>'
  }

  html += '</body></html>'

  printHTML(html)
}

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
    alert('No se pudo abrir la ventana de impresión.')
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

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function fmt(val: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(val)
}
</script>

<template>
  <div class="utilidades-page">
    <!-- Header -->
    <header class="page-header">
      <h1>🛠️ Utilidades</h1>
      <p class="subtitle">Herramientas de gestión financiera</p>
    </header>

    <!-- Tool Cards -->
    <div class="tools-grid">
      <!-- Generador de Facturas -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'facturas' }"
        @click="
          activeTool = 'facturas'
          loadVehicleOptions()
        "
      >
        <div class="tool-icon">🧾</div>
        <div class="tool-info">
          <h3>Generador de Facturas</h3>
          <p>Crear facturas comerciales con datos de cliente y vehículos</p>
        </div>
      </div>

      <!-- Generador de Contratos -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'contratos' }"
        @click="
          activeTool = 'contratos'
          loadVehicleOptions()
        "
      >
        <div class="tool-icon">📝</div>
        <div class="tool-info">
          <h3>Generador de Contratos</h3>
          <p>Crear contratos de arrendamiento o compraventa</p>
        </div>
      </div>

      <!-- Exportar Balance -->
      <div
        class="tool-card"
        :class="{ active: activeTool === 'exportar' }"
        @click="activeTool = 'exportar'"
      >
        <div class="tool-icon">📊</div>
        <div class="tool-info">
          <h3>Exportar Balance</h3>
          <p>Exportar transacciones y resúmenes a PDF o Excel</p>
        </div>
      </div>
    </div>

    <!-- ==================== INVOICE GENERATOR ==================== -->
    <div v-if="activeTool === 'facturas'" class="tool-content">
      <div class="tool-header">
        <h2>🧾 Generador de Facturas</h2>
        <button class="btn btn-secondary btn-sm" @click="resetInvoiceForm">🔄 Nueva</button>
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

    <!-- ==================== CONTRACT GENERATOR ==================== -->
    <div v-if="activeTool === 'contratos'" class="tool-content">
      <div class="tool-header">
        <h2>📝 Generador de Contratos</h2>
        <button class="btn btn-secondary btn-sm" @click="resetContractForm">🔄 Nuevo</button>
      </div>

      <div class="contract-form">
        <!-- Contract Type -->
        <div class="form-row">
          <div class="form-group" style="flex: 2">
            <label>Tipo de Contrato</label>
            <div class="radio-group-inline">
              <label class="radio-card" :class="{ active: contractType === 'arrendamiento' }">
                <input v-model="contractType" type="radio" value="arrendamiento" >
                <span class="radio-icon">🔄</span>
                <span class="radio-label">Arrendamiento</span>
              </label>
              <label class="radio-card" :class="{ active: contractType === 'venta' }">
                <input v-model="contractType" type="radio" value="venta" >
                <span class="radio-icon">💰</span>
                <span class="radio-label">Compraventa</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>Fecha</label>
            <input v-model="contractDate" type="date" >
          </div>
          <div class="form-group">
            <label>Lugar</label>
            <input v-model="contractLocation" type="text" placeholder="León" >
          </div>
        </div>

        <!-- Vehicle Selection -->
        <div class="form-row">
          <div class="form-group" style="flex: 2">
            <label>Vehículo</label>
            <select
              v-model="contractVehicle"
              :disabled="loadingVehicles"
              @change="onContractVehicleSelected"
            >
              <option value="">-- Seleccionar del catálogo --</option>
              <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
                {{ veh.label }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Tipo de Vehículo</label>
            <input v-model="contractVehicleType" type="text" placeholder="semirremolque cisterna" >
          </div>
          <div class="form-group">
            <label>Matrícula</label>
            <input v-model="contractVehiclePlate" type="text" placeholder="S02999R" >
          </div>
        </div>

        <hr class="divider" >

        <!-- Lessor/Seller (Company) -->
        <details class="company-details" open>
          <summary>
            Datos del {{ contractType === 'arrendamiento' ? 'Arrendador' : 'Vendedor' }} (Empresa)
          </summary>
          <div class="form-grid-3">
            <div class="form-group">
              <label>Empresa</label>
              <input v-model="lessorCompany" type="text" >
            </div>
            <div class="form-group">
              <label>CIF</label>
              <input v-model="lessorCIF" type="text" >
            </div>
            <div class="form-group">
              <label>Domicilio</label>
              <input v-model="lessorAddress" type="text" >
            </div>
            <div class="form-group">
              <label>Representante</label>
              <input v-model="lessorRepresentative" type="text" >
            </div>
            <div class="form-group">
              <label>DNI Representante</label>
              <input v-model="lessorRepresentativeNIF" type="text" >
            </div>
          </div>
        </details>

        <hr class="divider" >

        <!-- Lessee/Buyer -->
        <h4 class="section-subtitle">
          {{ contractType === 'arrendamiento' ? 'Arrendatario' : 'Comprador' }}
        </h4>

        <div class="form-row">
          <div class="form-group">
            <label>Tipo</label>
            <div class="radio-group-inline compact">
              <label :class="{ active: lesseeType === 'persona' }">
                <input v-model="lesseeType" type="radio" value="persona" > Persona física
              </label>
              <label :class="{ active: lesseeType === 'empresa' }">
                <input v-model="lesseeType" type="radio" value="empresa" > Empresa
              </label>
            </div>
          </div>
        </div>

        <!-- Person fields -->
        <div v-if="lesseeType === 'persona'" class="form-grid-3">
          <div class="form-group">
            <label>Nombre completo</label>
            <input v-model="lesseeName" type="text" placeholder="JOSE MANUEL VAZQUEZ LEA" >
          </div>
          <div class="form-group">
            <label>NIF</label>
            <input v-model="lesseeNIF" type="text" placeholder="78813316K" >
          </div>
          <div class="form-group" style="grid-column: 1 / -1">
            <label>Domicilio</label>
            <input
              v-model="lesseeAddress"
              type="text"
              placeholder="Lugar San Cristovo, 12 15310 San Cristovo, A Coruña, España"
            >
          </div>
        </div>

        <!-- Company fields -->
        <div v-if="lesseeType === 'empresa'" class="form-grid-3">
          <div class="form-group">
            <label>Empresa</label>
            <input v-model="lesseeCompany" type="text" >
          </div>
          <div class="form-group">
            <label>CIF</label>
            <input v-model="lesseeCIF" type="text" >
          </div>
          <div class="form-group">
            <label>Representante</label>
            <input v-model="lesseeRepresentative" type="text" >
          </div>
          <div class="form-group">
            <label>NIF Representante</label>
            <input v-model="lesseeRepresentativeNIF" type="text" >
          </div>
          <div class="form-group" style="grid-column: span 2">
            <label>Domicilio</label>
            <input v-model="lesseeAddress" type="text" >
          </div>
        </div>

        <hr class="divider" >

        <!-- Rental Terms (only for arrendamiento) -->
        <div v-if="contractType === 'arrendamiento'">
          <h4 class="section-subtitle">Condiciones del Arrendamiento</h4>

          <div class="form-grid-3">
            <div class="form-group">
              <label>Renta mensual (€)</label>
              <input v-model.number="contractMonthlyRent" type="number" step="100" >
            </div>
            <div class="form-group">
              <label>Fianza (€)</label>
              <input v-model.number="contractDeposit" type="number" step="100" >
            </div>
            <div class="form-group">
              <label>Plazo pago (días)</label>
              <input v-model.number="contractPaymentDays" type="number" >
            </div>
            <div class="form-group">
              <label>Duración</label>
              <input v-model.number="contractDuration" type="number" >
            </div>
            <div class="form-group">
              <label>Unidad</label>
              <select v-model="contractDurationUnit">
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
            <div class="form-group">
              <label>Valor residual (€)</label>
              <input v-model.number="contractVehicleResidualValue" type="number" step="1000" >
            </div>
          </div>

          <!-- Purchase Option -->
          <div class="option-toggle">
            <label>
              <input v-model="contractHasPurchaseOption" type="checkbox" >
              <span>Incluir opción de compra</span>
            </label>
          </div>

          <div v-if="contractHasPurchaseOption" class="form-grid-3 purchase-options">
            <div class="form-group">
              <label>Precio de compra (€)</label>
              <input v-model.number="contractPurchasePrice" type="number" step="1000" >
            </div>
            <div class="form-group">
              <label>Preaviso (días)</label>
              <input v-model.number="contractPurchaseNotice" type="number" >
            </div>
            <div class="form-group">
              <label>Mensualidades a descontar</label>
              <input v-model.number="contractRentMonthsToDiscount" type="number" >
            </div>
          </div>
        </div>

        <!-- Sale Terms (only for venta) -->
        <div v-if="contractType === 'venta'">
          <h4 class="section-subtitle">Condiciones de la Compraventa</h4>

          <div class="form-grid-3">
            <div class="form-group">
              <label>Precio de venta (€)</label>
              <input v-model.number="contractSalePrice" type="number" step="1000" >
            </div>
            <div class="form-group">
              <label>Forma de pago</label>
              <select v-model="contractSalePaymentMethod">
                <option>Transferencia bancaria</option>
                <option>Efectivo</option>
                <option>Cheque</option>
                <option>Financiación</option>
              </select>
            </div>
          </div>
        </div>

        <hr class="divider" >

        <!-- Jurisdiction -->
        <div class="form-row">
          <div class="form-group" style="max-width: 300px">
            <label>Jurisdicción (Tribunales de)</label>
            <input v-model="contractJurisdiction" type="text" placeholder="León" >
          </div>
        </div>

        <!-- Generate Button -->
        <div class="form-actions">
          <button class="btn btn-primary btn-lg" @click="generateContractPDF">
            📝 Generar Contrato PDF
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== EXPORT BALANCE ==================== -->
    <div v-if="activeTool === 'exportar'" class="tool-content">
      <div class="tool-header">
        <h2>📊 Exportar Balance y Resúmenes</h2>
      </div>

      <!-- Preview Summary -->
      <div class="preview-summary">
        <div class="summary-item">
          <span class="label">Período:</span>
          <span class="value">{{ filters.year || 'Todos los años' }}</span>
        </div>
        <div class="summary-item positive">
          <span class="label">Ingresos:</span>
          <span class="value">{{ fmt(summary.totalIngresos) }}</span>
        </div>
        <div class="summary-item negative">
          <span class="label">Gastos:</span>
          <span class="value">{{ fmt(summary.totalGastos) }}</span>
        </div>
        <div class="summary-item" :class="summary.balanceNeto >= 0 ? 'positive' : 'negative'">
          <span class="label">Balance:</span>
          <span class="value">{{ fmt(summary.balanceNeto) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Transacciones:</span>
          <span class="value">{{ entries.length }}</span>
        </div>
      </div>

      <!-- Export Options -->
      <div class="export-sections">
        <!-- Section 1: Filters -->
        <div class="export-section">
          <h3>1. Seleccionar Período</h3>
          <div class="filter-row">
            <select v-model="filters.year" class="select-input">
              <option :value="null">Todos los años</option>
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}</option>
            </select>
            <select v-model="filters.tipo" class="select-input">
              <option :value="null">Todos los tipos</option>
              <option value="ingreso">Solo Ingresos</option>
              <option value="gasto">Solo Gastos</option>
            </select>
          </div>
        </div>

        <!-- Section 2: Export Balance -->
        <div class="export-section">
          <h3>2. Exportar Balance Completo</h3>
          <p class="section-desc">Genera un listado detallado de todas las transacciones</p>

          <div class="option-group">
            <label class="option-label">Formato:</label>
            <div class="radio-group horizontal">
              <label
                ><input v-model="exportFormat" type="radio" value="pdf" > PDF (Imprimir)</label
              >
              <label><input v-model="exportFormat" type="radio" value="excel" > Excel (CSV)</label>
            </div>
          </div>

          <div class="option-group">
            <label class="option-label">Columnas a incluir:</label>
            <div class="checkbox-grid">
              <label><input v-model="exportColumns.tipo" type="checkbox" > Tipo</label>
              <label><input v-model="exportColumns.fecha" type="checkbox" > Fecha</label>
              <label><input v-model="exportColumns.razon" type="checkbox" > Razón</label>
              <label><input v-model="exportColumns.detalle" type="checkbox" > Detalle</label>
              <label><input v-model="exportColumns.importe" type="checkbox" > Importe</label>
              <label><input v-model="exportColumns.estado" type="checkbox" > Estado</label>
              <label><input v-model="exportColumns.notas" type="checkbox" > Notas</label>
            </div>
          </div>

          <button class="btn btn-primary btn-lg" :disabled="loading" @click="exportBalance">
            {{ exportFormat === 'pdf' ? '🖨️ Generar PDF' : '📥 Descargar Excel' }}
          </button>
        </div>

        <!-- Section 3: Export Summary -->
        <div class="export-section">
          <h3>3. Exportar Resumen</h3>
          <p class="section-desc">Genera un resumen financiero con totales y desgloses</p>

          <div class="option-group">
            <label class="option-label">Incluir en el resumen:</label>
            <div class="checkbox-group">
              <label
                ><input v-model="resumenOptions.totales" type="checkbox" > Totales
                (Ingresos/Gastos/Balance)</label
              >
              <label
                ><input v-model="resumenOptions.desglose" type="checkbox" > Desglose por
                Razón</label
              >
              <label
                ><input v-model="resumenOptions.mensual" type="checkbox" > Desglose Mensual</label
              >
            </div>
          </div>

          <button class="btn btn-secondary btn-lg" :disabled="loading" @click="exportResumen">
            {{ exportFormat === 'pdf' ? '🖨️ Generar Resumen PDF' : '📥 Descargar Resumen Excel' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.utilidades-page {
  max-width: 1000px;
  margin: 0 auto;
}

/* Header */
.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0 0 4px;
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Tools Grid */
.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.tool-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.tool-card:hover:not(.disabled) {
  border-color: #23424a;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.tool-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}

.tool-card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tool-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.tool-info h3 {
  margin: 0 0 4px;
  font-size: 1rem;
}

.tool-info p {
  margin: 0;
  color: #6b7280;
  font-size: 0.8rem;
}

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

/* ============ INVOICE FORM ============ */
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

/* Preview Summary */
.preview-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 16px 20px;
  background: #f3f4f6;
  border-bottom: 1px solid #e5e7eb;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.summary-item .label {
  font-size: 0.7rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 500;
}

.summary-item .value {
  font-size: 1rem;
  font-weight: 600;
}

.summary-item.positive .value {
  color: #16a34a;
}

.summary-item.negative .value {
  color: #dc2626;
}

/* Export Sections */
.export-sections {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.export-section {
  padding-bottom: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.export-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.export-section h3 {
  margin: 0 0 8px;
  font-size: 1rem;
  color: #374151;
}

.section-desc {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 0.85rem;
}

/* Filter Row */
.filter-row {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.select-input {
  padding: 10px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9rem;
  min-width: 160px;
}

/* Option Groups */
.option-group {
  margin-bottom: 16px;
}

.option-label {
  display: block;
  font-size: 0.8rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
}

.radio-group,
.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-group.horizontal {
  flex-direction: row;
  gap: 20px;
}

.radio-group label,
.checkbox-group label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  color: #374151;
}

.radio-group input,
.checkbox-group input {
  margin: 0;
}

.checkbox-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 8px;
}

.checkbox-grid label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  cursor: pointer;
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

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 768px) {
  .tools-grid {
    grid-template-columns: 1fr;
  }

  .preview-summary {
    gap: 12px;
  }

  .summary-item {
    flex: 1;
    min-width: 80px;
  }

  .radio-group.horizontal {
    flex-direction: column;
    gap: 8px;
  }

  .checkbox-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .filter-row {
    flex-direction: column;
  }

  .select-input {
    width: 100%;
  }

  /* Invoice form mobile */
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

  /* Contract form mobile */
  .radio-group-inline {
    flex-direction: column;
  }

  .radio-card {
    min-width: 100%;
  }

  .purchase-options {
    padding: 12px;
  }
}

/* ============ CONTRACT FORM ============ */
.contract-form {
  padding: 20px;
}

.radio-group-inline {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.radio-group-inline.compact {
  gap: 16px;
}

.radio-group-inline.compact label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 0.9rem;
}

.radio-group-inline.compact label.active {
  color: #23424a;
  font-weight: 500;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex: 1;
  min-width: 180px;
}

.radio-card:hover {
  border-color: #23424a;
}

.radio-card.active {
  border-color: #23424a;
  background: #f0f9ff;
}

.radio-card input {
  display: none;
}

.radio-icon {
  font-size: 1.5rem;
}

.radio-label {
  font-weight: 500;
  font-size: 0.95rem;
}

.option-toggle {
  margin: 16px 0;
}

.option-toggle label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  color: #374151;
}

.option-toggle input {
  width: 18px;
  height: 18px;
}

.purchase-options {
  background: #f9fafb;
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
}
</style>
