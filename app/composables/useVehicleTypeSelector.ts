/**
 * Shared composable for subcategory → type → dynamic filters cascade.
 * Used by AdvertiseModal and DemandModal.
 * Uses ref() (NOT useState) so each modal instance has isolated state.
 */

export interface SelectorSubcategory {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  applicable_filters: string[]
  sort_order: number
}

export interface SelectorType {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  applicable_filters: string[]
  sort_order: number
}

export interface SelectorFilterDefinition {
  id: string
  name: string
  type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: Record<string, unknown>
  is_extra: boolean
  sort_order: number
}

export function useVehicleTypeSelector() {
  const supabase = useSupabaseClient()

  const subcategories = ref<SelectorSubcategory[]>([])
  const types = ref<SelectorType[]>([])
  const typeSubcategoryLinks = ref<Map<string, string[]>>(new Map())
  const filterDefinitions = ref<SelectorFilterDefinition[]>([])

  const selectedSubcategoryId = ref<string | null>(null)
  const selectedTypeId = ref<string | null>(null)
  const filterValues = ref<Record<string, unknown>>({})

  const loading = ref(false)
  const filtersLoading = ref(false)

  // Types linked to the currently selected subcategory
  const linkedTypes = computed(() => {
    if (!selectedSubcategoryId.value) return []

    const linkedTypeIds = new Set<string>()
    for (const [typeId, subcatIds] of typeSubcategoryLinks.value.entries()) {
      if (subcatIds.includes(selectedSubcategoryId.value)) {
        linkedTypeIds.add(typeId)
      }
    }

    return types.value
      .filter(t => linkedTypeIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order)
  })

  // Fetch subcategories, types, and junction data in parallel
  async function fetchInitialData() {
    loading.value = true
    try {
      const [subcatResult, typesResult, linksResult] = await Promise.all([
        supabase
          .from('subcategories')
          .select('id, name_es, name_en, slug, applicable_categories, applicable_filters, sort_order')
          .eq('status', 'published')
          .order('sort_order', { ascending: true }),
        supabase
          .from('types')
          .select('id, name_es, name_en, slug, applicable_categories, applicable_filters, sort_order')
          .eq('status', 'published')
          .order('sort_order', { ascending: true }),
        supabase
          .from('type_subcategories')
          .select('type_id, subcategory_id'),
      ])

      subcategories.value = (subcatResult.data as SelectorSubcategory[]) || []
      types.value = (typesResult.data as SelectorType[]) || []

      const links = new Map<string, string[]>()
      if (linksResult.data) {
        for (const link of linksResult.data as { type_id: string; subcategory_id: string }[]) {
          if (!links.has(link.type_id)) {
            links.set(link.type_id, [])
          }
          links.get(link.type_id)!.push(link.subcategory_id)
        }
      }
      typeSubcategoryLinks.value = links
    }
    finally {
      loading.value = false
    }
  }

  // Select a subcategory — clears type and filters
  function selectSubcategory(id: string | null) {
    selectedSubcategoryId.value = id
    selectedTypeId.value = null
    filterDefinitions.value = []
    filterValues.value = {}
  }

  // Select a type — fetches filter definitions for that type
  async function selectType(id: string | null) {
    selectedTypeId.value = id
    filterDefinitions.value = []
    filterValues.value = {}

    if (!id) return

    filtersLoading.value = true
    try {
      // Get the type's applicable_filters array
      const selectedType = types.value.find(t => t.id === id)
      if (!selectedType?.applicable_filters?.length) return

      // Fetch filter definitions by IDs
      const { data } = await supabase
        .from('filter_definitions')
        .select('id, name, type, label_es, label_en, unit, options, is_extra, sort_order')
        .in('id', selectedType.applicable_filters)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true })

      filterDefinitions.value = (data as SelectorFilterDefinition[]) || []
    }
    finally {
      filtersLoading.value = false
    }
  }

  // Set a filter value
  function setFilterValue(name: string, value: unknown) {
    filterValues.value = { ...filterValues.value, [name]: value }
  }

  // Get the current filter values as JSONB-compatible object (removes empty values)
  function getFiltersJson(): Record<string, unknown> {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(filterValues.value)) {
      if (value !== null && value !== undefined && value !== '') {
        result[key] = value
      }
    }
    return result
  }

  // Get localized label for a filter
  function getFilterLabel(filter: SelectorFilterDefinition, locale: string): string {
    if (locale === 'en' && filter.label_en) return filter.label_en
    return filter.label_es || filter.name
  }

  // Get options for a dropdown filter (manual choices only — no auto-extract from vehicles)
  function getFilterOptions(filter: SelectorFilterDefinition): string[] {
    const opts = filter.options as { choices?: string[] }
    return opts?.choices || []
  }

  // Get human-readable "Subcategoría > Tipo" label for backward compat vehicle_type field
  function getVehicleTypeLabel(locale: string): string {
    const parts: string[] = []

    const subcat = subcategories.value.find(s => s.id === selectedSubcategoryId.value)
    if (subcat) {
      parts.push(locale === 'en' && subcat.name_en ? subcat.name_en : subcat.name_es)
    }

    const type = types.value.find(t => t.id === selectedTypeId.value)
    if (type) {
      parts.push(locale === 'en' && type.name_en ? type.name_en : type.name_es)
    }

    return parts.join(' > ')
  }

  // Get localized name for selected subcategory
  function getSubcategoryName(locale: string): string {
    const sub = subcategories.value.find(s => s.id === selectedSubcategoryId.value)
    if (!sub) return ''
    return locale === 'en' && sub.name_en ? sub.name_en : sub.name_es
  }

  // Get localized name for selected type
  function getTypeName(locale: string): string {
    const type = types.value.find(t => t.id === selectedTypeId.value)
    if (!type) return ''
    return locale === 'en' && type.name_en ? type.name_en : type.name_es
  }

  // Reset all selections
  function reset() {
    selectedSubcategoryId.value = null
    selectedTypeId.value = null
    filterDefinitions.value = []
    filterValues.value = {}
  }

  return {
    subcategories: readonly(subcategories),
    types: readonly(types),
    linkedTypes,
    filterDefinitions: readonly(filterDefinitions),
    selectedSubcategoryId: readonly(selectedSubcategoryId),
    selectedTypeId: readonly(selectedTypeId),
    filterValues: readonly(filterValues),
    loading: readonly(loading),
    filtersLoading: readonly(filtersLoading),
    fetchInitialData,
    selectSubcategory,
    selectType,
    setFilterValue,
    getFiltersJson,
    getFilterLabel,
    getFilterOptions,
    getVehicleTypeLabel,
    getSubcategoryName,
    getTypeName,
    reset,
  }
}
