/**
 * Admin Vehicle Detail Composable
 * Extracted from pages/admin/vehiculos/[id].vue
 * Manages all state and logic for the vehicle detail/edit page.
 */
import type { Ref } from 'vue'
import type { VehicleFormData } from '~/composables/admin/useAdminVehicles'
import { useAdminVehicles } from '~/composables/admin/useAdminVehicles'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VehicleImage {
  id: string
  url: string
  thumbnail_url?: string | null
}

export interface SellFormData {
  sale_price: number
  sale_category: string
  buyer_name: string
  buyer_contact: string
}

export interface RentalFormData {
  monthly_price: number
  start_date: string
  end_date: string
  renter_name: string
  renter_contact: string
  notes: string
}

export interface StatusOption {
  value: string
  label: string
}

export interface CategoryOption {
  value: 'venta' | 'alquiler' | 'terceros'
  label: string
}

export interface SubcategoryRecord {
  id: string
  name_es: string
  slug: string
}

export interface TypeRecord {
  id: string
  name_es: string
  slug: string
}

export type FilterOptionValue = string[] | { min?: number; max?: number } | undefined

export interface FilterDefinition {
  id: string
  name: string
  type: string
  label_es: string
  options?: FilterOptionValue
  type_id: string | null
}

export type ExtendedVehicleFormData = VehicleFormData & {
  type_id?: string | null
  plate?: string
  acquisition_cost?: number | null
  min_price?: number | null
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

export const statusOptions: StatusOption[] = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicado' },
  { value: 'rented', label: 'Alquilado' },
  { value: 'workshop', label: 'En taller' },
]

export const categoryOptions: CategoryOption[] = [
  { value: 'venta', label: 'Venta' },
  { value: 'alquiler', label: 'Alquiler' },
  { value: 'terceros', label: 'Terceros' },
]

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

export function useAdminVehicleDetail(vehicleId: Ref<string>) {
  const router = useRouter()
  const supabase = useSupabaseClient()

  const {
    loading,
    saving: composableSaving,
    error: composableError,
    fetchById,
    createVehicle,
    updateVehicle,
    archiveVehicle,
  } = useAdminVehicles()

  // Local saving/error for rental operations that don't use the composable
  const localSaving = ref(false)
  const localError = ref<string | null>(null)

  const saving = computed(() => composableSaving.value || localSaving.value)
  const error = computed(() => composableError.value || localError.value)

  const isNew = computed(() => vehicleId.value === 'new')
  const resolvedVehicleId = computed(() => (isNew.value ? null : vehicleId.value))

  // -----------------------------------------------------------------------
  // Form data
  // -----------------------------------------------------------------------

  const form = ref<ExtendedVehicleFormData>({
    brand: '',
    model: '',
    year: null,
    price: null,
    rental_price: null,
    category: 'venta',
    subcategory_id: null,
    type_id: null,
    is_online: true,
    location: null,
    location_en: null,
    location_country: null,
    location_province: null,
    location_region: null,
    description_es: null,
    description_en: null,
    attributes_json: {},
    status: 'draft',
    featured: false,
    plate: '',
    acquisition_cost: null,
    min_price: null,
  })

  // Images (local state)
  const formImages = ref<VehicleImage[]>([])
  const draggedIndex = ref<number | null>(null)

  // Transaction modal (sell / rent)
  const showTransactionModal = ref(false)
  const txTab = ref<'venta' | 'alquiler'>('venta')

  const sellForm = ref<SellFormData>({
    sale_price: 0,
    sale_category: '',
    buyer_name: '',
    buyer_contact: '',
  })

  const rentalForm = ref<RentalFormData>({
    monthly_price: 0,
    start_date: new Date().toISOString().split('T')[0] ?? '',
    end_date: '',
    renter_name: '',
    renter_contact: '',
    notes: '',
  })

  // -----------------------------------------------------------------------
  // DB-loaded options
  // -----------------------------------------------------------------------

  const subcategories = ref<SubcategoryRecord[]>([])
  const selectedSubcategoryId = ref<string | null>(null)
  const types = ref<TypeRecord[]>([])
  const filterDefinitions = ref<FilterDefinition[]>([])

  const activeFilters = computed(() => {
    if (!form.value.type_id) return []
    return filterDefinitions.value.filter(
      (f) => f.type_id === form.value.type_id || f.type_id === null,
    )
  })

  // -----------------------------------------------------------------------
  // Helper functions
  // -----------------------------------------------------------------------

  function getSliderMin(options: FilterOptionValue): number | undefined {
    if (options && typeof options === 'object' && !Array.isArray(options)) {
      return options.min
    }
    return undefined
  }

  function getSliderMax(options: FilterOptionValue): number | undefined {
    if (options && typeof options === 'object' && !Array.isArray(options)) {
      return options.max
    }
    return undefined
  }

  function formatCurrency(val: number): string {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val)
  }

  function calcBeneficio(salePrice: number, cost: number | null | undefined): string {
    if (!cost || cost === 0) return '\u2014'
    const pct = Math.round(((salePrice - cost) / cost) * 100)
    return `${pct > 0 ? '+' : ''}${pct}%`
  }

  // -----------------------------------------------------------------------
  // Transaction modal
  // -----------------------------------------------------------------------

  function openTransactionModal(tab: 'venta' | 'alquiler') {
    txTab.value = tab
    // Pre-fill rental price from vehicle if available
    if (tab === 'alquiler' && form.value.rental_price) {
      rentalForm.value.monthly_price = form.value.rental_price
    }
    // Pre-fill sale price from vehicle if available
    if (tab === 'venta' && form.value.price) {
      sellForm.value.sale_price = form.value.price
    }
    showTransactionModal.value = true
  }

  // -----------------------------------------------------------------------
  // Data loaders
  // -----------------------------------------------------------------------

  async function loadSubcategories() {
    const { data } = await supabase
      .from('subcategories')
      .select('id, name_es, slug')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })

    subcategories.value = (data as SubcategoryRecord[] | null) || []
  }

  async function loadTypes() {
    const { data } = await supabase
      .from('subcategories')
      .select('id, name_es, slug')
      .order('sort_order', { ascending: true })

    types.value = (data as TypeRecord[] | null) || []
  }

  async function loadAttributes() {
    const { data } = await supabase
      .from('attributes')
      .select('*')
      .eq('status', 'active' as never)
      .order('sort_order', { ascending: true })

    filterDefinitions.value = (data as FilterDefinition[] | null) || []
  }

  async function loadVehicle() {
    if (!resolvedVehicleId.value) return

    const vehicle = await fetchById(resolvedVehicleId.value)
    if (!vehicle) {
      router.push('/admin/vehiculos')
      return
    }

    // Populate form
    form.value = {
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      price: vehicle.price,
      rental_price: vehicle.rental_price,
      category: vehicle.category,
      subcategory_id: vehicle.category_id ?? null,
      type_id: vehicle.type_id,
      is_online: vehicle.is_online ?? true,
      location: vehicle.location,
      location_en: vehicle.location_en ?? null,
      location_country: vehicle.location_country,
      location_province: vehicle.location_province,
      location_region: vehicle.location_region,
      description_es: vehicle.description_es,
      description_en: vehicle.description_en,
      attributes_json: vehicle.attributes_json || {},
      status: vehicle.status,
      featured: vehicle.featured,
      acquisition_cost: vehicle.acquisition_cost,
      min_price: vehicle.min_price,
    }

    // Populate images
    formImages.value = (vehicle.vehicle_images || []).map(
      (img: { id: string; url: string; thumbnail_url?: string | null }) => ({
        id: img.id,
        url: img.url,
        thumbnail_url: img.thumbnail_url,
      }),
    )
  }

  // -----------------------------------------------------------------------
  // Save handler
  // -----------------------------------------------------------------------

  async function handleSave() {
    if (!form.value.brand || !form.value.model) {
      return
    }

    if (isNew.value) {
      const newId = await createVehicle(form.value)
      if (newId) {
        router.push(`/admin/vehiculos/${newId}`)
      }
    } else if (resolvedVehicleId.value) {
      const success = await updateVehicle(resolvedVehicleId.value, form.value)
      if (success) {
        // TODO(2026-02): Show success toast once useToast composable is available
      }
    }
  }

  // -----------------------------------------------------------------------
  // Sell handler (archives vehicle + creates balance entry)
  // -----------------------------------------------------------------------

  async function handleSell() {
    if (!resolvedVehicleId.value) return

    const success = await archiveVehicle(resolvedVehicleId.value, {
      sale_price: sellForm.value.sale_price,
      sale_category: sellForm.value.sale_category,
      buyer_name: sellForm.value.buyer_name,
      buyer_contact: sellForm.value.buyer_contact,
    })

    if (success) {
      // Auto-create balance entry for the sale
      const detalle = `${form.value.brand} ${form.value.model}${form.value.year ? ` (${form.value.year})` : ''}`
      await supabase.from('balance').insert({
        tipo: 'ingreso',
        fecha: new Date().toISOString().split('T')[0],
        razon: sellForm.value.sale_category === 'exportacion' ? 'exportacion' : 'venta',
        detalle: `Venta: ${detalle}`,
        importe: sellForm.value.sale_price,
        estado: 'pendiente',
        coste_asociado: form.value.acquisition_cost || null,
        vehicle_id: resolvedVehicleId.value,
        type_id: form.value.type_id || null,
      } as never)

      showTransactionModal.value = false
      router.push('/admin/vehiculos')
    }
  }

  // -----------------------------------------------------------------------
  // Rent handler (updates vehicle status + creates balance entry + rental record)
  // -----------------------------------------------------------------------

  async function handleRent() {
    if (!resolvedVehicleId.value) return
    localSaving.value = true
    localError.value = null

    try {
      // Update vehicle status to rented
      const { error: updateErr } = await supabase
        .from('vehicles')
        .update({
          status: 'rented',
          updated_at: new Date().toISOString(),
        } as never)
        .eq('id', resolvedVehicleId.value)

      if (updateErr) throw updateErr

      // Add rental record to vehicle's rental_records
      const newRentalRecord = {
        id: crypto.randomUUID(),
        from_date: rentalForm.value.start_date,
        to_date: rentalForm.value.end_date || null,
        amount: rentalForm.value.monthly_price,
        notes:
          [
            rentalForm.value.renter_name ? `Arrendatario: ${rentalForm.value.renter_name}` : '',
            rentalForm.value.renter_contact ? `Contacto: ${rentalForm.value.renter_contact}` : '',
            rentalForm.value.notes || '',
          ]
            .filter(Boolean)
            .join(' | ') || null,
      }

      const existingRecords = form.value.maintenance_records ? [] : [] // rental_records
      await supabase
        .from('vehicles')
        .update({
          rental_records: [...existingRecords, newRentalRecord],
        } as never)
        .eq('id', resolvedVehicleId.value)

      // Auto-create balance entry for the rental
      const detalle = `${form.value.brand} ${form.value.model}${form.value.year ? ` (${form.value.year})` : ''}`
      await supabase.from('balance').insert({
        tipo: 'ingreso',
        fecha: rentalForm.value.start_date,
        razon: 'alquiler',
        detalle: `Alquiler: ${detalle}${rentalForm.value.renter_name ? ` \u2192 ${rentalForm.value.renter_name}` : ''}`,
        importe: rentalForm.value.monthly_price,
        estado: 'pendiente',
        vehicle_id: resolvedVehicleId.value,
        type_id: form.value.type_id || null,
        notas: rentalForm.value.end_date
          ? `Per\u00EDodo: ${rentalForm.value.start_date} a ${rentalForm.value.end_date}`
          : `Inicio: ${rentalForm.value.start_date} (sin fecha fin)`,
      } as never)

      // Insert historico entry
      await supabase.from('historico').insert({
        original_vehicle_id: resolvedVehicleId.value,
        brand: form.value.brand,
        model: form.value.model,
        year: form.value.year,
        type_id: form.value.type_id,
        original_price: form.value.rental_price,
        sale_price: rentalForm.value.monthly_price,
        sale_date: rentalForm.value.start_date,
        sale_category: 'alquiler',
        buyer_name: rentalForm.value.renter_name,
        buyer_contact: rentalForm.value.renter_contact,
      } as never)

      showTransactionModal.value = false
      // Reload to show updated status
      await loadVehicle()
      form.value.status = 'rented'
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      localError.value = supabaseError?.message || 'Error processing rental'
    } finally {
      localSaving.value = false
    }
  }

  // -----------------------------------------------------------------------
  // Image handlers
  // -----------------------------------------------------------------------

  function handleImageUpload(event: Event) {
    const input = event.target as HTMLInputElement
    if (!input.files) return

    // TODO(2026-02): Implement Cloudinary upload via useCloudinaryUpload composable
    // For now, just show placeholder
    for (const file of input.files) {
      if (formImages.value.length >= 10) break

      const url = URL.createObjectURL(file)
      formImages.value.push({
        id: `temp-${Date.now()}-${Math.random()}`,
        url,
        thumbnail_url: url,
      })
    }

    input.value = ''
  }

  function removeImage(index: number) {
    formImages.value.splice(index, 1)
  }

  function handleDragStart(index: number) {
    draggedIndex.value = index
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex.value === null || draggedIndex.value === targetIndex) return

    const item = formImages.value[draggedIndex.value]
    if (!item) return

    formImages.value.splice(draggedIndex.value, 1)
    formImages.value.splice(targetIndex, 0, item)
    draggedIndex.value = null
  }

  // -----------------------------------------------------------------------
  // Init (called from onMounted in the page)
  // -----------------------------------------------------------------------

  async function init() {
    await Promise.all([loadSubcategories(), loadTypes(), loadAttributes()])

    if (!isNew.value) {
      await loadVehicle()
    }
  }

  // -----------------------------------------------------------------------
  // Return
  // -----------------------------------------------------------------------

  return {
    // State
    loading,
    saving,
    error,
    isNew,
    form,
    formImages,

    // Transaction modal
    showTransactionModal,
    txTab,
    sellForm,
    rentalForm,

    // DB-loaded options
    subcategories,
    selectedSubcategoryId,
    types,
    filterDefinitions,
    activeFilters,

    // Helpers
    getSliderMin,
    getSliderMax,
    formatCurrency,
    calcBeneficio,

    // Actions
    openTransactionModal,
    handleSave,
    handleSell,
    handleRent,
    handleImageUpload,
    removeImage,
    handleDragStart,
    handleDrop,

    // Init
    init,
  }
}
