import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Admin Filters Composable (migrated: filter_definitions table → attributes table)
 * Full CRUD operations for attribute definitions (formerly "filter definitions") in admin panel
 */

export type FilterType = 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
export type FilterStatus = 'published' | 'draft' | 'archived'

export interface AdminFilter {
  id: string
  subcategory_id: string | null
  name: string
  type: FilterType
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: {
    default_value?: string | number
    extra_filters?: string[] // For tick type: filters that appear when active
    hides?: string[] // For tick type: filters that hide when active
    min?: number // For slider type
    max?: number // For slider type
    choices?: string[] // For desplegable type
    choices_source?: ChoicesSource // For desplegable: where options come from
    step?: number // For calc type: increment/decrement step
    [key: string]: unknown
  }
  is_extra: boolean
  is_hidden: boolean
  status: FilterStatus
  sort_order: number
  created_at: string
  updated_at: string
}

export type ChoicesSource = 'manual' | 'auto' | 'both'

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
  // Desplegable / desplegable_tick
  choices: string[]
  choices_source: ChoicesSource
  // Calc
  step: number | null
}

export const FILTER_TYPE_VALUES: FilterType[] = [
  'caja',
  'desplegable',
  'desplegable_tick',
  'tick',
  'slider',
  'calc',
]
export const FILTER_STATUS_VALUES: FilterStatus[] = ['published', 'draft', 'archived']

/** Use inside composable for translated labels. For raw values use FILTER_TYPE_VALUES. */
export function getFilterTypeOptions(t: (key: string) => string) {
  return FILTER_TYPE_VALUES.map((value) => ({
    value,
    label: t(`admin.filterTypes.${value}`),
  }))
}

export function getFilterStatusOptions(t: (key: string) => string) {
  return FILTER_STATUS_VALUES.map((value) => ({
    value,
    label: t(`admin.filterStatuses.${value}`),
  }))
}

/** Fields that set-or-delete based on truthiness */
const OPTION_MERGE_KEYS = ['default_value', 'extra_filters', 'hides', 'choices', 'step'] as const

function mergeFilterOptions(
  currentOptions: AdminFilter['options'],
  formData: Partial<FilterFormData>,
): AdminFilter['options'] {
  const options: AdminFilter['options'] = { ...currentOptions }
  for (const key of OPTION_MERGE_KEYS) {
    if (formData[key] === undefined) continue
    const val = formData[key]
    const hasValue = Array.isArray(val) ? val.length : Boolean(val)
    if (hasValue) {
      ;(options as Record<string, unknown>)[key] = val
    } else {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- merging JSONB options by key
      delete (options as Record<string, unknown>)[key]
    }
  }
  if (formData.choices_source !== undefined) options.choices_source = formData.choices_source
  return options
}

function buildFilterOptions(formData: FilterFormData): AdminFilter['options'] {
  const options: AdminFilter['options'] = {}
  if (formData.default_value) options.default_value = formData.default_value

  const typeHandlers: Partial<Record<FilterType, () => void>> = {
    tick: () => {
      if (formData.extra_filters.length) options.extra_filters = formData.extra_filters
      if (formData.hides.length) options.hides = formData.hides
    },
    desplegable: () => {
      options.choices_source = formData.choices_source || 'manual'
      if (formData.choices.length) options.choices = formData.choices
    },
    desplegable_tick: () => {
      options.choices_source = formData.choices_source || 'manual'
      if (formData.choices.length) options.choices = formData.choices
    },
    calc: () => {
      if (formData.step) options.step = formData.step
    },
  }

  typeHandlers[formData.type]?.()
  return options
}

function buildInsertData(formData: FilterFormData, maxOrder: number): Record<string, unknown> {
  return {
    name: formData.name,
    type: formData.type,
    label_es: formData.label_es || formData.name,
    label_en: formData.label_en,
    unit: formData.unit,
    options: buildFilterOptions(formData),
    is_extra: formData.is_extra,
    is_hidden: formData.is_hidden,
    status: formData.status,
    sort_order: maxOrder + 1,
  }
}

function buildUpdatePayload(
  formData: Partial<FilterFormData>,
  currentOptions: AdminFilter['options'],
): Record<string, unknown> {
  const updateData: Record<string, unknown> = {}
  const directFields: (keyof FilterFormData)[] = [
    'type',
    'label_en',
    'unit',
    'is_extra',
    'is_hidden',
    'status',
  ]
  for (const key of directFields) {
    if (formData[key] !== undefined) updateData[key] = formData[key]
  }
  if (formData.name !== undefined) {
    updateData.name = formData.name
    updateData.label_es = formData.name
  }
  updateData.options = mergeFilterOptions(currentOptions, formData)
  return updateData
}

function toErrorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

async function swapSortOrder(
  supabase: SupabaseClient,
  idA: string,
  orderA: number,
  idB: string,
  orderB: number,
): Promise<void> {
  await supabase
    .from('attributes')
    .update({ sort_order: orderB } as never)
    .eq('id', idA)
  await supabase
    .from('attributes')
    .update({ sort_order: orderA } as never)
    .eq('id', idB)
}

export function useAdminFilters() {
  const supabase = useSupabaseClient()

  const filters = ref<AdminFilter[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  async function fetchFilters() {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('attributes')
        .select(
          'id, subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order, created_at, updated_at',
        )
        .order('sort_order', { ascending: true })
      if (err) throw err
      filters.value = (data as unknown as AdminFilter[]) || []
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error fetching filters')
      filters.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchById(id: string): Promise<AdminFilter | null> {
    loading.value = true
    error.value = null
    try {
      const { data, error: err } = await supabase
        .from('attributes')
        .select(
          'id, subcategory_id, name, type, label_es, label_en, unit, options, is_extra, is_hidden, status, sort_order, created_at, updated_at',
        )
        .eq('id', id)
        .single()
      if (err) throw err
      return data as unknown as AdminFilter
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error fetching filter')
      return null
    } finally {
      loading.value = false
    }
  }

  async function createFilter(formData: FilterFormData): Promise<string | null> {
    saving.value = true
    error.value = null
    try {
      const maxOrder = filters.value.reduce((max, f) => Math.max(max, f.sort_order), 0)
      const { data, error: err } = await supabase
        .from('attributes')
        .insert(buildInsertData(formData, maxOrder) as never)
        .select('id')
        .single()
      if (err) throw err
      return (data as { id: string } | null)?.id || null
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error creating filter')
      return null
    } finally {
      saving.value = false
    }
  }

  async function updateFilter(id: string, formData: Partial<FilterFormData>): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const current = filters.value.find((f) => f.id === id)
      const payload = buildUpdatePayload(formData, current?.options || {})
      const { error: err } = await supabase
        .from('attributes')
        .update(payload as never)
        .eq('id', id)
      if (err) throw err
      return true
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error updating filter')
      return false
    } finally {
      saving.value = false
    }
  }

  async function deleteFilter(id: string): Promise<boolean> {
    saving.value = true
    error.value = null
    try {
      const { error: err } = await supabase.from('attributes').delete().eq('id', id)
      if (err) throw err
      filters.value = filters.value.filter((f) => f.id !== id)
      return true
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error deleting filter')
      return false
    } finally {
      saving.value = false
    }
  }

  async function moveUp(id: string): Promise<boolean> {
    const index = filters.value.findIndex((f) => f.id === id)
    if (index <= 0) return false
    saving.value = true
    try {
      await swapSortOrder(
        supabase,
        filters.value[index]!.id,
        filters.value[index]!.sort_order,
        filters.value[index - 1]!.id,
        filters.value[index - 1]!.sort_order,
      )
      await fetchFilters()
      return true
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error reordering filters')
      return false
    } finally {
      saving.value = false
    }
  }

  async function moveDown(id: string): Promise<boolean> {
    const index = filters.value.findIndex((f) => f.id === id)
    if (index < 0 || index >= filters.value.length - 1) return false
    saving.value = true
    try {
      await swapSortOrder(
        supabase,
        filters.value[index]!.id,
        filters.value[index]!.sort_order,
        filters.value[index + 1]!.id,
        filters.value[index + 1]!.sort_order,
      )
      await fetchFilters()
      return true
    } catch (err: unknown) {
      error.value = toErrorMessage(err, 'Error reordering filters')
      return false
    } finally {
      saving.value = false
    }
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
    getAvailableFilters: (excludeId?: string) =>
      filters.value.filter((f) => f.id !== excludeId && f.status !== 'archived'),
  }
}
