/**
 * Composable for dealer invoice generation and management.
 * Extracts all invoice business logic from the factura page.
 * Plan gate: Basico+ (free plan sees upgrade prompt).
 *
 * Types     → utils/invoiceTypes
 * PDF / print → utils/invoicePdf
 */
import { generateInvoicePDF as buildInvoicePDF } from '~/utils/invoicePdf'
import { useFormAutosave } from '~/composables/useFormAutosave'
import {
  formatDateDMY,
  formatCurrency,
  formatHistoryDate,
  getInvoiceStatusClass as getStatusClass,
} from '~/utils/invoiceFormatters'
import type { InvoiceLine } from '~/utils/invoiceTypes'
import { useInvoiceData } from './useInvoiceData'

// Re-export types so consumers keep a single import point
export type {
  InvoiceLine,
  VehicleOption,
  DealerInvoiceRow,
  DealerFiscalRow,
} from '~/utils/invoiceTypes'

export function useInvoice() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { userId } = useAuth()
  const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // ============ STATE ============
  const activeTab = ref<'new' | 'history'>('new')
  const saving = ref(false)
  const errorMessage = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  // Data sub-composable (company data, vehicles, invoice history, invoice number)
  const {
    companyName,
    companyTaxId,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    companyLogoUrl,
    companyWebsite,
    vehicleOptions,
    loadingVehicles,
    invoiceNumber,
    invoiceHistory,
    loadingHistory,
    loadDealerData,
    loadVehicleOptions,
    generateInvoiceNumber,
    loadInvoiceHistory,
  } = useInvoiceData(
    dealerProfile as Ref<{ id: string; company_name: unknown } | null>,
    loadDealer as () => Promise<{ id: string; company_name: unknown } | null>,
    errorMessage,
  )

  // Client data
  const clientName = ref('')
  const clientDocType = ref<'NIF' | 'DNI' | 'CIF' | 'Pasaporte'>('NIF')
  const clientDocNumber = ref('')
  const clientAddress1 = ref('')
  const clientAddress2 = ref('')
  const clientAddress3 = ref('')

  // Invoice data
  const invoiceDate = ref(new Date().toISOString().split('T')[0])
  const invoiceConditions = ref('Pago a 30 dias')
  const invoiceLanguage = ref<'es' | 'en'>('es')
  const selectedVehicle = ref('')

  // Invoice lines
  const invoiceLines = ref<InvoiceLine[]>([])
  let lineIdCounter = 0

  // Vehicle autocomplete
  const vehicleSearch = ref('')
  const showVehicleDropdown = ref(false)

  // ============ AUTOSAVE DRAFT ============
  const _autosaveRef = ref<Record<string, unknown>>({}) as Ref<Record<string, unknown>>
  const { hasDraft, restoreDraft, clearDraft, draftSavedAt } = useFormAutosave(
    'factura',
    _autosaveRef,
    {
      beforeSave: (_ignored) => ({
        clientName: clientName.value,
        clientDocType: clientDocType.value,
        clientDocNumber: clientDocNumber.value,
        clientAddress1: clientAddress1.value,
        clientAddress2: clientAddress2.value,
        clientAddress3: clientAddress3.value,
        invoiceConditions: invoiceConditions.value,
        invoiceLanguage: invoiceLanguage.value,
        invoiceLines: JSON.stringify(invoiceLines.value),
      }),
      onRestore: (data) => {
        const d = data as Record<string, unknown>
        if (d.clientName !== undefined) clientName.value = d.clientName as string
        if (d.clientDocType !== undefined)
          clientDocType.value = d.clientDocType as 'NIF' | 'DNI' | 'CIF' | 'Pasaporte'
        if (d.clientDocNumber !== undefined) clientDocNumber.value = d.clientDocNumber as string
        if (d.clientAddress1 !== undefined) clientAddress1.value = d.clientAddress1 as string
        if (d.clientAddress2 !== undefined) clientAddress2.value = d.clientAddress2 as string
        if (d.clientAddress3 !== undefined) clientAddress3.value = d.clientAddress3 as string
        if (d.invoiceConditions !== undefined) invoiceConditions.value = d.invoiceConditions as string
        if (d.invoiceLanguage !== undefined)
          invoiceLanguage.value = d.invoiceLanguage as 'es' | 'en'
        if (d.invoiceLines !== undefined) {
          try {
            const lines = JSON.parse(d.invoiceLines as string) as typeof invoiceLines.value
            invoiceLines.value = lines
          } catch {
            // ignore parse errors
          }
        }
      },
    },
  )

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
      clearDraft()

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
    clearDraft()
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

    // Autosave draft
    hasDraft,
    restoreDraft,
    clearDraft,
    draftSavedAt,
  }
}
