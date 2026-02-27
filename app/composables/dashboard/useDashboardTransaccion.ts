/**
 * useDashboardTransaccion
 *
 * All reactive state, computed properties, and functions for the
 * Rent / Sell Transaction page (/dashboard/vehiculos/[id]/transaccion).
 *
 * The composable does NOT call onMounted — lifecycle management stays in the page.
 */

// ---------------------------------------------------------------------------
// Types (module-scoped — only used by this feature)
// ---------------------------------------------------------------------------

export type TabKey = 'rent' | 'sell'

export type RentFormField =
  | 'from_date'
  | 'to_date'
  | 'client_name'
  | 'client_contact'
  | 'amount'
  | 'invoice_url'
  | 'notes'

export type SellFormField =
  | 'sale_date'
  | 'buyer_name'
  | 'buyer_contact'
  | 'sale_price'
  | 'invoice_url'
  | 'exportacion'

export interface VehicleData {
  id: string
  brand: string
  model: string
  year: number | null
  price: number | null
  acquisition_cost: number | null
  status: string | null
  dealer_id: string | null
  maintenance_records: unknown
  rental_records: unknown
}

export interface RentFormData {
  from_date: string
  to_date: string
  client_name: string
  client_contact: string
  amount: number
  invoice_url: string
  notes: string
}

export interface SellFormData {
  sale_date: string
  buyer_name: string
  buyer_contact: string
  sale_price: number
  invoice_url: string
  exportacion: boolean
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useDashboardTransaccion(vehicleId: string) {
  const { t } = useI18n()
  const router = useRouter()
  const supabase = useSupabaseClient()
  const { userId } = useAuth()
  const { dealerProfile, loadDealer } = useDealerDashboard()

  // --------------- State ---------------
  const activeTab = ref<TabKey>('rent')

  const loading = ref(true)
  const submitting = ref(false)
  const error = ref<string | null>(null)
  const successMessage = ref<string | null>(null)

  const vehicle = ref<VehicleData | null>(null)

  const rentForm = ref<RentFormData>({
    from_date: '',
    to_date: '',
    client_name: '',
    client_contact: '',
    amount: 0,
    invoice_url: '',
    notes: '',
  })

  const sellForm = ref<SellFormData>({
    sale_date: '',
    buyer_name: '',
    buyer_contact: '',
    sale_price: 0,
    invoice_url: '',
    exportacion: false,
  })

  // --------------- Computed ---------------
  const vehicleTitle = computed(() => {
    if (!vehicle.value) return ''
    return `${vehicle.value.brand} ${vehicle.value.model}`
  })

  const totalCost = computed(() => {
    if (!vehicle.value) return 0

    const acquisitionCost = vehicle.value.acquisition_cost || 0

    let maintenanceCost = 0
    if (vehicle.value.maintenance_records && Array.isArray(vehicle.value.maintenance_records)) {
      maintenanceCost = (vehicle.value.maintenance_records as Array<{ cost?: number }>).reduce(
        (sum: number, r: { cost?: number }) => sum + (r.cost || 0),
        0,
      )
    }

    let rentalIncome = 0
    if (vehicle.value.rental_records && Array.isArray(vehicle.value.rental_records)) {
      rentalIncome = (vehicle.value.rental_records as Array<{ amount?: number }>).reduce(
        (sum: number, r: { amount?: number }) => sum + (r.amount || 0),
        0,
      )
    }

    return acquisitionCost + maintenanceCost - rentalIncome
  })

  const estimatedBenefit = computed(() => {
    return sellForm.value.sale_price - totalCost.value
  })

  // --------------- Load data ---------------
  async function loadVehicle(): Promise<void> {
    loading.value = true
    error.value = null

    try {
      const dealer = dealerProfile.value || (await loadDealer())
      if (!dealer) {
        error.value = t('dashboard.vehicles.notFound')
        return
      }

      const { data, error: err } = await supabase
        .from('vehicles')
        .select(
          'id, brand, model, year, price, acquisition_cost, status, dealer_id, maintenance_records, rental_records',
        )
        .eq('id', vehicleId)
        .eq('dealer_id', dealer.id)
        .single()

      if (err || !data) {
        error.value = t('dashboard.vehicles.notFound')
        return
      }

      vehicle.value = data as never as VehicleData
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('common.error')
    } finally {
      loading.value = false
    }
  }

  // --------------- Rent submission ---------------
  async function submitRental(): Promise<void> {
    if (!vehicle.value) return

    if (!rentForm.value.from_date || !rentForm.value.to_date) {
      error.value = t('dashboard.transaction.rent.dateRequired')
      return
    }
    if (!rentForm.value.client_name) {
      error.value = t('dashboard.transaction.rent.clientRequired')
      return
    }
    if (rentForm.value.amount <= 0) {
      error.value = t('dashboard.transaction.rent.amountRequired')
      return
    }

    submitting.value = true
    error.value = null
    successMessage.value = null

    try {
      const existingRecords = Array.isArray(vehicle.value.rental_records)
        ? (vehicle.value.rental_records as Array<Record<string, unknown>>)
        : []

      const newRecord = {
        from_date: rentForm.value.from_date,
        to_date: rentForm.value.to_date,
        client_name: rentForm.value.client_name,
        client_contact: rentForm.value.client_contact,
        amount: rentForm.value.amount,
        invoice_url: rentForm.value.invoice_url || null,
        notes: rentForm.value.notes || null,
        created_at: new Date().toISOString(),
      }

      const updatedRecords = [...existingRecords, newRecord]

      const { error: balanceErr } = await supabase.from('balance').insert({
        vehicle_id: vehicle.value.id,
        tipo: 'ingreso' as never,
        razon: 'alquiler' as never,
        importe: rentForm.value.amount,
        fecha: rentForm.value.from_date,
        detalle: `${t('dashboard.transaction.rent.title')}: ${rentForm.value.client_name}`,
        created_by: userId.value,
      } as never)

      if (balanceErr) throw balanceErr

      const { error: vehicleErr } = await supabase
        .from('vehicles')
        .update({
          status: 'rented' as never,
          rental_records: updatedRecords as never,
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', vehicle.value.id)

      if (vehicleErr) throw vehicleErr

      successMessage.value = t('dashboard.transaction.rent.success')
      rentForm.value = {
        from_date: '',
        to_date: '',
        client_name: '',
        client_contact: '',
        amount: 0,
        invoice_url: '',
        notes: '',
      }

      await loadVehicle()
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('common.error')
    } finally {
      submitting.value = false
    }
  }

  // --------------- Sell submission ---------------
  async function submitSale(): Promise<void> {
    if (!vehicle.value) return

    if (!sellForm.value.sale_date) {
      error.value = t('dashboard.transaction.sell.dateRequired')
      return
    }
    if (!sellForm.value.buyer_name) {
      error.value = t('dashboard.transaction.sell.buyerRequired')
      return
    }
    if (sellForm.value.sale_price <= 0) {
      error.value = t('dashboard.transaction.sell.priceRequired')
      return
    }

    submitting.value = true
    error.value = null
    successMessage.value = null

    try {
      const { error: balanceErr } = await supabase.from('balance').insert({
        vehicle_id: vehicle.value.id,
        tipo: 'ingreso' as never,
        razon: (sellForm.value.exportacion ? 'exportacion' : 'venta') as never,
        importe: sellForm.value.sale_price,
        fecha: sellForm.value.sale_date,
        detalle: `${t('dashboard.transaction.sell.title')}: ${sellForm.value.buyer_name}`,
        created_by: userId.value,
      } as never)

      if (balanceErr) throw balanceErr

      const { error: vehicleErr } = await supabase
        .from('vehicles')
        .update({
          status: 'sold' as never,
          sold_at: new Date().toISOString(),
          sold_price_cents: Math.round(sellForm.value.sale_price * 100),
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', vehicle.value.id)

      if (vehicleErr) throw vehicleErr

      successMessage.value = t('dashboard.transaction.sell.success')
      setTimeout(() => {
        router.push('/dashboard/vehiculos')
      }, 2000)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : t('common.error')
    } finally {
      submitting.value = false
    }
  }

  // --------------- Public API ---------------
  return {
    // State
    activeTab,
    loading,
    submitting,
    error,
    successMessage,
    vehicle,
    rentForm,
    sellForm,

    // Computed
    vehicleTitle,
    totalCost,
    estimatedBenefit,

    // Actions
    init: loadVehicle,
    submitRental,
    submitSale,
  }
}
