/**
 * Admin Types Composable (migrated: types table → subcategories table)
 * Full CRUD operations for vehicle subcategories (formerly "types") in admin panel
 */

export interface AdminType {
  id: string
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  stock_count: number
  status: string
  sort_order: number
  created_at?: string
  updated_at?: string
  applicable_filters?: string[]
}

export interface TypeFormData {
  name_es: string
  name_en: string | null
  slug: string
  applicable_categories: string[]
  applicable_filters: string[]
  status: string
  sort_order: number
}

export function useAdminTypes() {
  const supabase = useSupabaseClient()

  const types = ref<AdminType[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch all types with stock count
   */
  async function fetchTypes() {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('subcategories')
        .select('*')
        .order('sort_order', { ascending: true })

      if (err) throw err

      // Calculate stock for each type
      const typesData = (data as unknown as AdminType[]) || []

      // Get vehicle counts per subcategory (formerly type)
      const { data: vehicleCounts } = await supabase
        .from('vehicles')
        .select('subcategory_id')
        .eq('status', 'published')

      const countMap = new Map<string, number>()
      if (vehicleCounts) {
        for (const v of vehicleCounts as { subcategory_id: string | null }[]) {
          if (v.subcategory_id) {
            countMap.set(v.subcategory_id, (countMap.get(v.subcategory_id) || 0) + 1)
          }
        }
      }

      // Merge stock counts
      types.value = typesData.map((t) => ({
        ...t,
        stock_count: countMap.get(t.id) || 0,
      }))
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching types'
      types.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single type by ID
   */
  async function fetchById(id: string): Promise<AdminType | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('subcategories')
        .select('*')
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminType
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching type'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Create new type
   */
  async function createType(formData: TypeFormData): Promise<string | null> {
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error creating type'
      return null
    } finally {
      saving.value = false
    }
  }

  /**
   * Update existing type
   */
  async function updateType(id: string, formData: Partial<TypeFormData>): Promise<boolean> {
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
        .from('subcategories')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating type'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete type
   */
  async function deleteType(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('subcategories').delete().eq('id', id)

      if (err) throw err

      // Remove from local list
      types.value = types.value.filter((t) => t.id !== id)

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting type'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Toggle published status
   */
  async function toggleStatus(id: string, status: string): Promise<boolean> {
    return updateType(id, { status })
  }

  /**
   * Reorder types
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
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error reordering types'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Move type up in order
   */
  async function moveUp(id: string): Promise<boolean> {
    const index = types.value.findIndex((t) => t.id === id)
    if (index <= 0) return false

    const current = types.value[index]
    const previous = types.value[index - 1]

    const success = await reorder([
      { id: current.id, sort_order: previous.sort_order },
      { id: previous.id, sort_order: current.sort_order },
    ])

    if (success) {
      await fetchTypes()
    }

    return success
  }

  /**
   * Move type down in order
   */
  async function moveDown(id: string): Promise<boolean> {
    const index = types.value.findIndex((t) => t.id === id)
    if (index < 0 || index >= types.value.length - 1) return false

    const current = types.value[index]
    const next = types.value[index + 1]

    const success = await reorder([
      { id: current.id, sort_order: next.sort_order },
      { id: next.id, sort_order: current.sort_order },
    ])

    if (success) {
      await fetchTypes()
    }

    return success
  }

  return {
    types: readonly(types),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    fetchTypes,
    fetchById,
    createType,
    updateType,
    deleteType,
    toggleStatus,
    moveUp,
    moveDown,
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
