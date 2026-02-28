/**
 * Shared composable for category → subcategory → dynamic attributes cascade.
 * Used by AdvertiseModal and DemandModal.
 * Uses ref() (NOT useState) so each modal instance has isolated state.
 */

import { localizedField } from '~/composables/useLocalized'

export interface SelectorCategory {
  id: string
  name: Record<string, string> | null
  name_es: string
  name_en: string | null
  name_singular: Record<string, string> | null
  slug: string
  applicable_actions: string[]
  applicable_filters: string[]
  sort_order: number
}

export interface SelectorSubcategory {
  id: string
  name: Record<string, string> | null
  name_es: string
  name_en: string | null
  name_singular: Record<string, string> | null
  slug: string
  applicable_actions: string[]
  applicable_filters: string[]
  sort_order: number
}

export interface SelectorAttribute {
  id: string
  name: string
  type: 'caja' | 'desplegable' | 'desplegable_tick' | 'tick' | 'slider' | 'calc'
  label: Record<string, string> | null
  label_es: string | null
  label_en: string | null
  unit: string | null
  options: Record<string, unknown>
  is_extra: boolean
  sort_order: number
}

export function useVehicleTypeSelector() {
  const supabase = useSupabaseClient()

  const categories = ref<SelectorCategory[]>([])
  const subcategories = ref<SelectorSubcategory[]>([])
  const subcategoryCategoryLinks = ref<Map<string, string[]>>(new Map())
  const attributes = ref<SelectorAttribute[]>([])

  const selectedCategoryId = ref<string | null>(null)
  const selectedSubcategoryId = ref<string | null>(null)
  const filterValues = ref<Record<string, unknown>>({})

  const loading = ref(false)
  const filtersLoading = ref(false)

  // Subcategories linked to the currently selected category
  const linkedSubcategories = computed(() => {
    if (!selectedCategoryId.value) return []

    const linkedSubcategoryIds = new Set<string>()
    for (const [subcategoryId, categoryIds] of subcategoryCategoryLinks.value.entries()) {
      if (categoryIds.includes(selectedCategoryId.value)) {
        linkedSubcategoryIds.add(subcategoryId)
      }
    }

    return subcategories.value
      .filter((t) => linkedSubcategoryIds.has(t.id))
      .sort((a, b) => a.sort_order - b.sort_order)
  })

  // Fetch categories, subcategories, and junction data in parallel
  async function fetchInitialData() {
    loading.value = true
    try {
      const [catResult, subcatResult, linksResult] = await Promise.all([
        supabase
          .from('categories')
          .select(
            'id, name, name_es, name_en, name_singular, slug, applicable_actions, applicable_filters, sort_order',
          )
          .eq('status', 'published')
          .order('sort_order', { ascending: true }),
        supabase
          .from('subcategories')
          .select(
            'id, name, name_es, name_en, name_singular, slug, applicable_actions, applicable_filters, sort_order',
          )
          .eq('status', 'published')
          .order('sort_order', { ascending: true }),
        supabase.from('subcategory_categories').select('subcategory_id, category_id'),
      ])

      categories.value = (catResult.data as SelectorCategory[]) || []
      subcategories.value = (subcatResult.data as SelectorSubcategory[]) || []

      const links = new Map<string, string[]>()
      if (linksResult.data) {
        for (const link of linksResult.data as { subcategory_id: string; category_id: string }[]) {
          if (!links.has(link.subcategory_id)) {
            links.set(link.subcategory_id, [])
          }
          links.get(link.subcategory_id)!.push(link.category_id)
        }
      }
      subcategoryCategoryLinks.value = links
    } finally {
      loading.value = false
    }
  }

  // Select a category — clears subcategory and attributes
  function selectCategory(id: string | null) {
    selectedCategoryId.value = id
    selectedSubcategoryId.value = null
    attributes.value = []
    filterValues.value = {}
  }

  // Select a subcategory — fetches attribute definitions for that subcategory
  async function selectSubcategory(id: string | null) {
    selectedSubcategoryId.value = id
    attributes.value = []
    filterValues.value = {}

    if (!id) return

    filtersLoading.value = true
    try {
      // Get the subcategory's applicable_filters array
      const selectedSub = subcategories.value.find((t) => t.id === id)
      if (!selectedSub?.applicable_filters?.length) return

      // Fetch attribute definitions by IDs
      const { data } = await supabase
        .from('attributes')
        .select('id, name, type, label, label_es, label_en, unit, options, is_extra, sort_order')
        .in('id', selectedSub.applicable_filters)
        .eq('status', 'published')
        .eq('is_hidden', false)
        .order('sort_order', { ascending: true })

      attributes.value = (data as SelectorAttribute[]) || []
    } finally {
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

  // Get localized label for an attribute
  function getFilterLabel(filter: SelectorAttribute, locale: string): string {
    return localizedField(filter.label, locale) || filter.label_es || filter.name
  }

  // Get options for a dropdown filter (manual choices only — no auto-extract from vehicles)
  function getFilterOptions(filter: SelectorAttribute): string[] {
    const opts = filter.options as { choices?: string[] }
    return opts?.choices || []
  }

  // Get human-readable "Category > Subcategory" label for backward compat vehicle_type field
  function getVehicleSubcategoryLabel(locale: string): string {
    const parts: string[] = []

    const cat = categories.value.find((s) => s.id === selectedCategoryId.value)
    if (cat) {
      parts.push(
        localizedField(cat.name, locale) ||
          (locale === 'en' && cat.name_en ? cat.name_en : cat.name_es),
      )
    }

    const sub = subcategories.value.find((t) => t.id === selectedSubcategoryId.value)
    if (sub) {
      parts.push(
        localizedField(sub.name, locale) ||
          (locale === 'en' && sub.name_en ? sub.name_en : sub.name_es),
      )
    }

    return parts.join(' > ')
  }

  // Get localized name for selected category
  function getCategoryName(locale: string): string {
    const cat = categories.value.find((s) => s.id === selectedCategoryId.value)
    if (!cat) return ''
    return (
      localizedField(cat.name, locale) ||
      (locale === 'en' && cat.name_en ? cat.name_en : cat.name_es)
    )
  }

  // Get localized name for selected subcategory
  function getSubcategoryName(locale: string): string {
    const sub = subcategories.value.find((t) => t.id === selectedSubcategoryId.value)
    if (!sub) return ''
    return (
      localizedField(sub.name, locale) ||
      (locale === 'en' && sub.name_en ? sub.name_en : sub.name_es)
    )
  }

  // Reset all selections
  function reset() {
    selectedCategoryId.value = null
    selectedSubcategoryId.value = null
    attributes.value = []
    filterValues.value = {}
  }

  return {
    categories: readonly(categories),
    subcategories: readonly(subcategories),
    linkedSubcategories,
    attributes: readonly(attributes),
    selectedCategoryId: readonly(selectedCategoryId),
    selectedSubcategoryId: readonly(selectedSubcategoryId),
    filterValues: readonly(filterValues),
    loading: readonly(loading),
    filtersLoading: readonly(filtersLoading),
    fetchInitialData,
    selectCategory,
    selectSubcategory,
    setFilterValue,
    getFiltersJson,
    getAttributesJson: getFiltersJson,
    getFilterLabel,
    getFilterOptions,
    getVehicleSubcategoryLabel,
    getCategoryName,
    getSubcategoryName,
    reset,
  }
}
