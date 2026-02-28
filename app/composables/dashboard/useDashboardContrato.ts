/**
 * useDashboardContrato
 *
 * All reactive state, computed properties, and functions for the
 * Contract Generator page (/dashboard/herramientas/contrato).
 *
 * The composable does NOT call onMounted — lifecycle management stays in the page.
 */
import {
  generateRentalContract,
  generateSaleContract,
  printHTML,
  type RentalContractData,
  type SaleContractData,
} from '~/utils/contractGenerator'

// ---------------------------------------------------------------------------
// Types (module-scoped — only used by this feature)
// ---------------------------------------------------------------------------

export type ContractType = 'arrendamiento' | 'compraventa'
export type ClientType = 'persona' | 'empresa'
export type ContractStatus = 'draft' | 'signed' | 'active' | 'expired' | 'cancelled'
export type ActiveTab = 'nuevo' | 'historial'

export interface VehicleOption {
  id: string
  label: string
  plate: string
  vehicleType: string
}

export interface ContractRow {
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
// Composable
// ---------------------------------------------------------------------------

export function useDashboardContrato() {
  const { t } = useI18n()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()
  const { currentPlan, fetchSubscription } = useSubscriptionPlan(userId.value || undefined)

  // -----------------------------------------------------------------------
  // Plan Gate
  // -----------------------------------------------------------------------

  const hasAccess = computed(() => {
    return (
      currentPlan.value === 'basic' ||
      currentPlan.value === 'premium' ||
      currentPlan.value === 'founding'
    )
  })

  // -----------------------------------------------------------------------
  // State
  // -----------------------------------------------------------------------

  const activeTab = ref<ActiveTab>('nuevo')
  const loading = ref(true)
  const saving = ref(false)
  const saveError = ref<string | null>(null)
  const saveSuccess = ref(false)

  // Contract type
  const contractType = ref<ContractType>('arrendamiento')
  const contractDate = ref<string>(new Date().toISOString().split('T')[0]!)
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

  // -----------------------------------------------------------------------
  // Tab navigation
  // -----------------------------------------------------------------------

  function showHistory(): void {
    activeTab.value = 'historial'
    loadContractHistory()
  }

  // -----------------------------------------------------------------------
  // Vehicle loading
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Pre-fill from dealer profile
  // -----------------------------------------------------------------------

  function prefillFromDealer(): void {
    const dealer = dealerProfile.value
    if (!dealer) return

    // The raw data from select('*') contains all columns
    const raw = dealer as Record<string, unknown>

    lessorCompany.value =
      (typeof raw.legal_name === 'string' && raw.legal_name
        ? raw.legal_name
        : typeof raw.company_name === 'string'
          ? raw.company_name
          : raw.company_name &&
              typeof raw.company_name === 'object' &&
              'es' in (raw.company_name as Record<string, string>)
            ? (raw.company_name as Record<string, string>).es
            : '') || ''

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

  // -----------------------------------------------------------------------
  // Generate contract and save to DB
  // -----------------------------------------------------------------------

  async function generateContract(): Promise<void> {
    let html = ''

    if (contractType.value === 'arrendamiento') {
      const rentalData: RentalContractData = {
        contractDate: contractDate.value,
        contractLocation: contractLocation.value,
        contractVehicleType: contractVehicleType.value,
        contractVehiclePlate: contractVehiclePlate.value,
        lessorRepresentative: lessorRepresentative.value,
        lessorRepresentativeNIF: lessorRepresentativeNIF.value,
        lessorCompany: lessorCompany.value,
        lessorCIF: lessorCIF.value,
        lessorAddress: lessorAddress.value,
        clientType: clientType.value,
        clientName: clientName.value,
        clientNIF: clientNIF.value,
        clientCompany: clientCompany.value,
        clientCIF: clientCIF.value,
        clientRepresentative: clientRepresentative.value,
        clientRepresentativeNIF: clientRepresentativeNIF.value,
        clientAddress: clientAddress.value,
        contractMonthlyRent: contractMonthlyRent.value,
        contractDeposit: contractDeposit.value,
        contractDuration: contractDuration.value,
        contractDurationUnit: contractDurationUnit.value,
        contractPaymentDays: contractPaymentDays.value,
        contractVehicleResidualValue: contractVehicleResidualValue.value,
        contractJurisdiction: contractJurisdiction.value,
        contractHasPurchaseOption: contractHasPurchaseOption.value,
        contractPurchasePrice: contractPurchasePrice.value,
        contractPurchaseNotice: contractPurchaseNotice.value,
        contractRentMonthsToDiscount: contractRentMonthsToDiscount.value,
      }
      html = generateRentalContract(rentalData)
    } else {
      const saleData: SaleContractData = {
        contractDate: contractDate.value,
        contractLocation: contractLocation.value,
        contractVehicleType: contractVehicleType.value,
        contractVehiclePlate: contractVehiclePlate.value,
        lessorRepresentative: lessorRepresentative.value,
        lessorRepresentativeNIF: lessorRepresentativeNIF.value,
        lessorCompany: lessorCompany.value,
        lessorCIF: lessorCIF.value,
        lessorAddress: lessorAddress.value,
        clientType: clientType.value,
        clientName: clientName.value,
        clientNIF: clientNIF.value,
        clientCompany: clientCompany.value,
        clientCIF: clientCIF.value,
        clientRepresentative: clientRepresentative.value,
        clientRepresentativeNIF: clientRepresentativeNIF.value,
        clientAddress: clientAddress.value,
        contractSalePrice: contractSalePrice.value,
        contractSalePaymentMethod: contractSalePaymentMethod.value,
        contractSaleDeliveryConditions: contractSaleDeliveryConditions.value,
        contractSaleWarranty: contractSaleWarranty.value,
        contractJurisdiction: contractJurisdiction.value,
      }
      html = generateSaleContract(saleData)
    }

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

      const { error: err } = await supabase.from('dealer_contracts').insert(insertData as never)

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

  // -----------------------------------------------------------------------
  // Contract History
  // -----------------------------------------------------------------------

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

  async function updateContractStatus(
    contractId: string,
    newStatus: ContractStatus,
  ): Promise<void> {
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

  // -----------------------------------------------------------------------
  // Reset form
  // -----------------------------------------------------------------------

  function resetForm(): void {
    contractType.value = 'arrendamiento'
    contractDate.value = new Date().toISOString().split('T')[0]!
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

  // -----------------------------------------------------------------------
  // Init (called from onMounted in the page)
  // -----------------------------------------------------------------------

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

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  return {
    // Plan gate
    hasAccess,
    currentPlan,

    // Tab management
    activeTab,
    showHistory,

    // Loading / saving state
    loading,
    saving,
    saveError,
    saveSuccess,

    // Contract type & location
    contractType,
    contractDate,
    contractLocation,

    // Lessor / Seller
    lessorRepresentative,
    lessorRepresentativeNIF,
    lessorCompany,
    lessorCIF,
    lessorAddress,

    // Client / Buyer
    clientType,
    clientName,
    clientNIF,
    clientCompany,
    clientCIF,
    clientRepresentative,
    clientRepresentativeNIF,
    clientAddress,

    // Vehicle
    contractVehicle,
    contractVehicleType,
    contractVehiclePlate,
    contractVehicleResidualValue,
    vehicleOptions,
    loadingVehicles,
    onContractVehicleSelected,

    // Rental terms
    contractMonthlyRent,
    contractDeposit,
    contractDuration,
    contractDurationUnit,
    contractPaymentDays,

    // Purchase option
    contractHasPurchaseOption,
    contractPurchasePrice,
    contractPurchaseNotice,
    contractRentMonthsToDiscount,

    // Sale terms
    contractSalePrice,
    contractSalePaymentMethod,
    contractSaleDeliveryConditions,
    contractSaleWarranty,

    // Jurisdiction
    contractJurisdiction,

    // History
    contracts,
    loadingHistory,
    historyError,
    updateContractStatus,

    // Actions
    generateContract,
    resetForm,
    init,
  }
}
