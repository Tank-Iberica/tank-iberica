/**
 * Composable for dealer invoice generation and management.
 * Extracts all invoice business logic from the factura page.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 */

// ============ TYPES ============
export interface InvoiceLine {
  id: number
  tipo: 'Venta' | 'Alquiler' | 'Servicio' | 'Transporte' | 'Transferencia'
  concepto: string
  cantidad: number
  precioUd: number
  iva: number
}

export interface VehicleOption {
  id: string
  label: string
}

export interface DealerInvoiceRow {
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

export interface DealerFiscalRow {
  tax_id: string | null
  tax_address: string | null
}

export function useInvoice() {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { userId } = useAuth()
  const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

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

  // ============ COMPUTED ============
  const filteredVehicles = computed(() => {
    const query = vehicleSearch.value.toLowerCase().trim()
    if (!query) return vehicleOptions.value
    return vehicleOptions.value.filter((v) => v.label.toLowerCase().includes(query))
  })

  const isFreeUser = computed(() => currentPlan.value === 'free')

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
  function getLineImporte(line: InvoiceLine): number {
    return line.cantidad * line.precioUd
  }

  function getLineSubtotal(line: InvoiceLine): number {
    const importe = getLineImporte(line)
    return importe + (importe * line.iva) / 100
  }

  function addInvoiceLine(): void {
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

  function removeInvoiceLine(id: number): void {
    invoiceLines.value = invoiceLines.value.filter((l) => l.id !== id)
  }

  function selectVehicle(vehicle: VehicleOption): void {
    selectedVehicle.value = vehicle.id
    vehicleSearch.value = vehicle.label
    showVehicleDropdown.value = false

    // Auto-fill first empty line concept with vehicle info
    const emptyLine = invoiceLines.value.find((l) => !l.concepto)
    if (emptyLine) {
      emptyLine.concepto = vehicle.label
    }
  }

  function clearVehicle(): void {
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

  function onVehicleBlur(): void {
    setTimeout(() => {
      showVehicleDropdown.value = false
    }, 200)
  }

  return {
    // State
    activeTab,
    saving,
    loadingHistory,
    loadingVehicles,
    invoiceHistory,
    vehicleOptions,
    errorMessage,
    successMessage,
    companyName,
    companyTaxId,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    companyLogoUrl,
    companyWebsite,
    clientName,
    clientDocType,
    clientDocNumber,
    clientAddress1,
    clientAddress2,
    clientAddress3,
    invoiceDate,
    invoiceNumber,
    invoiceConditions,
    invoiceLanguage,
    selectedVehicle,
    invoiceLines,
    vehicleSearch,
    showVehicleDropdown,

    // Computed
    filteredVehicles,
    isFreeUser,
    invoiceSubtotal,
    invoiceTotalIva,
    invoiceTotal,

    // Methods
    getLineImporte,
    getLineSubtotal,
    addInvoiceLine,
    removeInvoiceLine,
    selectVehicle,
    clearVehicle,
    formatDateDMY,
    formatCurrency,
    formatHistoryDate,
    getStatusClass,
    loadDealerData,
    loadVehicleOptions,
    generateInvoiceNumber,
    loadInvoiceHistory,
    saveInvoice,
    generateInvoicePDF,
    handleGeneratePDF,
    resetForm,
    onVehicleBlur,
    printHTML,

    // Dependencies exposed for lifecycle use
    fetchSubscription,
  }
}
