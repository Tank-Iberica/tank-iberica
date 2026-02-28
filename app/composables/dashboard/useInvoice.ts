/**
 * Composable for dealer invoice generation and management.
 * Extracts all invoice business logic from the factura page.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 *
 * Types     → utils/invoiceTypes
 * PDF / print → utils/invoicePdf
 */
import { generateInvoicePDF as buildInvoicePDF } from '~/utils/invoicePdf'
import {
  formatDateDMY,
  formatCurrency,
  formatHistoryDate,
  getInvoiceStatusClass as getStatusClass,
} from '~/utils/invoiceFormatters'
import type {
  InvoiceLine,
  VehicleOption,
  DealerInvoiceRow,
  DealerFiscalRow,
} from '~/utils/invoiceTypes'

// Re-export types so consumers keep a single import point
export type {
  InvoiceLine,
  VehicleOption,
  DealerInvoiceRow,
  DealerFiscalRow,
} from '~/utils/invoiceTypes'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)(
        'generate_dealer_invoice_number',
        {
          p_dealer_id: dealer.id,
        },
      )

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
      invoiceHistory.value = (data || []) as unknown as DealerInvoiceRow[]
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

  // ============ GENERATE PDF (delegates to pure utility) ============
  function generateInvoicePDF(): void {
    buildInvoicePDF({
      invoiceNumber: invoiceNumber.value,
      invoiceDate: invoiceDate.value || '',
      invoiceLanguage: invoiceLanguage.value,
      invoiceConditions: invoiceConditions.value,
      invoiceLines: invoiceLines.value,
      invoiceSubtotal: invoiceSubtotal.value,
      invoiceTotalIva: invoiceTotalIva.value,
      invoiceTotal: invoiceTotal.value,
      companyName: companyName.value,
      companyTaxId: companyTaxId.value,
      companyAddress1: companyAddress1.value,
      companyAddress2: companyAddress2.value,
      companyAddress3: companyAddress3.value,
      companyPhone: companyPhone.value,
      companyEmail: companyEmail.value,
      companyLogoUrl: companyLogoUrl.value,
      companyWebsite: companyWebsite.value,
      clientName: clientName.value,
      clientDocType: clientDocType.value,
      clientDocNumber: clientDocNumber.value,
      clientAddress1: clientAddress1.value,
      clientAddress2: clientAddress2.value,
      clientAddress3: clientAddress3.value,
    })
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

    // Dependencies exposed for lifecycle use
    fetchSubscription,
  }
}
