<script setup lang="ts">
/**
 * Dealer Contract Generator Page
 * Adapted from admin/utilidades.vue contract generator.
 * Supports arrendamiento (rental) and compraventa (sale) contracts.
 * Plan gate: basic+ required. Free users see upgrade prompt.
 */
definePageMeta({
  layout: 'default',
  middleware: ['auth', 'dealer'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()
const { dealerProfile, loadDealer } = useDealerDashboard()
const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

// ---------------------------------------------------------------------------
// Plan Gate
// ---------------------------------------------------------------------------

const hasAccess = computed(() => {
  return (
    currentPlan.value === 'basic' ||
    currentPlan.value === 'premium' ||
    currentPlan.value === 'founding'
  )
})

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ContractType = 'arrendamiento' | 'compraventa'
type ClientType = 'persona' | 'empresa'
type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'cancelled'
type ActiveTab = 'nuevo' | 'historial'

interface VehicleOption {
  id: string
  label: string
  plate: string
  vehicleType: string
}

interface ContractRow {
  id: string
  dealer_id: string
  contract_type: string
  contract_date: string
  vehicle_id: string | null
  vehicle_plate: string | null
  vehicle_type: string | null
  client_name: string
  client_doc_number: string | null
  client_address: string | null
  terms: Record<string, unknown>
  pdf_url: string | null
  status: string
  created_at: string | null
  updated_at: string | null
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const activeTab = ref<ActiveTab>('nuevo')
const loading = ref(true)
const saving = ref(false)
const saveError = ref<string | null>(null)
const saveSuccess = ref(false)

// Contract type
const contractType = ref<ContractType>('arrendamiento')
const contractDate = ref(new Date().toISOString().split('T')[0])
const contractLocation = ref('')

// Lessor / Seller data (pre-filled from dealer profile)
const lessorRepresentative = ref('')
const lessorRepresentativeNIF = ref('')
const lessorCompany = ref('')
const lessorCIF = ref('')
const lessorAddress = ref('')

// Lessee / Buyer data
const clientType = ref<ClientType>('persona')
const clientName = ref('')
const clientNIF = ref('')
const clientCompany = ref('')
const clientCIF = ref('')
const clientRepresentative = ref('')
const clientRepresentativeNIF = ref('')
const clientAddress = ref('')

// Vehicle
const contractVehicle = ref('')
const contractVehicleType = ref('vehiculo')
const contractVehiclePlate = ref('')
const contractVehicleResidualValue = ref(13000)

// Rental terms
const contractMonthlyRent = ref(1200)
const contractDeposit = ref(2400)
const contractDuration = ref(8)
const contractDurationUnit = ref<'meses' | 'anos'>('meses')
const contractPaymentDays = ref(10)

// Purchase option
const contractHasPurchaseOption = ref(true)
const contractPurchasePrice = ref(10000)
const contractPurchaseNotice = ref(14)
const contractRentMonthsToDiscount = ref(3)

// Sale terms
const contractSalePrice = ref(0)
const contractSalePaymentMethod = ref('Transferencia bancaria')
const contractSaleDeliveryConditions = ref('')
const contractSaleWarranty = ref('')

// Jurisdiction
const contractJurisdiction = ref('')

// Vehicle options
const vehicleOptions = ref<VehicleOption[]>([])
const loadingVehicles = ref(false)

// History
const contracts = ref<ContractRow[]>([])
const loadingHistory = ref(false)
const historyError = ref<string | null>(null)

// ---------------------------------------------------------------------------
// Vehicle loading
// ---------------------------------------------------------------------------

async function loadVehicleOptions(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingVehicles.value = true
  try {
    const { data } = (await supabase
      .from('vehicles')
      .select('id, brand, model, plate, year, subcategory_id')
      .eq('dealer_id', dealer.id)
      .order('brand')) as never as {
      data:
        | {
            id: string
            brand: string
            model: string
            plate: string
            year: number
            subcategory_id: string
          }[]
        | null
    }

    if (data) {
      vehicleOptions.value = data.map((v) => {
        const labelLower = `${v.brand || ''} ${v.model || ''}`.toLowerCase()
        let detectedType = 'vehiculo'
        if (labelLower.includes('cisterna')) detectedType = 'semirremolque cisterna'
        else if (labelLower.includes('semirremolque') || labelLower.includes('semi'))
          detectedType = 'semirremolque'
        else if (labelLower.includes('trailer')) detectedType = 'trailer'
        else if (labelLower.includes('tractora') || labelLower.includes('cabeza'))
          detectedType = 'cabeza tractora'
        else if (labelLower.includes('camion') || labelLower.includes('camión'))
          detectedType = 'camion'
        else if (labelLower.includes('furgon') || labelLower.includes('furgón'))
          detectedType = 'furgon'

        return {
          id: v.id,
          label: `${v.brand || ''} ${v.model || ''} (${v.plate || ''}) - ${v.year || ''}`.trim(),
          plate: v.plate || '',
          vehicleType: detectedType,
        }
      })
    }
  } finally {
    loadingVehicles.value = false
  }
}

function onContractVehicleSelected(): void {
  const vehicleId = contractVehicle.value
  if (!vehicleId) return

  const vehicle = vehicleOptions.value.find((v) => v.id === vehicleId)
  if (vehicle) {
    contractVehiclePlate.value = vehicle.plate
    contractVehicleType.value = vehicle.vehicleType
  }
}

// ---------------------------------------------------------------------------
// Pre-fill from dealer profile
// ---------------------------------------------------------------------------

function prefillFromDealer(): void {
  const dealer = dealerProfile.value
  if (!dealer) return

  // The raw data from select('*') contains all columns
  const raw = dealer as Record<string, unknown>

  lessorCompany.value =
    typeof raw.legal_name === 'string' && raw.legal_name
      ? raw.legal_name
      : typeof raw.company_name === 'string'
        ? raw.company_name
        : raw.company_name &&
            typeof raw.company_name === 'object' &&
            'es' in (raw.company_name as Record<string, string>)
          ? (raw.company_name as Record<string, string>).es
          : ''

  lessorCIF.value = typeof raw.cif_nif === 'string' ? raw.cif_nif : ''

  // Location data
  if (raw.location_data && typeof raw.location_data === 'object') {
    const loc = raw.location_data as Record<string, string>
    lessorAddress.value = loc.es || loc.en || ''
    if (!contractLocation.value) {
      contractLocation.value = loc.es || loc.en || ''
    }
    if (!contractJurisdiction.value) {
      contractJurisdiction.value = loc.es || loc.en || ''
    }
  } else if (typeof raw.location === 'string') {
    lessorAddress.value = raw.location
    if (!contractLocation.value) contractLocation.value = raw.location
    if (!contractJurisdiction.value) contractJurisdiction.value = raw.location
  }
}

// ---------------------------------------------------------------------------
// Number to words (Spanish)
// ---------------------------------------------------------------------------

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
    const tIdx = Math.floor(n / 10)
    const u = n % 10
    if (tIdx === 2 && u > 0) return `VEINTI${units[u]}`
    return u > 0 ? `${tens[tIdx]} Y ${units[u]}` : tens[tIdx]
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
  return n.toLocaleString('es-ES')
}

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

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

function formatDateShort(dateStr: string | null): string {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// Generate Rental Contract HTML
// ---------------------------------------------------------------------------

function generateRentalContract(): string {
  const date = formatDateSpanish(contractDate.value)
  const monthlyRentWords = numberToWords(contractMonthlyRent.value)
  const depositWords = numberToWords(contractDeposit.value)
  const durationWords = numberToWords(contractDuration.value)
  const residualWords = numberToWords(contractVehicleResidualValue.value)
  const purchasePriceWords = numberToWords(contractPurchasePrice.value)
  const noticeWords = numberToWords(contractPurchaseNotice.value)
  const rentMonthsWords = numberToWords(contractRentMonthsToDiscount.value)
  const durationUnitLabel = contractDurationUnit.value === 'meses' ? 'MESES' : 'ANOS'

  let lesseeSection = ''
  if (clientType.value === 'persona') {
    lesseeSection = `De otra parte D. ${clientName.value.toUpperCase()}, mayor de edad, con NIF ${clientNIF.value}, con domicilio en ${clientAddress.value}, en adelante arrendatario.`
  } else {
    lesseeSection = `De otra parte D. ${clientRepresentative.value}, mayor de edad, con NIF ${clientRepresentativeNIF.value}, en nombre y representacion de la mercantil ${clientCompany.value.toUpperCase()}, con CIF ${clientCIF.value}, con domicilio en ${clientAddress.value}, en adelante arrendatario.`
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

  <p class="section">De una parte D. ${lessorRepresentative.value}, mayor de edad, con DNI ${lessorRepresentativeNIF.value}, en nombre y representacion de la mercantil ${lessorCompany.value.toUpperCase()}, con el CIF ${lessorCIF.value}, con domicilio en ${lessorAddress.value} (en adelante arrendador).</p>

  <p class="section">${lesseeSection}</p>

  <p class="section">Las partes, reconociendose capacidad suficiente para celebrar el presente contrato de arrendamiento de ${contractVehicleType.value},</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el arrendador es propietario de ${contractVehicleType.value} matricula ${contractVehiclePlate.value}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el arrendatario esta interesado en arrendar dicho vehiculo para su explotacion.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  En virtud del presente contrato el arrendador cede el ${contractVehicleType.value} en arrendamiento al arrendatario y este la toma en arrendamiento para su explotacion como transportista por su cuenta y riesgo para las operaciones de transporte, carga y descarga durante todo el periodo que dure el presente contrato.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- UTILIZACION DEL VEHICULO</span><br>
  La utilizacion del vehiculo por el arrendatario respetara en todo momento la vigente normativa, y en especial, la legislacion en materia de transporte y trafico, la legislacion sobre proteccion y conservacion del medio ambiente y las normas sobre Seguridad e Higiene en el Trabajo.</p>

  <p class="clause"><span class="clause-title">TERCERA.- CESION DEL VEHICULO</span><br>
  Queda terminantemente prohibida toda cesion del vehiculo a terceros por parte del arrendatario, en cualquier forma o modalidad, bien sea a titulo oneroso o gratuito, sin la previa autorizacion por escrito del arrendador.</p>

  <p class="clause"><span class="clause-title">CUARTA.- ALTERACIONES EN EL VEHICULO</span><br>
  El arrendatario no podra llevar a cabo, por si mismo o a traves de terceros, alteracion o modificacion alguna en la naturaleza, condiciones o prestaciones del ${contractVehicleType.value} que suponga o permita un uso distinto para el que es cedido en arrendamiento.</p>

  <p class="clause"><span class="clause-title">QUINTA.- MANTENIMIENTO Y REPARACIONES DEL VEHICULO</span><br>
  El arrendador asume el desgaste mecanico normal del vehiculo teniendo en cuenta el uso para el que se destina por parte del arrendatario. Los gastos de mantenimiento, reparacion de averias sufridas por el vehiculo y cambio de ruedas durante el tiempo de arrendamiento son de cargo del arrendatario.<br><br>
  El arrendatario debera informar al arrendador de cualquier incidencia que afecte al normal uso del vehiculo en un plazo no superior a 7 dias desde que se produzca dicha incidencia.<br><br>
  El arrendador facilitara el vehiculo con la ITV pasada, significando esto que todos sus componentes son aptos para el correcto funcionamiento del mismo. Cualquier renovacion que requiriese el vehiculo durante el periodo de arrendamiento sera gestionado por el arrendatario.</p>

  <p class="clause"><span class="clause-title">SEXTA.- DESPERFECTOS Y DANOS POR MAL USO</span><br>
  El arrendatario respondera integramente de los desperfectos que el vehiculo sufra, excepto de los danos cuya reparacion sea superior al valor residual del vehiculo, el cual las partes fijan en ${residualWords} (${contractVehicleResidualValue.value.toLocaleString('es-ES')} EUR).<br><br>
  En caso de discrepancia sobre el importe y valoracion de los danos, el arrendador designara un perito para que haga una valoracion de los mismos.</p>

  <p class="clause"><span class="clause-title">SEPTIMA.- INSPECCION DEL VEHICULO</span><br>
  El Arrendador podra inspeccionar la instalacion, conservacion y utilizacion del vehiculo en cualquier momento, dentro del horario laboral del Arrendatario, el cual garantizara a los representantes del Arrendador el acceso al vehiculo para su inspeccion.</p>

  <p class="clause"><span class="clause-title">OCTAVA.- POLIZA DE SEGURO</span><br>
  El arrendador entrega el vehiculo con seguro de circulacion basico siendo por cuenta del arrendatario asegurar la carga y la responsabilidad civil de la misma.</p>

  <p class="clause"><span class="clause-title">NOVENA.- PRECIO Y FIANZA</span><br>
  El arrendador percibira del arrendatario la cantidad de ${monthlyRentWords} (${contractMonthlyRent.value.toLocaleString('es-ES')} EUR) MENSUALES MAS EL IVA.<br><br>
  Dicho precio se hara efectivo dentro de los ${contractPaymentDays.value} dias naturales siguientes a la emision por parte del arrendador de la correspondiente factura.<br><br>
  Se establece una fianza de ${depositWords} EUROS (${contractDeposit.value.toLocaleString('es-ES')} EUR) pagadera junto con la primera mensualidad y tambien por anticipado.</p>

  <p class="clause"><span class="clause-title">DECIMA.- DURACION</span><br>
  El presente contrato entrara en vigor en la fecha indicada en el encabezamiento y tendra una duracion de ${durationWords} (${contractDuration.value}) ${durationUnitLabel} pudiendose prorrogar al final del vencimiento, mes a mes por acuerdo expreso de las partes.</p>

  <p class="clause"><span class="clause-title">UNDECIMA.- VENCIMIENTO ANTICIPADO</span><br>
  El presente contrato quedara resuelto automaticamente a instancia de la parte no incursa en causa de resolucion y sin necesidad de preaviso alguno, cuando concurra cualquiera de las siguientes circunstancias:</p>
  <ul>
    <li>Incumplimiento, total o parcial, de cualesquiera de las clausulas establecidas en el contrato.</li>
    <li>Por destruccion o menoscabo del vehiculo que haga inviable su uso.</li>
    <li>Por estar inmerso cualquiera de las partes en los supuestos de insolvencia o concurso de acreedores.</li>
  </ul>
  <p class="clause">En tales casos, el Contrato se entendera resuelto a la recepcion de la notificacion escrita. El arrendador tendra derecho a recuperar el vehiculo de forma inmediata.</p>

  <p class="clause"><span class="clause-title">DUODECIMA.- PROPIEDAD DEL VEHICULO</span><br>
  El vehiculo es siempre, y en todo momento, propiedad exclusiva del arrendador, y consiguientemente, el arrendatario se obliga a adoptar cuantas medidas sean necesarias para proclamar, respetar y hacer respetar a terceros el derecho de propiedad.</p>

  <p class="clause"><span class="clause-title">DECIMOTERCERA.- GASTOS E IMPUESTOS</span><br>
  Todos cuantos gastos e impuestos se originen con motivo del presente Contrato seran sufragados por las partes conforme a lo dispuesto en la Ley.</p>

  <p class="clause"><span class="clause-title">DECIMOCUARTA.- LEY APLICABLE Y JURISDICCION</span><br>
  El presente Contrato se regira por la legislacion espanola.<br><br>
  Para la solucion de cualquier cuestion litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${contractJurisdiction.value} renunciando expresamente al fuero de los que por cualquier motivo pudiera corresponderles.</p>`

  if (contractHasPurchaseOption.value) {
    contract += `
  <p class="clause"><span class="clause-title">DECIMOQUINTA.- OPCION DE COMPRA Y APLICACION DE RENTAS</span><br>
  <strong>1. Concesion de la opcion.</strong><br>
  El Arrendador concede al Arrendatario una opcion de compra sobre el bien objeto del presente contrato (${contractVehicleType.value} matricula ${contractVehiclePlate.value}). La opcion podra ejercitarse durante la vigencia del arrendamiento mediante notificacion escrita al Arrendador con una antelacion minima de ${noticeWords} (${contractPurchaseNotice.value}) dias.<br><br>
  <strong>2. Precio de ejercicio.</strong><br>
  El precio de compraventa se fija en ${purchasePriceWords} EUR (${contractPurchasePrice.value.toLocaleString('es-ES')} EUR), impuestos no incluidos, salvo modificacion pactada por escrito entre las partes.<br><br>
  <strong>3. Imputacion de rentas al precio de compraventa.</strong><br>
  En caso de ejercitarse la opcion de compra, unicamente se descontara del precio de compraventa el importe correspondiente a las ${rentMonthsWords} (${contractRentMonthsToDiscount.value}) ultimas mensualidades de renta efectivamente pagadas por el Arrendatario inmediatamente anteriores a la fecha de ejercicio de la opcion.<br>
  Ninguna otra renta, fianza ni cantidad abonada por el Arrendatario sera objeto de deduccion, salvo pacto expreso y por escrito.<br><br>
  <strong>4. Formalizacion de la compraventa.</strong><br>
  Ejercida la opcion, las partes suscribiran la documentacion de transmision en un plazo maximo de ${noticeWords} (${contractPurchaseNotice.value}) dias desde la notificacion. Los gastos, tasas e impuestos derivados de la transmision seran asumidos por la parte legalmente obligada.</p>`
  }

  // Signatures
  const lesseeSignatureName =
    clientType.value === 'persona'
      ? clientName.value.toUpperCase()
      : `${clientCompany.value.toUpperCase()}<br>D. ${clientRepresentative.value}`

  const lesseeSignatureDoc =
    clientType.value === 'persona' ? `NIF: ${clientNIF.value}` : `CIF: ${clientCIF.value}`

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

// ---------------------------------------------------------------------------
// Generate Sale Contract HTML
// ---------------------------------------------------------------------------

function generateSaleContract(): string {
  const date = formatDateSpanish(contractDate.value)
  const salePriceWords = numberToWords(contractSalePrice.value)

  let buyerSection = ''
  if (clientType.value === 'persona') {
    buyerSection = `De otra parte D. ${clientName.value.toUpperCase()}, mayor de edad, con NIF ${clientNIF.value}, con domicilio en ${clientAddress.value}, en adelante comprador.`
  } else {
    buyerSection = `De otra parte D. ${clientRepresentative.value}, mayor de edad, con NIF ${clientRepresentativeNIF.value}, en nombre y representacion de la mercantil ${clientCompany.value.toUpperCase()}, con CIF ${clientCIF.value}, con domicilio en ${clientAddress.value}, en adelante comprador.`
  }

  const buyerSignatureName =
    clientType.value === 'persona'
      ? clientName.value.toUpperCase()
      : `${clientCompany.value.toUpperCase()}<br>D. ${clientRepresentative.value}`

  const buyerSignatureDoc =
    clientType.value === 'persona' ? `NIF: ${clientNIF.value}` : `CIF: ${clientCIF.value}`

  const deliveryText =
    contractSaleDeliveryConditions.value ||
    'El vendedor se compromete a entregar el vehiculo al comprador en el estado en que se encuentra, el cual ha sido examinado y aceptado por el comprador.'

  const warrantyText =
    contractSaleWarranty.value ||
    'El vendedor garantiza que el vehiculo se encuentra en buen estado de funcionamiento y libre de vicios ocultos. En caso de que se manifestaran defectos ocultos, el comprador tendra derecho a la reparacion o resolucion del contrato conforme a la legislacion vigente.'

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

  <p class="section">De una parte D. ${lessorRepresentative.value}, mayor de edad, con DNI ${lessorRepresentativeNIF.value}, en nombre y representacion de la mercantil ${lessorCompany.value.toUpperCase()}, con el CIF ${lessorCIF.value}, con domicilio en ${lessorAddress.value} (en adelante vendedor).</p>

  <p class="section">${buyerSection}</p>

  <p class="section">Las partes, reconociendose capacidad suficiente para celebrar el presente contrato de compraventa,</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el vendedor es propietario de ${contractVehicleType.value} matricula ${contractVehiclePlate.value}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el comprador esta interesado en adquirir dicho vehiculo y el vendedor en transmitirlo.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  El vendedor vende y transmite al comprador, que acepta y adquiere, el ${contractVehicleType.value} con matricula ${contractVehiclePlate.value}, libre de cargas y gravamenes.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- PRECIO</span><br>
  El precio de la compraventa se fija en ${salePriceWords} EUROS (${contractSalePrice.value.toLocaleString('es-ES')} EUR) mas el IVA correspondiente.</p>

  <p class="clause"><span class="clause-title">TERCERA.- FORMA DE PAGO</span><br>
  El pago se realizara mediante ${contractSalePaymentMethod.value} en el momento de la firma del presente contrato.</p>

  <p class="clause"><span class="clause-title">CUARTA.- ENTREGA</span><br>
  ${deliveryText}</p>

  <p class="clause"><span class="clause-title">QUINTA.- DOCUMENTACION</span><br>
  El vendedor entregara al comprador toda la documentacion necesaria para la circulacion del vehiculo y el cambio de titularidad, incluyendo ficha tecnica, permiso de circulacion e informe de la DGT.</p>

  <p class="clause"><span class="clause-title">SEXTA.- GARANTIA</span><br>
  ${warrantyText}</p>

  <p class="clause"><span class="clause-title">SEPTIMA.- GASTOS E IMPUESTOS</span><br>
  Los gastos e impuestos derivados de la transmision seran asumidos por la parte legalmente obligada. El Impuesto de Transmisiones Patrimoniales sera por cuenta del comprador.</p>

  <p class="clause"><span class="clause-title">OCTAVA.- LEY APLICABLE Y JURISDICCION</span><br>
  El presente Contrato se regira por la legislacion espanola.<br><br>
  Para la solucion de cualquier cuestion litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${contractJurisdiction.value}.</p>

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

// ---------------------------------------------------------------------------
// Print HTML
// ---------------------------------------------------------------------------

function printHTML(html: string): void {
  const existingFrame = document.getElementById('print-frame')
  if (existingFrame) {
    existingFrame.remove()
  }

  const iframe = document.createElement('iframe')
  iframe.id = 'print-frame'
  iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:0;height:0;border:none;'
  document.body.appendChild(iframe)

  const doc = iframe.contentDocument || iframe.contentWindow?.document
  if (!doc) return

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

// ---------------------------------------------------------------------------
// Generate contract and save to DB
// ---------------------------------------------------------------------------

async function generateContract(): Promise<void> {
  const html =
    contractType.value === 'arrendamiento' ? generateRentalContract() : generateSaleContract()

  // Print
  printHTML(html)

  // Save to DB
  const dealer = dealerProfile.value
  if (!dealer) return

  saving.value = true
  saveError.value = null
  saveSuccess.value = false

  try {
    const clientDisplayName =
      clientType.value === 'persona' ? clientName.value : clientCompany.value

    const clientDocNum = clientType.value === 'persona' ? clientNIF.value : clientCIF.value

    const terms: Record<string, unknown> = {
      clientType: clientType.value,
      lessorRepresentative: lessorRepresentative.value,
      lessorCompany: lessorCompany.value,
      lessorCIF: lessorCIF.value,
      lessorAddress: lessorAddress.value,
      jurisdiction: contractJurisdiction.value,
      location: contractLocation.value,
    }

    if (contractType.value === 'arrendamiento') {
      terms.monthlyRent = contractMonthlyRent.value
      terms.deposit = contractDeposit.value
      terms.duration = contractDuration.value
      terms.durationUnit = contractDurationUnit.value
      terms.paymentDays = contractPaymentDays.value
      terms.residualValue = contractVehicleResidualValue.value
      terms.hasPurchaseOption = contractHasPurchaseOption.value
      if (contractHasPurchaseOption.value) {
        terms.purchasePrice = contractPurchasePrice.value
        terms.purchaseNotice = contractPurchaseNotice.value
        terms.rentMonthsToDiscount = contractRentMonthsToDiscount.value
      }
    } else {
      terms.salePrice = contractSalePrice.value
      terms.paymentMethod = contractSalePaymentMethod.value
      terms.deliveryConditions = contractSaleDeliveryConditions.value
      terms.warranty = contractSaleWarranty.value
    }

    if (clientType.value === 'empresa') {
      terms.clientRepresentative = clientRepresentative.value
      terms.clientRepresentativeNIF = clientRepresentativeNIF.value
      terms.clientCompany = clientCompany.value
      terms.clientCIF = clientCIF.value
    }

    const insertData = {
      dealer_id: dealer.id,
      contract_type: contractType.value,
      contract_date: contractDate.value,
      vehicle_id: contractVehicle.value || null,
      vehicle_plate: contractVehiclePlate.value || null,
      vehicle_type: contractVehicleType.value || null,
      client_name: clientDisplayName,
      client_doc_number: clientDocNum || null,
      client_address: clientAddress.value || null,
      terms,
      status: 'draft' as const,
    }

    const { error: err } = (await supabase
      .from('dealer_contracts')
      .insert(insertData)) as never as { error: { message: string } | null }

    if (err) throw new Error(err.message)

    saveSuccess.value = true
    setTimeout(() => {
      saveSuccess.value = false
    }, 4000)

    // Refresh history
    await loadContractHistory()
  } catch (err: unknown) {
    saveError.value = err instanceof Error ? err.message : t('dashboard.tools.contract.saveError')
  } finally {
    saving.value = false
  }
}

// ---------------------------------------------------------------------------
// Contract History
// ---------------------------------------------------------------------------

async function loadContractHistory(): Promise<void> {
  const dealer = dealerProfile.value
  if (!dealer) return

  loadingHistory.value = true
  historyError.value = null

  try {
    const { data, error: err } = (await supabase
      .from('dealer_contracts')
      .select('*')
      .eq('dealer_id', dealer.id)
      .order('created_at', { ascending: false })) as never as {
      data: ContractRow[] | null
      error: { message: string } | null
    }

    if (err) throw new Error(err.message)
    contracts.value = data ?? []
  } catch (err: unknown) {
    historyError.value =
      err instanceof Error ? err.message : t('dashboard.tools.contract.historyError')
  } finally {
    loadingHistory.value = false
  }
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    draft: t('dashboard.tools.contract.statusDraft'),
    signed: t('dashboard.tools.contract.statusSigned'),
    active: t('dashboard.tools.contract.statusActive'),
    expired: t('dashboard.tools.contract.statusExpired'),
    cancelled: t('dashboard.tools.contract.statusCancelled'),
  }
  return labels[status] || status
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: '#6b7280',
    signed: '#3b82f6',
    active: '#22c55e',
    expired: '#f59e0b',
    cancelled: '#ef4444',
  }
  return colors[status] || '#6b7280'
}

function getContractTypeLabel(type: string): string {
  return type === 'arrendamiento'
    ? t('dashboard.tools.contract.typeRental')
    : t('dashboard.tools.contract.typeSale')
}

async function updateContractStatus(contractId: string, newStatus: ContractStatus): Promise<void> {
  try {
    const { error: err } = (await supabase
      .from('dealer_contracts')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', contractId)) as never as { error: { message: string } | null }

    if (err) throw new Error(err.message)
    await loadContractHistory()
  } catch (err: unknown) {
    historyError.value = err instanceof Error ? err.message : 'Error updating status'
  }
}

// ---------------------------------------------------------------------------
// Reset form
// ---------------------------------------------------------------------------

function resetForm(): void {
  contractType.value = 'arrendamiento'
  contractDate.value = new Date().toISOString().split('T')[0]
  contractVehicle.value = ''
  contractVehiclePlate.value = ''
  contractVehicleType.value = 'vehiculo'
  clientType.value = 'persona'
  clientName.value = ''
  clientNIF.value = ''
  clientCompany.value = ''
  clientCIF.value = ''
  clientRepresentative.value = ''
  clientRepresentativeNIF.value = ''
  clientAddress.value = ''
  contractMonthlyRent.value = 1200
  contractDeposit.value = 2400
  contractDuration.value = 8
  contractDurationUnit.value = 'meses'
  contractPaymentDays.value = 10
  contractHasPurchaseOption.value = true
  contractPurchasePrice.value = 10000
  contractPurchaseNotice.value = 14
  contractRentMonthsToDiscount.value = 3
  contractSalePrice.value = 0
  contractSalePaymentMethod.value = 'Transferencia bancaria'
  contractSaleDeliveryConditions.value = ''
  contractSaleWarranty.value = ''
  contractVehicleResidualValue.value = 13000
  saveError.value = null
  saveSuccess.value = false
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

async function init(): Promise<void> {
  loading.value = true
  const dealer = dealerProfile.value || (await loadDealer())
  await fetchSubscription()

  if (dealer && hasAccess.value) {
    prefillFromDealer()
    await Promise.all([loadVehicleOptions(), loadContractHistory()])
  }
  loading.value = false
}

onMounted(init)
</script>

<template>
  <div class="contract-page">
    <!-- Plan Gate: Upgrade prompt for free users -->
    <template v-if="!loading && !hasAccess">
      <header class="page-header">
        <h1>{{ t('dashboard.tools.contract.title') }}</h1>
        <span class="plan-badge">{{ t(`dashboard.plans.${currentPlan}`) }}</span>
      </header>
      <div class="upgrade-card">
        <div class="upgrade-icon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        </div>
        <h2>{{ t('dashboard.tools.contract.upgradeTitle') }}</h2>
        <p>{{ t('dashboard.tools.contract.upgradeDesc') }}</p>
        <NuxtLink to="/dashboard/suscripcion" class="btn btn-primary btn-lg">
          {{ t('dashboard.tools.contract.upgradeCTA') }}
        </NuxtLink>
      </div>
    </template>

    <!-- Loading -->
    <template v-else-if="loading">
      <div class="loading-state">
        <div class="spinner" />
        <p>{{ t('dashboard.tools.contract.loading') }}</p>
      </div>
    </template>

    <!-- Main content -->
    <template v-else>
      <header class="page-header">
        <div class="header-left">
          <h1>{{ t('dashboard.tools.contract.title') }}</h1>
          <p class="subtitle">{{ t('dashboard.tools.contract.subtitle') }}</p>
        </div>
      </header>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab" :class="{ active: activeTab === 'nuevo' }" @click="activeTab = 'nuevo'">
          {{ t('dashboard.tools.contract.tabNew') }}
        </button>
        <button
          class="tab"
          :class="{ active: activeTab === 'historial' }"
          @click="
            activeTab = 'historial'
            loadContractHistory()
          "
        >
          {{ t('dashboard.tools.contract.tabHistory') }}
          <span v-if="contracts.length" class="tab-count">{{ contracts.length }}</span>
        </button>
      </div>

      <!-- ==================== NEW CONTRACT ==================== -->
      <div v-if="activeTab === 'nuevo'" class="tool-content">
        <div class="tool-header">
          <h2>{{ t('dashboard.tools.contract.newContract') }}</h2>
          <button class="btn btn-secondary btn-sm" @click="resetForm">
            {{ t('dashboard.tools.contract.reset') }}
          </button>
        </div>

        <div class="contract-form">
          <!-- Contract Type Selector -->
          <div class="form-row">
            <div class="form-group" style="flex: 2">
              <label>{{ t('dashboard.tools.contract.contractType') }}</label>
              <div class="radio-group-inline">
                <label class="radio-card" :class="{ active: contractType === 'arrendamiento' }">
                  <input v-model="contractType" type="radio" value="arrendamiento" />
                  <span class="radio-icon-svg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <polyline points="17 1 21 5 17 9" />
                      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                      <polyline points="7 23 3 19 7 15" />
                      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                    </svg>
                  </span>
                  <span class="radio-label">{{ t('dashboard.tools.contract.typeRental') }}</span>
                </label>
                <label class="radio-card" :class="{ active: contractType === 'compraventa' }">
                  <input v-model="contractType" type="radio" value="compraventa" />
                  <span class="radio-icon-svg">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <line x1="12" y1="1" x2="12" y2="23" />
                      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </span>
                  <span class="radio-label">{{ t('dashboard.tools.contract.typeSale') }}</span>
                </label>
              </div>
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.date') }}</label>
              <input v-model="contractDate" type="date" />
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.location') }}</label>
              <input v-model="contractLocation" type="text" />
            </div>
          </div>

          <!-- Vehicle Selection -->
          <div class="form-row">
            <div class="form-group" style="flex: 2">
              <label>{{ t('dashboard.tools.contract.vehicle') }}</label>
              <select
                v-model="contractVehicle"
                :disabled="loadingVehicles"
                @change="onContractVehicleSelected"
              >
                <option value="">{{ t('dashboard.tools.contract.selectVehicle') }}</option>
                <option v-for="veh in vehicleOptions" :key="veh.id" :value="veh.id">
                  {{ veh.label }}
                </option>
              </select>
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.vehicleType') }}</label>
              <input v-model="contractVehicleType" type="text" />
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.plate') }}</label>
              <input v-model="contractVehiclePlate" type="text" />
            </div>
          </div>

          <hr class="divider" />

          <!-- Lessor / Seller Data -->
          <details class="company-details" open>
            <summary>
              {{
                contractType === 'arrendamiento'
                  ? t('dashboard.tools.contract.lessorData')
                  : t('dashboard.tools.contract.sellerData')
              }}
            </summary>
            <div class="form-grid-3">
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.company') }}</label>
                <input v-model="lessorCompany" type="text" />
              </div>
              <div class="form-group">
                <label>CIF</label>
                <input v-model="lessorCIF" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.address') }}</label>
                <input v-model="lessorAddress" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.representative') }}</label>
                <input v-model="lessorRepresentative" type="text" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.representativeNIF') }}</label>
                <input v-model="lessorRepresentativeNIF" type="text" />
              </div>
            </div>
          </details>

          <hr class="divider" />

          <!-- Client / Buyer Data -->
          <h4 class="section-subtitle">
            {{
              contractType === 'arrendamiento'
                ? t('dashboard.tools.contract.lesseeData')
                : t('dashboard.tools.contract.buyerData')
            }}
          </h4>

          <div class="form-row">
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.clientTypeLabel') }}</label>
              <div class="radio-group-inline compact">
                <label :class="{ active: clientType === 'persona' }">
                  <input v-model="clientType" type="radio" value="persona" />
                  {{ t('dashboard.tools.contract.clientPerson') }}
                </label>
                <label :class="{ active: clientType === 'empresa' }">
                  <input v-model="clientType" type="radio" value="empresa" />
                  {{ t('dashboard.tools.contract.clientCompany') }}
                </label>
              </div>
            </div>
          </div>

          <!-- Person fields -->
          <div v-if="clientType === 'persona'" class="form-grid-3">
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.fullName') }}</label>
              <input v-model="clientName" type="text" />
            </div>
            <div class="form-group">
              <label>NIF</label>
              <input v-model="clientNIF" type="text" />
            </div>
            <div class="form-group" style="grid-column: 1 / -1">
              <label>{{ t('dashboard.tools.contract.address') }}</label>
              <input v-model="clientAddress" type="text" />
            </div>
          </div>

          <!-- Company fields -->
          <div v-if="clientType === 'empresa'" class="form-grid-3">
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.company') }}</label>
              <input v-model="clientCompany" type="text" />
            </div>
            <div class="form-group">
              <label>CIF</label>
              <input v-model="clientCIF" type="text" />
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.representative') }}</label>
              <input v-model="clientRepresentative" type="text" />
            </div>
            <div class="form-group">
              <label>{{ t('dashboard.tools.contract.representativeNIF') }}</label>
              <input v-model="clientRepresentativeNIF" type="text" />
            </div>
            <div class="form-group" style="grid-column: span 2">
              <label>{{ t('dashboard.tools.contract.address') }}</label>
              <input v-model="clientAddress" type="text" />
            </div>
          </div>

          <hr class="divider" />

          <!-- Rental Terms -->
          <div v-if="contractType === 'arrendamiento'">
            <h4 class="section-subtitle">{{ t('dashboard.tools.contract.rentalTerms') }}</h4>

            <div class="form-grid-3">
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.monthlyRent') }}</label>
                <input v-model.number="contractMonthlyRent" type="number" step="100" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.deposit') }}</label>
                <input v-model.number="contractDeposit" type="number" step="100" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.paymentDays') }}</label>
                <input v-model.number="contractPaymentDays" type="number" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.duration') }}</label>
                <input v-model.number="contractDuration" type="number" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.durationUnit') }}</label>
                <select v-model="contractDurationUnit">
                  <option value="meses">{{ t('dashboard.tools.contract.months') }}</option>
                  <option value="anos">{{ t('dashboard.tools.contract.years') }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.residualValue') }}</label>
                <input v-model.number="contractVehicleResidualValue" type="number" step="1000" />
              </div>
            </div>

            <!-- Purchase Option Toggle -->
            <div class="option-toggle">
              <label>
                <input v-model="contractHasPurchaseOption" type="checkbox" />
                <span>{{ t('dashboard.tools.contract.includePurchaseOption') }}</span>
              </label>
            </div>

            <div v-if="contractHasPurchaseOption" class="form-grid-3 purchase-options">
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.purchasePrice') }}</label>
                <input v-model.number="contractPurchasePrice" type="number" step="1000" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.purchaseNotice') }}</label>
                <input v-model.number="contractPurchaseNotice" type="number" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.rentMonthsDiscount') }}</label>
                <input v-model.number="contractRentMonthsToDiscount" type="number" />
              </div>
            </div>
          </div>

          <!-- Sale Terms -->
          <div v-if="contractType === 'compraventa'">
            <h4 class="section-subtitle">{{ t('dashboard.tools.contract.saleTerms') }}</h4>

            <div class="form-grid-3">
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.salePrice') }}</label>
                <input v-model.number="contractSalePrice" type="number" step="1000" />
              </div>
              <div class="form-group">
                <label>{{ t('dashboard.tools.contract.paymentMethod') }}</label>
                <select v-model="contractSalePaymentMethod">
                  <option>Transferencia bancaria</option>
                  <option>Efectivo</option>
                  <option>Cheque</option>
                  <option>Financiacion</option>
                </select>
              </div>
              <div class="form-group" style="grid-column: 1 / -1">
                <label>{{ t('dashboard.tools.contract.deliveryConditions') }}</label>
                <input
                  v-model="contractSaleDeliveryConditions"
                  type="text"
                  :placeholder="t('dashboard.tools.contract.deliveryPlaceholder')"
                />
              </div>
              <div class="form-group" style="grid-column: 1 / -1">
                <label>{{ t('dashboard.tools.contract.warranty') }}</label>
                <input
                  v-model="contractSaleWarranty"
                  type="text"
                  :placeholder="t('dashboard.tools.contract.warrantyPlaceholder')"
                />
              </div>
            </div>
          </div>

          <hr class="divider" />

          <!-- Jurisdiction -->
          <div class="form-row">
            <div class="form-group" style="max-width: 300px">
              <label>{{ t('dashboard.tools.contract.jurisdiction') }}</label>
              <input v-model="contractJurisdiction" type="text" />
            </div>
          </div>

          <!-- Feedback -->
          <div v-if="saveError" class="alert alert-error">{{ saveError }}</div>
          <div v-if="saveSuccess" class="alert alert-success">
            {{ t('dashboard.tools.contract.saved') }}
          </div>

          <!-- Generate Button -->
          <div class="form-actions">
            <button class="btn btn-primary btn-lg" :disabled="saving" @click="generateContract">
              <svg
                v-if="!saving"
                xmlns="http://www.w3.org/2000/svg"
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
              <span v-if="saving" class="spinner-sm" />
              {{
                saving
                  ? t('dashboard.tools.contract.generating')
                  : t('dashboard.tools.contract.generate')
              }}
            </button>
          </div>
        </div>
      </div>

      <!-- ==================== HISTORY ==================== -->
      <div v-if="activeTab === 'historial'" class="tool-content">
        <div class="tool-header">
          <h2>{{ t('dashboard.tools.contract.historyTitle') }}</h2>
          <span class="history-count"
            >{{ contracts.length }} {{ t('dashboard.tools.contract.contracts') }}</span
          >
        </div>

        <!-- Loading -->
        <div v-if="loadingHistory" class="loading-state compact">
          <div class="spinner" />
        </div>

        <!-- Error -->
        <div v-else-if="historyError" class="alert alert-error" style="margin: 16px">
          {{ historyError }}
        </div>

        <!-- Empty -->
        <div v-else-if="contracts.length === 0" class="empty-state">
          <svg
            xmlns="http://www.w3.org/2000/svg"
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
          <p>{{ t('dashboard.tools.contract.noContracts') }}</p>
          <button class="btn btn-primary" @click="activeTab = 'nuevo'">
            {{ t('dashboard.tools.contract.createFirst') }}
          </button>
        </div>

        <!-- Contract list -->
        <div v-else class="history-list">
          <div v-for="c in contracts" :key="c.id" class="history-card">
            <div class="history-card-header">
              <span class="contract-type-badge" :class="c.contract_type">
                {{ getContractTypeLabel(c.contract_type) }}
              </span>
              <span
                class="status-badge"
                :style="{
                  background: getStatusColor(c.status) + '20',
                  color: getStatusColor(c.status),
                }"
              >
                {{ getStatusLabel(c.status) }}
              </span>
            </div>

            <div class="history-card-body">
              <div class="history-field">
                <span class="field-label">{{ t('dashboard.tools.contract.client') }}</span>
                <span class="field-value">{{ c.client_name }}</span>
              </div>
              <div class="history-field">
                <span class="field-label">{{ t('dashboard.tools.contract.vehicle') }}</span>
                <span class="field-value"
                  >{{ c.vehicle_type || '' }} {{ c.vehicle_plate || '-' }}</span
                >
              </div>
              <div class="history-field">
                <span class="field-label">{{ t('dashboard.tools.contract.date') }}</span>
                <span class="field-value">{{ formatDateShort(c.contract_date) }}</span>
              </div>
            </div>

            <div class="history-card-actions">
              <select
                :value="c.status"
                class="status-select"
                @change="
                  updateContractStatus(
                    c.id,
                    ($event.target as HTMLSelectElement).value as ContractStatus,
                  )
                "
              >
                <option value="draft">{{ t('dashboard.tools.contract.statusDraft') }}</option>
                <option value="signed">{{ t('dashboard.tools.contract.statusSigned') }}</option>
                <option value="active">{{ t('dashboard.tools.contract.statusActive') }}</option>
                <option value="expired">{{ t('dashboard.tools.contract.statusExpired') }}</option>
                <option value="cancelled">
                  {{ t('dashboard.tools.contract.statusCancelled') }}
                </option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.contract-page {
  max-width: 900px;
  margin: 0 auto;
  padding: 16px;
}

/* Header */
.page-header {
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-left {
  flex: 1;
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

.plan-badge {
  background: #e5e7eb;
  color: #374151;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

/* Upgrade Card */
.upgrade-card {
  background: #fff;
  border: 2px solid #e5e7eb;
  border-radius: 16px;
  padding: 48px 32px;
  text-align: center;
  max-width: 500px;
  margin: 32px auto;
}

.upgrade-icon {
  color: #23424a;
  margin-bottom: 16px;
}

.upgrade-card h2 {
  margin: 0 0 8px;
  font-size: 1.25rem;
}

.upgrade-card p {
  margin: 0 0 24px;
  color: #6b7280;
  font-size: 0.9rem;
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 16px;
  gap: 16px;
}

.loading-state.compact {
  padding: 32px 16px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #e5e7eb;
  border-top-color: #23424a;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.spinner-sm {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-right: 8px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Tabs */
.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 24px;
  border-bottom: 2px solid #e5e7eb;
}

.tab {
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 44px;
}

.tab:hover {
  color: #23424a;
}

.tab.active {
  color: #23424a;
  border-bottom-color: #23424a;
}

.tab-count {
  background: #23424a;
  color: #fff;
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
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
  flex-wrap: wrap;
  gap: 8px;
}

.tool-header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.history-count {
  font-size: 0.85rem;
  color: #6b7280;
}

/* Contract Form */
.contract-form {
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
  padding: 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.9rem;
  min-height: 44px;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
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

/* Radio cards */
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
  min-height: 44px;
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
  min-height: 44px;
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

.radio-icon-svg {
  flex-shrink: 0;
  color: #23424a;
}

.radio-label {
  font-weight: 500;
  font-size: 0.95rem;
}

/* Company details */
.company-details {
  margin-bottom: 20px;
}

.company-details summary {
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: #6b7280;
  padding: 8px 0;
  min-height: 44px;
  display: flex;
  align-items: center;
}

.company-details summary:hover {
  color: #374151;
}

.company-details[open] summary {
  margin-bottom: 12px;
}

/* Option toggle */
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
  min-height: 44px;
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

/* Alerts */
.alert {
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
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
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
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

.btn-sm {
  padding: 6px 14px;
  font-size: 0.8rem;
  min-height: 36px;
}

.btn-lg {
  padding: 14px 28px;
  font-size: 1rem;
  font-weight: 500;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Form Actions */
.form-actions {
  display: flex;
  justify-content: flex-end;
  padding-top: 10px;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 16px;
  color: #6b7280;
  text-align: center;
}

.empty-state p {
  margin: 0;
  font-size: 0.95rem;
}

/* History list */
.history-list {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-card {
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 16px;
  transition: box-shadow 0.2s;
}

.history-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.history-card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.contract-type-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.contract-type-badge.arrendamiento {
  background: #dbeafe;
  color: #1e40af;
}

.contract-type-badge.compraventa {
  background: #fef3c7;
  color: #92400e;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
}

.history-card-body {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12px;
  margin-bottom: 12px;
}

.history-field {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.field-label {
  font-size: 0.7rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: uppercase;
}

.field-value {
  font-size: 0.9rem;
  color: #111827;
}

.history-card-actions {
  display: flex;
  justify-content: flex-end;
}

.status-select {
  padding: 6px 10px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.8rem;
  min-height: 36px;
  cursor: pointer;
}

.status-select:focus {
  outline: none;
  border-color: #23424a;
  box-shadow: 0 0 0 2px rgba(35, 66, 74, 0.1);
}

/* ========================= Mobile-first responsive ========================= */
@media (max-width: 768px) {
  .contract-page {
    padding: 12px;
  }

  .page-header h1 {
    font-size: 1.25rem;
  }

  .form-row {
    flex-direction: column;
    gap: 12px;
  }

  .form-grid-3 {
    grid-template-columns: 1fr;
  }

  .radio-group-inline {
    flex-direction: column;
  }

  .radio-card {
    min-width: 100%;
  }

  .purchase-options {
    padding: 12px;
  }

  .history-card-body {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-actions {
    justify-content: stretch;
  }

  .form-actions .btn {
    width: 100%;
  }

  .tabs {
    gap: 0;
  }

  .tab {
    flex: 1;
    justify-content: center;
    padding: 12px 16px;
    font-size: 0.85rem;
  }

  .upgrade-card {
    padding: 32px 20px;
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .form-grid-3 {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
