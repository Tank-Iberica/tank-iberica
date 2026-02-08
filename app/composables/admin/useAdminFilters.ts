/**
 * Admin Filters Composable
 * Full CRUD operations for filter definitions in admin panel
 */

export type FilterType = 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
export type FilterStatus = 'published' | 'draft' | 'archived'

export interface AdminFilter {
  id: string
  type_id: string | null
  name: string
  type: FilterType
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: {
    default_value?: string | number
    extra_filters?: string[]  // For tick type: filters that appear when active
    hides?: string[]          // For tick type: filters that hide when active
    min?: number              // For slider type
    max?: number              // For slider type
    choices?: string[]        // For desplegable type
    [key: string]: unknown
  }
  is_extra: boolean
  is_hidden: boolean
  status: FilterStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export interface FilterFormData {
  name: string
  type: FilterType
  label_es: string | null
  label_en: string | null
  unit: string | null
  default_value: string | null
  extra_filters: string[]
  hides: string[]
  status: FilterStatus
  is_extra: boolean
  is_hidden: boolean
}

export const FILTER_TYPES: { value: FilterType; label: string; description: string }[] = [
  { value: 'caja', label: 'Caja (texto libre)', description: 'Input de texto para valores libres' },
  { value: 'desplegable', label: 'Desplegable', description: 'Select con opciones predefinidas' },
  { value: 'desplegable_tick', label: 'Desplegable con ticks', description: 'Select con opciones múltiples' },
  { value: 'tick', label: 'Tick (sí/no)', description: 'Checkbox que puede mostrar/ocultar otros filtros' },
  { value: 'slider', label: 'Slider (rango)', description: 'Rango numérico con min/max' },
  { value: 'calc', label: 'Calc (+/-)', description: 'Botones incrementar/decrementar' },
]

export const FILTER_STATUSES: { value: FilterStatus; label: string; description: string }[] = [
  { value: 'published', label: 'Publicado', description: 'Aparece en filtros y características' },
  { value: 'draft', label: 'Oculto', description: 'Solo en características del vehículo' },
  { value: 'archived', label: 'Inactivo', description: 'No aparece en ningún sitio' },
]

export function useAdminFilters() {
  const supabase = useSupabaseClient()

  const filters = ref<AdminFilter[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all filter definitions
   */
  async function fetchFilters() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('filter_definitions')
        .select('*')
        .order('sort_order', { ascending: true })

      if (err) throw err

      filters.value = (data as unknown as AdminFilter[]) || []
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching filters'
      filters.value = []
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Fetch single filter by ID
   */
  async function fetchById(id: string): Promise<AdminFilter | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('filter_definitions')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminFilter
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching filter'
      return null
    }
    finally {
      loading.value = false
    }
  }

  /**
   * Create new filter
   */
  async function createFilter(formData: FilterFormData): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      // Get max sort_order
      const maxOrder = filters.value.reduce((max, f) => Math.max(max, f.sort_order), 0)

      const options: AdminFilter['options'] = {}
      if (formData.default_value) options.default_value = formData.default_value
      if (formData.type === 'tick') {
        if (formData.extra_filters.length) options.extra_filters = formData.extra_filters
        if (formData.hides.length) options.hides = formData.hides
      }

      const insertData = {
        name: formData.name,
        type: formData.type,
        label_es: formData.label_es || formData.name,
        label_en: formData.label_en,
        unit: formData.unit,
        options,
        is_extra: formData.is_extra,
        is_hidden: formData.is_hidden,
        status: formData.status,
        sort_order: maxOrder + 1,
      }

      const { data, error: err } = await supabase
        .from('filter_definitions')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating filter'
      return null
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Update existing filter
   */
  async function updateFilter(id: string, formData: Partial<FilterFormData>): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      // Get current filter to merge options
      const current = filters.value.find(f => f.id === id)
      const currentOptions = current?.options || {}

      const updateData: Record<string, unknown> = {}

      if (formData.name !== undefined) {
        updateData.name = formData.name
        if (!formData.label_es) updateData.label_es = formData.name
      }
      if (formData.type !== undefined) updateData.type = formData.type
      if (formData.label_es !== undefined) updateData.label_es = formData.label_es
      if (formData.label_en !== undefined) updateData.label_en = formData.label_en
      if (formData.unit !== undefined) updateData.unit = formData.unit
      if (formData.is_extra !== undefined) updateData.is_extra = formData.is_extra
      if (formData.is_hidden !== undefined) updateData.is_hidden = formData.is_hidden
      if (formData.status !== undefined) updateData.status = formData.status

      // Merge options
      const options: AdminFilter['options'] = { ...currentOptions }
      if (formData.default_value !== undefined) {
        if (formData.default_value) options.default_value = formData.default_value
        else delete options.default_value
      }
      if (formData.extra_filters !== undefined) {
        if (formData.extra_filters.length) options.extra_filters = formData.extra_filters
        else delete options.extra_filters
      }
      if (formData.hides !== undefined) {
        if (formData.hides.length) options.hides = formData.hides
        else delete options.hides
      }
      updateData.options = options

      const { error: err } = await supabase
        .from('filter_definitions')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating filter'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Delete filter
   */
  async function deleteFilter(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('filter_definitions')
        .delete()
        .eq('id', id)

      if (err) throw err

      // Remove from local list
      filters.value = filters.value.filter(f => f.id !== id)

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting filter'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Move filter up in order
   */
  async function moveUp(id: string): Promise<boolean> {
    const index = filters.value.findIndex(f => f.id === id)
    if (index <= 0) return false

    const current = filters.value[index]
    const previous = filters.value[index - 1]

    saving.value = true
    try {
      // Swap sort_order values
      await supabase
        .from('filter_definitions')
        .update({ sort_order: previous.sort_order } as never)
        .eq('id', current.id)

      await supabase
        .from('filter_definitions')
        .update({ sort_order: current.sort_order } as never)
        .eq('id', previous.id)

      await fetchFilters()
      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error reordering filters'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Move filter down in order
   */
  async function moveDown(id: string): Promise<boolean> {
    const index = filters.value.findIndex(f => f.id === id)
    if (index < 0 || index >= filters.value.length - 1) return false

    const current = filters.value[index]
    const next = filters.value[index + 1]

    saving.value = true
    try {
      // Swap sort_order values
      await supabase
        .from('filter_definitions')
        .update({ sort_order: next.sort_order } as never)
        .eq('id', current.id)

      await supabase
        .from('filter_definitions')
        .update({ sort_order: current.sort_order } as never)
        .eq('id', next.id)

      await fetchFilters()
      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error reordering filters'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Get filters available for extra/hide selection (excluding current)
   */
  function getAvailableFilters(excludeId?: string) {
    return filters.value.filter(f => f.id !== excludeId && f.status !== 'archived')
  }

  return {
    filters: readonly(filters),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchFilters,
    fetchById,
    createFilter,
    updateFilter,
    deleteFilter,
    moveUp,
    moveDown,
    getAvailableFilters,
  }
}
