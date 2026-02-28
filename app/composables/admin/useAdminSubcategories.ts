/**
 * Admin Subcategories Composable (migrated: subcategories table → categories table)
 * Full CRUD operations for vehicle categories (formerly "subcategories") in admin panel
 * Categories are the parent level above subcategories (formerly "types")
 */
import { slugify } from '~/utils/fileNaming'

export interface AdminSubcategory {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  applicable_filters: string[]
  stock_count: number
  status: string
  sort_order: number
  created_at?: string
  updated_at?: string
}

export interface SubcategoryFormData {
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  applicable_filters: string[]
  status: string
  sort_order: number
}

export function useAdminSubcategories() {
  const supabase = useSupabaseClient()

  const subcategories = ref<AdminSubcategory[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all subcategories with stock count
   */
  async function fetchSubcategories() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (err) throw err

      const subcategoriesData = (data as unknown as AdminSubcategory[]) || []

      // Get vehicle counts per category via subcategory_categories junction
      // First, get all subcategory-category links
      const { data: subcatLinks } = await supabase
        .from('subcategory_categories')
        .select('subcategory_id, category_id')

      // Get all vehicle subcategory_ids
      const { data: vehicleCounts } = await supabase
        .from('vehicles')
        .select('subcategory_id')
        .eq('status', 'published')

      // Build a map: category_id -> count of vehicles
      const countMap = new Map<string, number>()

      if (subcatLinks && vehicleCounts) {
        // Build subcategory_id -> category_ids map
        const subcatToCategories = new Map<string, string[]>()
        for (const link of subcatLinks as { subcategory_id: string; category_id: string }[]) {
          if (!subcatToCategories.has(link.subcategory_id)) {
            subcatToCategories.set(link.subcategory_id, [])
          }
          subcatToCategories.get(link.subcategory_id)!.push(link.category_id)
        }

        // Count vehicles per category
        for (const v of vehicleCounts as unknown as { subcategory_id: string | null }[]) {
          if (v.subcategory_id && subcatToCategories.has(v.subcategory_id)) {
            const catIds = subcatToCategories.get(v.subcategory_id)!
            for (const catId of catIds) {
              countMap.set(catId, (countMap.get(catId) || 0) + 1)
            }
          }
        }
      }

      // Merge stock counts
      subcategories.value = subcategoriesData.map((s) => ({
        ...s,
        stock_count: countMap.get(s.id) || 0,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subcategories'
      subcategories.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single subcategory by ID
   */
  async function fetchById(id: string): Promise<AdminSubcategory | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminSubcategory
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subcategory'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new subcategory
   */
  async function createSubcategory(formData: SubcategoryFormData): Promise<string | null> {
    saving.value = true
    error.value = null

    try {
      const insertData = {
        name_es: formData.name_es,
        name_en: formData.name_en || null,
        slug: formData.slug || slugify(formData.name_es),
        applicable_categories: formData.applicable_categories || [],
        applicable_filters: formData.applicable_filters || [],
        status: formData.status,
        sort_order: formData.sort_order,
      }

      const { data, error: err } = await supabase
        .from('categories')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    } catch (err: unknown) {
      const supabaseError = err as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }
      error.value =
        supabaseError?.message ||
        (err instanceof Error ? err.message : 'Error creating subcategory')
      if (import.meta.dev) console.error('Create subcategory error:', err)
      return null
    } finally {
      saving.value = false
    }
  }

  /**
   * Update existing subcategory
   */
  async function updateSubcategory(
    id: string,
    formData: Partial<SubcategoryFormData>,
  ): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData: Record<string, unknown> = {}

      if (formData.name_es !== undefined) updateData.name_es = formData.name_es
      if (formData.name_en !== undefined) updateData.name_en = formData.name_en || null
      if (formData.slug !== undefined) updateData.slug = formData.slug
      if (formData.applicable_categories !== undefined)
        updateData.applicable_categories = formData.applicable_categories
      if (formData.applicable_filters !== undefined)
        updateData.applicable_filters = formData.applicable_filters
      if (formData.status !== undefined) updateData.status = formData.status
      if (formData.sort_order !== undefined) updateData.sort_order = formData.sort_order

      const { error: err } = await supabase
        .from('categories')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    } catch (err: unknown) {
      const supabaseError = err as {
        message?: string
        details?: string
        hint?: string
        code?: string
      }
      error.value =
        supabaseError?.message ||
        (err instanceof Error ? err.message : 'Error updating subcategory')
      if (import.meta.dev) console.error('Update subcategory error:', err)
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete subcategory
   */
  async function deleteSubcategory(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('categories').delete().eq('id', id)

      if (err) throw err

      // Remove from local list
      subcategories.value = subcategories.value.filter((s) => s.id !== id)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting subcategory'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Toggle published status
   */
  async function toggleStatus(id: string, status: string): Promise<boolean> {
    return updateSubcategory(id, { status })
  }

  /**
   * Reorder subcategories
   */
  async function reorder(items: { id: string; sort_order: number }[]): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      for (const item of items) {
        const { error: err } = await supabase
          .from('categories')
          .update({ sort_order: item.sort_order } as never)
          .eq('id', item.id)

        if (err) throw err
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error reordering subcategories'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Move subcategory up in order
   */
  async function moveUp(id: string): Promise<boolean> {
    const index = subcategories.value.findIndex((s) => s.id === id)
    if (index <= 0) return false

    const current = subcategories.value[index]!
    const previous = subcategories.value[index - 1]!

    const success = await reorder([
      { id: current.id, sort_order: previous.sort_order },
      { id: previous.id, sort_order: current.sort_order },
    ])

    if (success) {
      await fetchSubcategories()
    }

    return success
  }

  /**
   * Move subcategory down in order
   */
  async function moveDown(id: string): Promise<boolean> {
    const index = subcategories.value.findIndex((s) => s.id === id)
    if (index < 0 || index >= subcategories.value.length - 1) return false

    const current = subcategories.value[index]!
    const next = subcategories.value[index + 1]!

    const success = await reorder([
      { id: current.id, sort_order: next.sort_order },
      { id: next.id, sort_order: current.sort_order },
    ])

    if (success) {
      await fetchSubcategories()
    }

    return success
  }

  /**
   * Get subcategories linked to a category (formerly: types linked to a subcategory)
   */
  async function getLinkedSubcategories(categoryId: string): Promise<string[]> {
    try {
      const { data, error: err } = await supabase
        .from('subcategory_categories')
        .select('subcategory_id')
        .eq('category_id', categoryId)

      if (err) throw err

      return ((data as { subcategory_id: string }[]) || []).map((d) => d.subcategory_id)
    } catch {
      return []
    }
  }

  function clearError() {
    error.value = null
  }

  return {
    subcategories: readonly(subcategories),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchSubcategories,
    fetchById,
    createSubcategory,
    updateSubcategory,
    deleteSubcategory,
    toggleStatus,
    moveUp,
    moveDown,
    getLinkedSubcategories,
    clearError,
  }
}
