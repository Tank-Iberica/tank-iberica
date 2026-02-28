/**
 * Contract HTML Generator Utilities
 * Generates rental and sale contract HTML documents
 */

// ---------------------------------------------------------------------------
// Number to words (Spanish)
// ---------------------------------------------------------------------------

export function numberToWords(n: number): string {
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
    const tIdx = Math.floor(n / 10)
    const u = n % 10
    if (tIdx === 2 && u > 0) return `VEINTI${units[u] ?? ''}`
    return u > 0 ? `${tens[tIdx] ?? ''} Y ${units[u] ?? ''}` : (tens[tIdx] ?? '')
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

// ---------------------------------------------------------------------------
// Date formatting
// ---------------------------------------------------------------------------

export function formatDateSpanish(dateStr: string): string {
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

// ---------------------------------------------------------------------------
// Contract types
// ---------------------------------------------------------------------------

export interface RentalContractData {
  contractDate: string
  contractLocation: string
  contractVehicleType: string
  contractVehiclePlate: string
  lessorRepresentative: string
  lessorRepresentativeNIF: string
  lessorCompany: string
  lessorCIF: string
  lessorAddress: string
  clientType: 'persona' | 'empresa'
  clientName: string
  clientNIF: string
  clientCompany: string
  clientCIF: string
  clientRepresentative: string
  clientRepresentativeNIF: string
  clientAddress: string
  contractMonthlyRent: number
  contractDeposit: number
  contractDuration: number
  contractDurationUnit: 'meses' | 'anos'
  contractPaymentDays: number
  contractVehicleResidualValue: number
  contractJurisdiction: string
  contractHasPurchaseOption: boolean
  contractPurchasePrice: number
  contractPurchaseNotice: number
  contractRentMonthsToDiscount: number
}

export interface SaleContractData {
  contractDate: string
  contractLocation: string
  contractVehicleType: string
  contractVehiclePlate: string
  lessorRepresentative: string
  lessorRepresentativeNIF: string
  lessorCompany: string
  lessorCIF: string
  lessorAddress: string
  clientType: 'persona' | 'empresa'
  clientName: string
  clientNIF: string
  clientCompany: string
  clientCIF: string
  clientRepresentative: string
  clientRepresentativeNIF: string
  clientAddress: string
  contractSalePrice: number
  contractSalePaymentMethod: string
  contractSaleDeliveryConditions: string
  contractSaleWarranty: string
  contractJurisdiction: string
}

// ---------------------------------------------------------------------------
// Generate Rental Contract HTML
// ---------------------------------------------------------------------------

export function generateRentalContract(data: RentalContractData): string {
  const date = formatDateSpanish(data.contractDate)
  const monthlyRentWords = numberToWords(data.contractMonthlyRent)
  const depositWords = numberToWords(data.contractDeposit)
  const durationWords = numberToWords(data.contractDuration)
  const residualWords = numberToWords(data.contractVehicleResidualValue)
  const purchasePriceWords = numberToWords(data.contractPurchasePrice)
  const noticeWords = numberToWords(data.contractPurchaseNotice)
  const rentMonthsWords = numberToWords(data.contractRentMonthsToDiscount)
  const durationUnitLabel = data.contractDurationUnit === 'meses' ? 'MESES' : 'ANOS'

  let lesseeSection = ''
  if (data.clientType === 'persona') {
    lesseeSection = `De otra parte D. ${data.clientName.toUpperCase()}, mayor de edad, con NIF ${data.clientNIF}, con domicilio en ${data.clientAddress}, en adelante arrendatario.`
  } else {
    lesseeSection = `De otra parte D. ${data.clientRepresentative}, mayor de edad, con NIF ${data.clientRepresentativeNIF}, en nombre y representacion de la mercantil ${data.clientCompany.toUpperCase()}, con CIF ${data.clientCIF}, con domicilio en ${data.clientAddress}, en adelante arrendatario.`
  }

  let contract = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Arrendamiento - ${data.contractVehiclePlate}</title>
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
  <h1>CONTRATO DE ARRENDAMIENTO DE ${data.contractVehicleType.toUpperCase()}</h1>

  <p class="header-location">En ${data.contractLocation} a ${date}</p>

  <h2>REUNIDOS</h2>

  <p class="section">De una parte D. ${data.lessorRepresentative}, mayor de edad, con DNI ${data.lessorRepresentativeNIF}, en nombre y representacion de la mercantil ${data.lessorCompany.toUpperCase()}, con el CIF ${data.lessorCIF}, con domicilio en ${data.lessorAddress} (en adelante arrendador).</p>

  <p class="section">${lesseeSection}</p>

  <p class="section">Las partes, reconociendose capacidad suficiente para celebrar el presente contrato de arrendamiento de ${data.contractVehicleType},</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el arrendador es propietario de ${data.contractVehicleType} matricula ${data.contractVehiclePlate}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el arrendatario esta interesado en arrendar dicho vehiculo para su explotacion.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  En virtud del presente contrato el arrendador cede el ${data.contractVehicleType} en arrendamiento al arrendatario y este la toma en arrendamiento para su explotacion como transportista por su cuenta y riesgo para las operaciones de transporte, carga y descarga durante todo el periodo que dure el presente contrato.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- UTILIZACION DEL VEHICULO</span><br>
  La utilizacion del vehiculo por el arrendatario respetara en todo momento la vigente normativa, y en especial, la legislacion en materia de transporte y trafico, la legislacion sobre proteccion y conservacion del medio ambiente y las normas sobre Seguridad e Higiene en el Trabajo.</p>

  <p class="clause"><span class="clause-title">TERCERA.- CESION DEL VEHICULO</span><br>
  Queda terminantemente prohibida toda cesion del vehiculo a terceros por parte del arrendatario, en cualquier forma o modalidad, bien sea a titulo oneroso o gratuito, sin la previa autorizacion por escrito del arrendador.</p>

  <p class="clause"><span class="clause-title">CUARTA.- ALTERACIONES EN EL VEHICULO</span><br>
  El arrendatario no podra llevar a cabo, por si mismo o a traves de terceros, alteracion o modificacion alguna en la naturaleza, condiciones o prestaciones del ${data.contractVehicleType} que suponga o permita un uso distinto para el que es cedido en arrendamiento.</p>

  <p class="clause"><span class="clause-title">QUINTA.- MANTENIMIENTO Y REPARACIONES DEL VEHICULO</span><br>
  El arrendador asume el desgaste mecanico normal del vehiculo teniendo en cuenta el uso para el que se destina por parte del arrendatario. Los gastos de mantenimiento, reparacion de averias sufridas por el vehiculo y cambio de ruedas durante el tiempo de arrendamiento son de cargo del arrendatario.<br><br>
  El arrendatario debera informar al arrendador de cualquier incidencia que afecte al normal uso del vehiculo en un plazo no superior a 7 dias desde que se produzca dicha incidencia.<br><br>
  El arrendador facilitara el vehiculo con la ITV pasada, significando esto que todos sus componentes son aptos para el correcto funcionamiento del mismo. Cualquier renovacion que requiriese el vehiculo durante el periodo de arrendamiento sera gestionado por el arrendatario.</p>

  <p class="clause"><span class="clause-title">SEXTA.- DESPERFECTOS Y DANOS POR MAL USO</span><br>
  El arrendatario respondera integramente de los desperfectos que el vehiculo sufra, excepto de los danos cuya reparacion sea superior al valor residual del vehiculo, el cual las partes fijan en ${residualWords} (${data.contractVehicleResidualValue.toLocaleString('es-ES')} EUR).<br><br>
  En caso de discrepancia sobre el importe y valoracion de los danos, el arrendador designara un perito para que haga una valoracion de los mismos.</p>

  <p class="clause"><span class="clause-title">SEPTIMA.- INSPECCION DEL VEHICULO</span><br>
  El Arrendador podra inspeccionar la instalacion, conservacion y utilizacion del vehiculo en cualquier momento, dentro del horario laboral del Arrendatario, el cual garantizara a los representantes del Arrendador el acceso al vehiculo para su inspeccion.</p>

  <p class="clause"><span class="clause-title">OCTAVA.- POLIZA DE SEGURO</span><br>
  El arrendador entrega el vehiculo con seguro de circulacion basico siendo por cuenta del arrendatario asegurar la carga y la responsabilidad civil de la misma.</p>

  <p class="clause"><span class="clause-title">NOVENA.- PRECIO Y FIANZA</span><br>
  El arrendador percibira del arrendatario la cantidad de ${monthlyRentWords} (${data.contractMonthlyRent.toLocaleString('es-ES')} EUR) MENSUALES MAS EL IVA.<br><br>
  Dicho precio se hara efectivo dentro de los ${data.contractPaymentDays} dias naturales siguientes a la emision por parte del arrendador de la correspondiente factura.<br><br>
  Se establece una fianza de ${depositWords} EUROS (${data.contractDeposit.toLocaleString('es-ES')} EUR) pagadera junto con la primera mensualidad y tambien por anticipado.</p>

  <p class="clause"><span class="clause-title">DECIMA.- DURACION</span><br>
  El presente contrato entrara en vigor en la fecha indicada en el encabezamiento y tendra una duracion de ${durationWords} (${data.contractDuration}) ${durationUnitLabel} pudiendose prorrogar al final del vencimiento, mes a mes por acuerdo expreso de las partes.</p>

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
  Para la solucion de cualquier cuestion litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${data.contractJurisdiction} renunciando expresamente al fuero de los que por cualquier motivo pudiera corresponderles.</p>`

  if (data.contractHasPurchaseOption) {
    contract += `
  <p class="clause"><span class="clause-title">DECIMOQUINTA.- OPCION DE COMPRA Y APLICACION DE RENTAS</span><br>
  <strong>1. Concesion de la opcion.</strong><br>
  El Arrendador concede al Arrendatario una opcion de compra sobre el bien objeto del presente contrato (${data.contractVehicleType} matricula ${data.contractVehiclePlate}). La opcion podra ejercitarse durante la vigencia del arrendamiento mediante notificacion escrita al Arrendador con una antelacion minima de ${noticeWords} (${data.contractPurchaseNotice}) dias.<br><br>
  <strong>2. Precio de ejercicio.</strong><br>
  El precio de compraventa se fija en ${purchasePriceWords} EUR (${data.contractPurchasePrice.toLocaleString('es-ES')} EUR), impuestos no incluidos, salvo modificacion pactada por escrito entre las partes.<br><br>
  <strong>3. Imputacion de rentas al precio de compraventa.</strong><br>
  En caso de ejercitarse la opcion de compra, unicamente se descontara del precio de compraventa el importe correspondiente a las ${rentMonthsWords} (${data.contractRentMonthsToDiscount}) ultimas mensualidades de renta efectivamente pagadas por el Arrendatario inmediatamente anteriores a la fecha de ejercicio de la opcion.<br>
  Ninguna otra renta, fianza ni cantidad abonada por el Arrendatario sera objeto de deduccion, salvo pacto expreso y por escrito.<br><br>
  <strong>4. Formalizacion de la compraventa.</strong><br>
  Ejercida la opcion, las partes suscribiran la documentacion de transmision en un plazo maximo de ${noticeWords} (${data.contractPurchaseNotice}) dias desde la notificacion. Los gastos, tasas e impuestos derivados de la transmision seran asumidos por la parte legalmente obligada.</p>`
  }

  // Signatures
  const lesseeSignatureName =
    data.clientType === 'persona'
      ? data.clientName.toUpperCase()
      : `${data.clientCompany.toUpperCase()}<br>D. ${data.clientRepresentative}`

  const lesseeSignatureDoc =
    data.clientType === 'persona' ? `NIF: ${data.clientNIF}` : `CIF: ${data.clientCIF}`

  contract += `
  <p style="margin-top: 40px;">Y en prueba de conformidad con el presente Contrato, las partes lo firman por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.</p>

  <div class="signatures">
    <div class="signature-block">
      <p>El Arrendador</p>
      <div class="signature-line">
        ${data.lessorCompany.toUpperCase()}<br>
        CIF: ${data.lessorCIF}<br>
        D. ${data.lessorRepresentative}
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

export function generateSaleContract(data: SaleContractData): string {
  const date = formatDateSpanish(data.contractDate)
  const salePriceWords = numberToWords(data.contractSalePrice)

  let buyerSection = ''
  if (data.clientType === 'persona') {
    buyerSection = `De otra parte D. ${data.clientName.toUpperCase()}, mayor de edad, con NIF ${data.clientNIF}, con domicilio en ${data.clientAddress}, en adelante comprador.`
  } else {
    buyerSection = `De otra parte D. ${data.clientRepresentative}, mayor de edad, con NIF ${data.clientRepresentativeNIF}, en nombre y representacion de la mercantil ${data.clientCompany.toUpperCase()}, con CIF ${data.clientCIF}, con domicilio en ${data.clientAddress}, en adelante comprador.`
  }

  const buyerSignatureName =
    data.clientType === 'persona'
      ? data.clientName.toUpperCase()
      : `${data.clientCompany.toUpperCase()}<br>D. ${data.clientRepresentative}`

  const buyerSignatureDoc =
    data.clientType === 'persona' ? `NIF: ${data.clientNIF}` : `CIF: ${data.clientCIF}`

  const deliveryText =
    data.contractSaleDeliveryConditions ||
    'El vendedor se compromete a entregar el vehiculo al comprador en el estado en que se encuentra, el cual ha sido examinado y aceptado por el comprador.'

  const warrantyText =
    data.contractSaleWarranty ||
    'El vendedor garantiza que el vehiculo se encuentra en buen estado de funcionamiento y libre de vicios ocultos. En caso de que se manifestaran defectos ocultos, el comprador tendra derecho a la reparacion o resolucion del contrato conforme a la legislacion vigente.'

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Contrato de Compraventa - ${data.contractVehiclePlate}</title>
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
  <h1>CONTRATO DE COMPRAVENTA DE ${data.contractVehicleType.toUpperCase()}</h1>

  <p class="header-location">En ${data.contractLocation} a ${date}</p>

  <h2>REUNIDOS</h2>

  <p class="section">De una parte D. ${data.lessorRepresentative}, mayor de edad, con DNI ${data.lessorRepresentativeNIF}, en nombre y representacion de la mercantil ${data.lessorCompany.toUpperCase()}, con el CIF ${data.lessorCIF}, con domicilio en ${data.lessorAddress} (en adelante vendedor).</p>

  <p class="section">${buyerSection}</p>

  <p class="section">Las partes, reconociendose capacidad suficiente para celebrar el presente contrato de compraventa,</p>

  <h2>EXPONEN</h2>

  <p class="clause"><span class="clause-title">PRIMERO:</span> Que el vendedor es propietario de ${data.contractVehicleType} matricula ${data.contractVehiclePlate}.</p>

  <p class="clause"><span class="clause-title">SEGUNDO:</span> Que el comprador esta interesado en adquirir dicho vehiculo y el vendedor en transmitirlo.</p>

  <h2>ESTIPULACIONES</h2>

  <p class="clause"><span class="clause-title">PRIMERA.- OBJETO DEL CONTRATO</span><br>
  El vendedor vende y transmite al comprador, que acepta y adquiere, el ${data.contractVehicleType} con matricula ${data.contractVehiclePlate}, libre de cargas y gravamenes.</p>

  <p class="clause"><span class="clause-title">SEGUNDA.- PRECIO</span><br>
  El precio de la compraventa se fija en ${salePriceWords} EUROS (${data.contractSalePrice.toLocaleString('es-ES')} EUR) mas el IVA correspondiente.</p>

  <p class="clause"><span class="clause-title">TERCERA.- FORMA DE PAGO</span><br>
  El pago se realizara mediante ${data.contractSalePaymentMethod} en el momento de la firma del presente contrato.</p>

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
  Para la solucion de cualquier cuestion litigiosa derivada del presente Contrato, las partes se someten a la competencia de los Tribunales de ${data.contractJurisdiction}.</p>

  <p style="margin-top: 40px;">Y en prueba de conformidad con el presente Contrato, las partes lo firman por duplicado y a un solo efecto, en el lugar y fecha indicados en el encabezamiento.</p>

  <div class="signatures">
    <div class="signature-block">
      <p>El Vendedor</p>
      <div class="signature-line">
        ${data.lessorCompany.toUpperCase()}<br>
        CIF: ${data.lessorCIF}<br>
        D. ${data.lessorRepresentative}
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

export function printHTML(html: string): void {
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
