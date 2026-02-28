export type ContractType = 'arrendamiento' | 'venta'

export interface VehicleOption {
  id: string
  label: string
  source: 'vehicles' | 'historico'
}

export function useContractGenerator(getVehicleOptions: () => VehicleOption[]) {
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

  function onContractVehicleSelected() {
    const vehicleId = contractVehicle.value
    if (!vehicleId) return

    const vehicle = getVehicleOptions().find((v) => v.id === vehicleId)
    if (vehicle) {
      const plateMatch = vehicle.label.match(/\(([^)]+)\)/)
      if (plateMatch) {
        contractVehiclePlate.value = plateMatch[1] ?? ''
      }
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
    if (n < 20) return units[n] ?? ''
    if (n < 100) {
      const t = Math.floor(n / 10)
      const u = n % 10
      if (t === 2 && u > 0) return `VEINTI${units[u] ?? ''}`
      return u > 0 ? `${tens[t] ?? ''} Y ${units[u] ?? ''}` : (tens[t] ?? '')
    }
    if (n < 1000) {
      const h = Math.floor(n / 100)
      const rest = n % 100
      if (n === 100) return 'CIEN'
      return rest > 0 ? `${hundreds[h] ?? ''} ${numberToWords(rest)}` : (hundreds[h] ?? '')
    }
    if (n < 10000) {
      const th = Math.floor(n / 1000)
      const rest = n % 1000
      const thWord = th === 1 ? 'MIL' : `${units[th]} MIL`
      return rest > 0 ? `${thWord} ${numberToWords(rest)}` : thWord
    }
    return n.toLocaleString('es-ES')
  }

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

  function generateRentalContract(): string {
    const date = formatDateSpanish(contractDate.value ?? '')
    const monthlyRentWords = numberToWords(contractMonthlyRent.value)
    const depositWords = numberToWords(contractDeposit.value)
    const durationWords = numberToWords(contractDuration.value)
    const residualWords = numberToWords(contractVehicleResidualValue.value)
    const purchasePriceWords = numberToWords(contractPurchasePrice.value)
    const noticeWords = numberToWords(contractPurchaseNotice.value)
    const rentMonthsWords = numberToWords(contractRentMonthsToDiscount.value)

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

  function generateSaleContract(): string {
    const date = formatDateSpanish(contractDate.value ?? '')
    const salePriceWords = numberToWords(contractSalePrice.value)

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

  function generateContractPDF() {
    const html =
      contractType.value === 'arrendamiento' ? generateRentalContract() : generateSaleContract()
    printHTML(html)
  }

  function resetForm() {
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

  return {
    contractType,
    contractDate,
    contractLocation,
    contractVehicle,
    lessorRepresentative,
    lessorRepresentativeNIF,
    lessorCompany,
    lessorCIF,
    lessorAddress,
    lesseeType,
    lesseeName,
    lesseeNIF,
    lesseeCompany,
    lesseeCIF,
    lesseeRepresentative,
    lesseeRepresentativeNIF,
    lesseeAddress,
    contractVehicleType,
    contractVehiclePlate,
    contractVehicleResidualValue,
    contractMonthlyRent,
    contractDeposit,
    contractDuration,
    contractDurationUnit,
    contractPaymentDays,
    contractHasPurchaseOption,
    contractPurchasePrice,
    contractPurchaseNotice,
    contractRentMonthsToDiscount,
    contractSalePrice,
    contractSalePaymentMethod,
    contractJurisdiction,
    onContractVehicleSelected,
    generateContractPDF,
    resetForm,
  }
}
