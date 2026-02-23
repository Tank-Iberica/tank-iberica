/**
 * Contract Form Composable
 * Manages contract form state and operations
 */

type ContractType = 'arrendamiento' | 'compraventa'
type ClientType = 'persona' | 'empresa'

export interface VehicleOption {
  id: string
  label: string
  plate: string
  vehicleType: string
}

export function useContractForm() {
  const supabase = useSupabaseClient()

  // Contract type
  const contractType = ref<ContractType>('arrendamiento')
  const contractDate = ref(new Date().toISOString().split('T')[0])
  const contractLocation = ref('')

  // Lessor / Seller data
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

  async function loadVehicleOptions(dealerId: string): Promise<void> {
    if (!dealerId) return

    loadingVehicles.value = true
    try {
      const { data } = (await supabase
        .from('vehicles')
        .select('id, brand, model, plate, year, subcategory_id')
        .eq('dealer_id', dealerId)
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

  function prefillFromDealer(dealer: Record<string, unknown>): void {
    if (!dealer) return

    lessorCompany.value =
      typeof dealer.legal_name === 'string' && dealer.legal_name
        ? dealer.legal_name
        : typeof dealer.company_name === 'string'
          ? dealer.company_name
          : dealer.company_name &&
              typeof dealer.company_name === 'object' &&
              'es' in (dealer.company_name as Record<string, string>)
            ? (dealer.company_name as Record<string, string>).es
            : ''

    lessorCIF.value = typeof dealer.cif_nif === 'string' ? dealer.cif_nif : ''

    // Location data
    if (dealer.location_data && typeof dealer.location_data === 'object') {
      const loc = dealer.location_data as Record<string, string>
      lessorAddress.value = loc.es || loc.en || ''
      if (!contractLocation.value) {
        contractLocation.value = loc.es || loc.en || ''
      }
      if (!contractJurisdiction.value) {
        contractJurisdiction.value = loc.es || loc.en || ''
      }
    } else if (typeof dealer.location === 'string') {
      lessorAddress.value = dealer.location
      if (!contractLocation.value) contractLocation.value = dealer.location
      if (!contractJurisdiction.value) contractJurisdiction.value = dealer.location
    }
  }

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
  }

  return {
    // State
    contractType,
    contractDate,
    contractLocation,
    lessorRepresentative,
    lessorRepresentativeNIF,
    lessorCompany,
    lessorCIF,
    lessorAddress,
    clientType,
    clientName,
    clientNIF,
    clientCompany,
    clientCIF,
    clientRepresentative,
    clientRepresentativeNIF,
    clientAddress,
    contractVehicle,
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
    contractSaleDeliveryConditions,
    contractSaleWarranty,
    contractJurisdiction,
    vehicleOptions,
    loadingVehicles,
    // Methods
    loadVehicleOptions,
    onContractVehicleSelected,
    prefillFromDealer,
    resetForm,
  }
}
