/**
 * Admin Balance Composable
 * CRUD operations for financial transactions (income/expenses)
 */

export type BalanceType = 'ingreso' | 'gasto'
export type BalanceStatus = 'pendiente' | 'pagado' | 'cobrado'
export type BalanceReason =
  | 'venta'
  | 'alquiler'
  | 'exportacion'
  | 'compra'
  | 'taller'
  | 'documentacion'
  | 'servicios'
  | 'salario'
  | 'seguro'
  | 'dividendos'
  | 'almacenamiento'
  | 'bancario'
  | 'efectivo'
  | 'otros'

export interface BalanceEntry {
  id: string
  tipo: BalanceType
  fecha: string
  razon: BalanceReason
  detalle: string | null
  importe: number
  estado: BalanceStatus
  notas: string | null
  factura_url: string | null
  coste_asociado: number | null
  vehicle_id: string | null
  subcategory_id: string | null
  created_at: string
  updated_at: string
  // Joined data
  vehicles?: { brand: string; model: string; year: number } | null
  subcategories?: { name_es: string } | null
}

export interface BalanceFormData {
  tipo: BalanceType
  fecha: string
  razon: BalanceReason
  detalle: string | null
  importe: number
  estado: BalanceStatus
  notas: string | null
  factura_url: string | null
  coste_asociado: number | null
  vehicle_id: string | null
  subcategory_id: string | null
}

export interface BalanceFilters {
  year?: number | null
  tipo?: BalanceType | null
  razon?: BalanceReason | null
  estado?: BalanceStatus | null
  category_id?: string | null
  subcategory_id?: string | null
  search?: string
}

export interface BalanceSummary {
  totalIngresos: number
  totalGastos: number
  balanceNeto: number
  byReason: Record<string, { ingresos: number; gastos: number }>
  byType: Record<string, { ingresos: number; gastos: number; coste: number; beneficio: number }>
}

// Reason labels in Spanish
export const BALANCE_REASONS: Record<BalanceReason, string> = {
  venta: 'Venta',
  alquiler: 'Alquiler',
  exportacion: 'Exportación',
  compra: 'Compra',
  taller: 'Taller',
  documentacion: 'Documentación',
  servicios: 'Servicios',
  salario: 'Salario',
  seguro: 'Seguro',
  dividendos: 'Dividendos',
  almacenamiento: 'Almacenamiento',
  bancario: 'Bancario',
  efectivo: 'Efectivo',
  otros: 'Otros',
}

export const BALANCE_STATUS_LABELS: Record<BalanceStatus, string> = {
  pendiente: 'Pendiente',
  pagado: 'Pagado',
  cobrado: 'Cobrado',
}

export function useAdminBalance() {
  const supabase = useSupabaseClient()

  const entries = ref<BalanceEntry[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  // Available years for filtering (extracted from data)
  const availableYears = ref<number[]>([])

  /**
   * Fetch all balance entries with filters
   */
  async function fetchEntries(filters: BalanceFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('balance')
        .select('*, vehicles(brand, model, year), subcategories(name_es)', { count: 'exact' })
        .order('fecha', { ascending: false })

      // Apply filters
      if (filters.year) {
        const startDate = `${filters.year}-01-01`
        const endDate = `${filters.year}-12-31`
        query = query.gte('fecha', startDate).lte('fecha', endDate)
      }

      if (filters.tipo) {
        query = query.eq('tipo', filters.tipo)
      }

      if (filters.razon) {
        query = query.eq('razon', filters.razon)
      }

      if (filters.estado) {
        query = query.eq('estado', filters.estado)
      }

      if (filters.category_id) {
        query = query.eq('subcategory_id', filters.category_id)
      }

      if (filters.subcategory_id) {
        query = query.eq('subcategory_id', filters.subcategory_id)
      }

      if (filters.search) {
        query = query.or(`detalle.ilike.%${filters.search}%,notas.ilike.%${filters.search}%`)
      }

      const { data, error: err, count } = await query

      if (err) throw err

      entries.value = (data as unknown as BalanceEntry[]) || []
      total.value = count || 0

      // Extract available years
      await fetchAvailableYears()
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error fetching balance entries'
      entries.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Get available years from all entries
   */
  async function fetchAvailableYears() {
    try {
      const { data } = await supabase
        .from('balance')
        .select('fecha')
        .order('fecha', { ascending: false })

      if (data) {
        const years = new Set<number>()
        for (const row of data) {
          const year = new Date(row.fecha).getFullYear()
          years.add(year)
        }
        availableYears.value = Array.from(years).sort((a, b) => b - a)

        // Add current year if not present
        const currentYear = new Date().getFullYear()
        if (!availableYears.value.includes(currentYear)) {
          availableYears.value.unshift(currentYear)
        }
      }
    } catch {
      // Ignore errors, just use current year
      availableYears.value = [new Date().getFullYear()]
    }
  }

  /**
   * Fetch single entry by ID
   */
  async function fetchById(id: string): Promise<BalanceEntry | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('balance')
        .select('*, vehicles(brand, model, year), subcategories(name_es)')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as BalanceEntry
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error fetching entry'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new entry
   */
  async function createEntry(formData: BalanceFormData): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('balance')
        .insert(formData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error creating entry'
      return null
    } finally {
      saving.value = false
    }
  }

  /**
   * Update entry
   */
  async function updateEntry(id: string, formData: Partial<BalanceFormData>): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData = {
        ...formData,
        updated_at: new Date().toISOString(),
      }

      const { error: err } = await supabase
        .from('balance')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error updating entry'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete entry
   */
  async function deleteEntry(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('balance').delete().eq('id', id)

      if (err) throw err

      entries.value = entries.value.filter((e) => e.id !== id)
      total.value--

      return true
    } catch (err: unknown) {
      const supabaseError = err as { message?: string }
      error.value = supabaseError?.message || 'Error deleting entry'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Calculate summary from current entries
   */
  const summary = computed<BalanceSummary>(() => {
    let totalIngresos = 0
    let totalGastos = 0
    const byReason: Record<string, { ingresos: number; gastos: number }> = {}
    const byType: Record<
      string,
      { ingresos: number; gastos: number; coste: number; beneficio: number }
    > = {}

    for (const entry of entries.value) {
      const amount = entry.importe || 0

      if (entry.tipo === 'ingreso') {
        totalIngresos += amount
      } else {
        totalGastos += amount
      }

      // By reason
      if (!byReason[entry.razon]) {
        byReason[entry.razon] = { ingresos: 0, gastos: 0 }
      }
      if (entry.tipo === 'ingreso') {
        byReason[entry.razon].ingresos += amount
      } else {
        byReason[entry.razon].gastos += amount
      }

      // By subcategory (for profit analysis)
      if (entry.subcategory_id && entry.subcategories) {
        const subcatName = entry.subcategories.name_es
        if (!byType[subcatName]) {
          byType[subcatName] = { ingresos: 0, gastos: 0, coste: 0, beneficio: 0 }
        }
        if (entry.tipo === 'ingreso') {
          byType[subcatName].ingresos += amount
          byType[subcatName].coste += entry.coste_asociado || 0
        } else {
          byType[subcatName].gastos += amount
        }
      }
    }

    // Calculate profit percentage by type
    for (const key of Object.keys(byType)) {
      const sub = byType[key]
      if (sub.coste > 0) {
        sub.beneficio = Math.round(((sub.ingresos - sub.coste) / sub.coste) * 100)
      }
    }

    return {
      totalIngresos,
      totalGastos,
      balanceNeto: totalIngresos - totalGastos,
      byReason,
      byType,
    }
  })

  /**
   * Calculate profit percentage for an entry
   */
  function calculateProfit(importe: number, coste: number | null): number | null {
    if (!coste || coste === 0) return null
    return Math.round(((importe - coste) / coste) * 100)
  }

  return {
    entries: readonly(entries),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    availableYears: readonly(availableYears),
    summary,
    fetchEntries,
    fetchById,
    createEntry,
    updateEntry,
    deleteEntry,
    calculateProfit,
    BALANCE_REASONS,
    BALANCE_STATUS_LABELS,
  }
}
