/**
 * useInvoiceData
 * Handles all data loading for the dealer invoice composable.
 * Extracted from useInvoice for size reduction (#121).
 *
 * Owns: company data refs, vehicle options, invoice history, invoice number.
 * Accepts: dealerProfile ref, loadDealer fn, errorMessage ref (shared with parent).
 */
import type {
  VehicleOption,
  DealerInvoiceRow,
  DealerFiscalRow,
} from '~/utils/invoiceTypes'

interface DealerDataProfile {
  id: string
  company_name: unknown
  phone?: string | null
  email?: string | null
  logo_url?: string | null
  website?: string | null
}

export function useInvoiceData(
  dealerProfile: Ref<DealerDataProfile | null>,
  loadDealer: () => Promise<DealerDataProfile | null>,
  errorMessage: Ref<string | null>,
) {
  const { t, locale } = useI18n()
  const supabase = useSupabaseClient()

  // ---- Dealer / company data (pre-filled from profile) ----
  const companyName = ref('')
  const companyTaxId = ref('')
  const companyAddress1 = ref('')
  const companyAddress2 = ref('')
  const companyAddress3 = ref('')
  const companyPhone = ref('')
  const companyEmail = ref('')
  const companyLogoUrl = ref('')
  const companyWebsite = ref('')

  // ---- Vehicle options ----
  const vehicleOptions = ref<VehicleOption[]>([])
  const loadingVehicles = ref(false)

  // ---- Invoice number ----
  const invoiceNumber = ref('')

  // ---- Invoice history ----
  const invoiceHistory = ref<DealerInvoiceRow[]>([])
  const loadingHistory = ref(false)

  async function loadDealerData(): Promise<void> {
    const dealer = dealerProfile.value || (await loadDealer())
    if (!dealer) return

    const nameObj = dealer.company_name as Record<string, string> | string | null
    if (typeof nameObj === 'object' && nameObj !== null) {
      companyName.value = localizedField(nameObj, locale.value) || ''
    } else if (typeof nameObj === 'string') {
      companyName.value = nameObj
    }

    companyPhone.value = dealer.phone || ''
    companyEmail.value = dealer.email || ''
    companyLogoUrl.value = dealer.logo_url || ''
    companyWebsite.value = dealer.website || ''

    const { data: fiscalData } = await supabase
      .from('dealer_fiscal_data')
      .select('tax_id, tax_address')
      .eq('dealer_id', dealer.id)
      .maybeSingle()

    if (fiscalData) {
      const fiscal = fiscalData as DealerFiscalRow
      companyTaxId.value = fiscal.tax_id || ''
      if (fiscal.tax_address) {
        const parts = fiscal.tax_address.split('\n')
        companyAddress1.value = parts[0] || ''
        companyAddress2.value = parts[1] || ''
        companyAddress3.value = parts[2] || ''
      }
    }

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
            `${v.brand || ''} ${v.model || ''} ${v.plate ? '(' + v.plate + ')' : ''} ${v.year ? '- ' + v.year : ''}`.trim(),
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
        { p_dealer_id: dealer.id },
      )

      if (rpcError || !data) {
        const year = new Date().getFullYear()
        const nameObj = dealer.company_name as Record<string, string> | string | null
        let prefix = 'DLR'
        if (typeof nameObj === 'string' && nameObj.length >= 3) {
          prefix = nameObj.substring(0, 3).toUpperCase()
        } else if (typeof nameObj === 'object' && nameObj !== null) {
          const name = localizedField(nameObj, 'es')
          if (name.length >= 3) prefix = name.substring(0, 3).toUpperCase()
        }
        invoiceNumber.value = `${prefix}-${year}-0001`
      } else {
        invoiceNumber.value = data as string
      }
    } catch {
      invoiceNumber.value = `DLR-${new Date().getFullYear()}-0001`
    }
  }

  async function loadInvoiceHistory(): Promise<void> {
    const dealer = dealerProfile.value
    if (!dealer) return

    loadingHistory.value = true
    try {
      const { data, error: fetchError } = await supabase
        .from('dealer_invoices')
        .select(
          'id, invoice_number, invoice_date, client_name, client_doc_type, client_doc_number, client_address, vehicle_ids, lines, subtotal, total_tax, total, conditions, language, status, created_at',
        )
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

  return {
    // Company data
    companyName,
    companyTaxId,
    companyAddress1,
    companyAddress2,
    companyAddress3,
    companyPhone,
    companyEmail,
    companyLogoUrl,
    companyWebsite,
    // Vehicle options
    vehicleOptions,
    loadingVehicles,
    // Invoice tracking
    invoiceNumber,
    invoiceHistory,
    loadingHistory,
    // Actions
    loadDealerData,
    loadVehicleOptions,
    generateInvoiceNumber,
    loadInvoiceHistory,
  }
}
