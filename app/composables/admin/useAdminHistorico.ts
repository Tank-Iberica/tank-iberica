/**
 * Admin Historico Composable
 * CRUD operations for sold vehicles archive
 */

export interface HistoricoEntry {
  id: string
  original_vehicle_id: string | null
  // Vehicle snapshot
  brand: string
  model: string
  year: number | null
  type_id: string | null
  // Sale info
  original_price: number | null
  sale_price: number | null
  sale_date: string | null
  sale_category: 'venta' | 'terceros' | 'exportacion' | null
  buyer_name: string | null
  buyer_contact: string | null
  // Cost tracking
  acquisition_cost: number | null
  total_maintenance: number | null
  total_rental_income: number | null
  total_cost: number | null
  benefit: number | null
  benefit_percent: number | null
  // Full data snapshot
  vehicle_data: Record<string, unknown> | null
  maintenance_history: MaintenanceRecord[]
  rental_history: RentalRecord[]
  // Timestamps
  archived_at: string
  created_at: string
  // Joined data
  types?: { name_es: string } | null
}

export interface MaintenanceRecord {
  id: string
  date: string
  reason: string
  cost: number
  invoice_url?: string
}

export interface RentalRecord {
  id: string
  from_date: string
  to_date: string
  amount: number
  notes?: string
}

export interface HistoricoFilters {
  year?: number | null
  sale_category?: string | null
  subcategory_id?: string | null
  type_id?: string | null
  brand?: string | null
  search?: string
}

export interface HistoricoSummary {
  totalVentas: number
  totalIngresos: number
  totalBeneficio: number
  avgBeneficioPercent: number
  byCategory: Record<string, { count: number; ingresos: number; beneficio: number }>
  byType: Record<string, { count: number; ingresos: number; beneficio: number }>
}

export const SALE_CATEGORIES: Record<string, string> = {
  venta: 'Venta',
  terceros: 'Terceros',
  exportacion: 'Exportación',
}

export function useAdminHistorico() {
  const supabase = useSupabaseClient()

  const entries = ref<HistoricoEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // Available years and brands for filtering
  const availableYears = ref<number[]>([])
  const availableBrands = ref<string[]>([])

  /**
   * Fetch all historico entries with filters
   */
  async function fetchEntries(filters: HistoricoFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('historico')
        .select('*, types(name_es)', { count: 'exact' })
        .order('sale_date', { ascending: false })

      // Apply filters
      if (filters.year) {
        const startDate = `${filters.year}-01-01`
        const endDate = `${filters.year}-12-31`
        query = query.gte('sale_date', startDate).lte('sale_date', endDate)
      }

      if (filters.sale_category) {
        query = query.eq('sale_category', filters.sale_category)
      }

      if (filters.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id)
      }

      if (filters.type_id) {
        query = query.eq('type_id', filters.type_id)
      }

      if (filters.brand) {
        query = query.ilike('brand', `%${filters.brand}%`)
      }

      if (filters.search) {
        query = query.or(`brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%,buyer_name.ilike.%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      entries.value = (data as unknown as HistoricoEntry[]) || []
      total.value = count || 0

      // Extract available years and brands
      await fetchFiltersData()
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error fetching historico entries'
      entries.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Get available years and brands from all entries
   */
  async function fetchFiltersData() {
    try {
      const { data } = await supabase
        .from('historico')
        .select('sale_date, brand')
        .order('sale_date', { ascending: false })

      if (data) {
        const years = new Set<number>()
        const brands = new Set<string>()

        for (const row of data) {
          if (row.sale_date) {
            years.add(new Date(row.sale_date).getFullYear())
          }
          if (row.brand) {
            brands.add(row.brand)
          }
        }

        availableYears.value = Array.from(years).sort((a, b) => b - a)
        availableBrands.value = Array.from(brands).sort()

        // Add current year if not present
        const currentYear = new Date().getFullYear()
        if (!availableYears.value.includes(currentYear)) {
          availableYears.value.unshift(currentYear)
        }
      }
    }
    catch {
      availableYears.value = [new Date().getFullYear()]
      availableBrands.value = []
    }
  }

  /**
   * Fetch single entry by ID
   */
  async function fetchById(id: string): Promise<HistoricoEntry | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('historico')
        .select('*, types(name_es)')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as HistoricoEntry
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error fetching entry'
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Restore vehicle from historico back to active catalog
   * This creates a new vehicle and deletes the historico entry
   */
  async function restoreVehicle(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      // Get the historico entry
      const entry = await fetchById(id)
      if (!entry) {
        throw new Error('Entry not found')
      }

      // Extract vehicle data from snapshot or rebuild from fields
      const vehicleData = entry.vehicle_data || {
        brand: entry.brand,
        model: entry.model,
        year: entry.year,
        type_id: entry.type_id,
        price: entry.original_price,
        status: 'draft', // Restored as draft
        acquisition_cost: entry.acquisition_cost,
      }

      // Create new vehicle from the data
      const { error: insertErr } = await supabase
        .from('vehicles')
        .insert({
          ...vehicleData,
          status: 'draft', // Always restore as draft
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)

      if (insertErr) throw insertErr

      // Delete related balance entry if exists
      if (entry.original_vehicle_id) {
        await supabase
          .from('balance')
          .delete()
          .eq('vehicle_id', entry.original_vehicle_id)
          .eq('razon', 'venta')
      }

      // Delete the historico entry
      const { error: deleteErr } = await supabase
        .from('historico')
        .delete()
        .eq('id', id)

      if (deleteErr) throw deleteErr

      // Remove from local state
      entries.value = entries.value.filter(e => e.id !== id)
      total.value--

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error restoring vehicle'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Delete entry permanently
   */
  async function deleteEntry(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('historico')
        .delete()
        .eq('id', id)

      if (err) throw err

      entries.value = entries.value.filter(e => e.id !== id)
      total.value--

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error deleting entry'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Calculate summary from current entries
   */
  const summary = computed<HistoricoSummary>(() => {
    let totalVentas = 0
    let totalIngresos = 0
    let totalBeneficio = 0
    let totalBeneficioPercent = 0
    let countWithBenefit = 0
    const byCategory: Record<string, { count: number; ingresos: number; beneficio: number }> = {}
    const byType: Record<string, { count: number; ingresos: number; beneficio: number }> = {}

    for (const entry of entries.value) {
      totalVentas++
      const salePrice = entry.sale_price || 0
      const benefit = entry.benefit || 0

      totalIngresos += salePrice
      totalBeneficio += benefit

      if (entry.benefit_percent !== null) {
        totalBeneficioPercent += entry.benefit_percent
        countWithBenefit++
      }

      // By category
      const cat = entry.sale_category || 'otros'
      if (!byCategory[cat]) {
        byCategory[cat] = { count: 0, ingresos: 0, beneficio: 0 }
      }
      byCategory[cat].count++
      byCategory[cat].ingresos += salePrice
      byCategory[cat].beneficio += benefit

      // By type
      if (entry.types) {
        const subcatName = entry.types.name_es
        if (!byType[subcatName]) {
          byType[subcatName] = { count: 0, ingresos: 0, beneficio: 0 }
        }
        byType[subcatName].count++
        byType[subcatName].ingresos += salePrice
        byType[subcatName].beneficio += benefit
      }
    }

    return {
      totalVentas,
      totalIngresos,
      totalBeneficio,
      avgBeneficioPercent: countWithBenefit > 0 ? Math.round(totalBeneficioPercent / countWithBenefit) : 0,
      byCategory,
      byType,
    }
  })

  return {
    entries: readonly(entries),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    availableYears: readonly(availableYears),
    availableBrands: readonly(availableBrands),
    summary,
    fetchEntries,
    fetchById,
    restoreVehicle,
    deleteEntry,
    SALE_CATEGORIES,
  }
}
