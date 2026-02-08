/**
 * Admin Subcategories Composable
 * Full CRUD operations for vehicle subcategories in admin panel
 * Subcategories are the parent level above types
 */

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
        .from('subcategories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (err) throw err

      const subcategoriesData = (data as unknown as AdminSubcategory[]) || []

      // Get vehicle counts per subcategory via type_subcategories junction
      // First, get all type-subcategory links
      const { data: typeLinks } = await supabase
        .from('type_subcategories')
        .select('type_id, subcategory_id')

      // Get all vehicle type_ids
      const { data: vehicleCounts } = await supabase
        .from('vehicles')
        .select('type_id')
        .eq('status', 'published')

      // Build a map: subcategory_id -> count of vehicles
      const countMap = new Map<string, number>()

      if (typeLinks && vehicleCounts) {
        // Build type_id -> subcategory_ids map
        const typeToSubcategories = new Map<string, string[]>()
        for (const link of typeLinks as { type_id: string; subcategory_id: string }[]) {
          if (!typeToSubcategories.has(link.type_id)) {
            typeToSubcategories.set(link.type_id, [])
          }
          typeToSubcategories.get(link.type_id)!.push(link.subcategory_id)
        }

        // Count vehicles per subcategory
        for (const v of vehicleCounts as { type_id: string | null }[]) {
          if (v.type_id && typeToSubcategories.has(v.type_id)) {
            const subcatIds = typeToSubcategories.get(v.type_id)!
            for (const subcatId of subcatIds) {
              countMap.set(subcatId, (countMap.get(subcatId) || 0) + 1)
            }
          }
        }
      }

      // Merge stock counts
      subcategories.value = subcategoriesData.map(s => ({
        ...s,
        stock_count: countMap.get(s.id) || 0,
      }))
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subcategories'
      subcategories.value = []
    }
    finally {
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
        .from('subcategories')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminSubcategory
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching subcategory'
      return null
    }
    finally {
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
        slug: formData.slug || generateSlug(formData.name_es),
        applicable_categories: formData.applicable_categories || [],
        applicable_filters: formData.applicable_filters || [],
        status: formData.status,
        sort_order: formData.sort_order,
      }

      const { data, error: err } = await supabase
        .from('subcategories')
        .insert(insertData as never)
        .select('id')
        .single()

      if (err) throw err

      return (data as { id: string } | null)?.id || null
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string; details?: string; hint?: string; code?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error creating subcategory')
      console.error('Create subcategory error:', err)
      return null
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Update existing subcategory
   */
  async function updateSubcategory(id: string, formData: Partial<SubcategoryFormData>): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData: Record<string, unknown> = {}

      if (formData.name_es !== undefined) updateData.name_es = formData.name_es
      if (formData.name_en !== undefined) updateData.name_en = formData.name_en || null
      if (formData.slug !== undefined) updateData.slug = formData.slug
      if (formData.applicable_categories !== undefined) updateData.applicable_categories = formData.applicable_categories
      if (formData.applicable_filters !== undefined) updateData.applicable_filters = formData.applicable_filters
      if (formData.status !== undefined) updateData.status = formData.status
      if (formData.sort_order !== undefined) updateData.sort_order = formData.sort_order

      const { error: err } = await supabase
        .from('subcategories')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    }
    catch (err: unknown) {
      const supabaseError = err as { message?: string; details?: string; hint?: string; code?: string }
      error.value = supabaseError?.message || (err instanceof Error ? err.message : 'Error updating subcategory')
      console.error('Update subcategory error:', err)
      return false
    }
    finally {
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
      const { error: err } = await supabase
        .from('subcategories')
        .delete()
        .eq('id', id)

      if (err) throw err

      // Remove from local list
      subcategories.value = subcategories.value.filter(s => s.id !== id)

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting subcategory'
      return false
    }
    finally {
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
          .from('subcategories')
          .update({ sort_order: item.sort_order } as never)
          .eq('id', item.id)

        if (err) throw err
      }

      return true
    }
    catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error reordering subcategories'
      return false
    }
    finally {
      saving.value = false
    }
  }

  /**
   * Move subcategory up in order
   */
  async function moveUp(id: string): Promise<boolean> {
    const index = subcategories.value.findIndex(s => s.id === id)
    if (index <= 0) return false

    const current = subcategories.value[index]
    const previous = subcategories.value[index - 1]

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
    const index = subcategories.value.findIndex(s => s.id === id)
    if (index < 0 || index >= subcategories.value.length - 1) return false

    const current = subcategories.value[index]
    const next = subcategories.value[index + 1]

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
   * Get types linked to a subcategory
   */
  async function getLinkedTypes(subcategoryId: string): Promise<string[]> {
    try {
      const { data, error: err } = await supabase
        .from('type_subcategories')
        .select('type_id')
        .eq('subcategory_id', subcategoryId)

      if (err) throw err

      return (data as { type_id: string }[] || []).map(d => d.type_id)
    }
    catch {
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
    getLinkedTypes,
    clearError,
  }
}

// Helper function to generate URL-friendly slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036F]/g, '') // Remove diacritics
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}
