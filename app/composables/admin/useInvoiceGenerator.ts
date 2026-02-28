export interface InvoiceLine {
  id: number
  tipo: 'Venta' | 'Alquiler' | 'Servicio' | 'Reserva' | 'Otro'
  concepto: string
  cantidad: number
  precioUd: number
  iva: number
}

export interface VehicleOption {
  id: string
  label: string
  source: 'vehicles' | 'historico'
}

export function useInvoiceGenerator(getVehicleOptions: () => VehicleOption[]) {
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

  function updateInvoiceNumber() {
    const year = new Date().getFullYear()
    const ids = selectedVehicles.value
      .filter((v) => v)
      .map((v) => v.split('-')[1])
      .join('-')
    invoiceNumber.value = ids ? `${year}/${ids}` : `${year}/000`
  }

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

  function onNumVehiclesChange() {
    const count = numVehicles.value
    while (selectedVehicles.value.length < count) {
      selectedVehicles.value.push('')
    }
    while (selectedVehicles.value.length > count) {
      selectedVehicles.value.pop()
    }
    if (invoiceLines.value.length === 0) {
      for (let i = 0; i < count; i++) {
        addInvoiceLine()
      }
    }
    updateInvoiceNumber()
  }

  function onVehicleSelected(index: number) {
    const vehicleId = selectedVehicles.value[index]
    if (!vehicleId) return

    const vehicle = getVehicleOptions().find((v) => v.id === vehicleId)
    if (vehicle && invoiceLines.value[index]) {
      invoiceLines.value[index].concepto = vehicle.label
    }
    updateInvoiceNumber()
  }

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

  function formatDateDMY(dateStr: string): string {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`
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

  onMounted(() => {
    updateInvoiceNumber()
    if (invoiceLines.value.length === 0) {
      addInvoiceLine()
    }
  })

  return {
    invoiceDate,
    invoiceConditions,
    invoiceInEnglish,
    invoiceNumber,
    numVehicles,
    selectedVehicles,
    invoiceLines,
    clientName,
    clientAddress1,
    clientAddress2,
    clientAddress3,
    clientDocType,
    clientDocNumber,
    companyName,
    companyNIF,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    companyWeb,
    companyLogoUrl,
    invoiceSubtotal,
    invoiceTotalIva,
    invoiceTotal,
    onNumVehiclesChange,
    onVehicleSelected,
    addInvoiceLine,
    removeInvoiceLine,
    getLineImporte,
    getLineSubtotal,
    generateInvoicePDF,
    resetForm,
  }
}
