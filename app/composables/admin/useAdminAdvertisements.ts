/**
 * Admin Advertisements Composable
 * Full CRUD operations for advertisements (anunciantes) in admin panel
 */

export type AdvertisementStatus = 'pending' | 'contacted' | 'matched' | 'archived'

export interface AdminAdvertisement {
  id: string
  user_id: string | null
  vehicle_type: string | null
  category_id: string | null
  subcategory_id: string | null
  attributes_json: Record<string, unknown>
  brand: string | null
  model: string | null
  year: number | null
  price: number | null
  kilometers: number | null
  location: string | null
  description: string | null
  contact_name: string
  contact_phone: string | null
  contact_email: string | null
  contact_preference: string | null
  photos: string[]
  status: AdvertisementStatus
  match_vehicle_id: string | null
  admin_notes: string | null
  created_at: string
  updated_at: string
  // Joined data
  category?: { name_es: string; name_en: string | null } | null
  subcategory?: { name_es: string; name_en: string | null } | null
  matched_vehicle?: {
    brand: string
    model: string
  } | null
}

export interface AdvertisementFilters {
  status?: AdvertisementStatus | null
  search?: string
}

export const ADVERTISEMENT_STATUSES: {
  value: AdvertisementStatus
  label: string
  color: string
}[] = [
  { value: 'pending', label: 'Pendiente', color: '#ef4444' },
  { value: 'contacted', label: 'Contactado', color: '#f59e0b' },
  { value: 'matched', label: 'Vinculado', color: '#10b981' },
  { value: 'archived', label: 'Archivado', color: '#6b7280' },
]

const PAGE_SIZE = 50

export function useAdminAdvertisements() {
  const supabase = useSupabaseClient()

  const advertisements = ref<AdminAdvertisement[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  /**
   * Fetch all advertisements with filters
   */
  async function fetchAdvertisements(filters: AdvertisementFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('advertisements')
        .select(
          '*, category:category_id(name_es, name_en), subcategory:subcategory_id(name_es, name_en)',
          { count: 'exact' },
        )
        .order('created_at', { ascending: false })

      if (filters.status) {
        query = query.eq('status', filters.status)
      }

      if (filters.search) {
        query = query.or(
          `contact_name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,model.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      advertisements.value = (data as unknown as AdminAdvertisement[]) || []
      total.value = count || 0
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching advertisements'
      advertisements.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single advertisement by ID
   */
  async function fetchById(id: string): Promise<AdminAdvertisement | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('advertisements')
        .select(
          '*, category:category_id(name_es, name_en), subcategory:subcategory_id(name_es, name_en)',
        )
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminAdvertisement
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching advertisement'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update advertisement status
   */
  async function updateStatus(id: string, status: AdvertisementStatus): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('advertisements')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (err) throw err

      // Update local list
      const index = advertisements.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        advertisements.value[index].status = status
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating status'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Update admin notes
   */
  async function updateNotes(id: string, notes: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('advertisements')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (err) throw err

      // Update local list
      const index = advertisements.value.findIndex((a) => a.id === id)
      if (index !== -1) {
        advertisements.value[index].admin_notes = notes
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating notes'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Match advertisement with a vehicle
   */
  async function matchVehicle(id: string, vehicleId: string | null): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData: Record<string, unknown> = {
        match_vehicle_id: vehicleId,
        updated_at: new Date().toISOString(),
      }

      // If matching, also update status
      if (vehicleId) {
        updateData.status = 'matched'
      }

      const { error: err } = await supabase
        .from('advertisements')
        .update(updateData as never)
        .eq('id', id)

      if (err) throw err

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error matching vehicle'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Delete advertisement
   */
  async function deleteAdvertisement(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('advertisements').delete().eq('id', id)

      if (err) throw err

      // Remove from local list
      advertisements.value = advertisements.value.filter((a) => a.id !== id)
      total.value--

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting advertisement'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Get count of pending advertisements
   */
  async function getPendingCount(): Promise<number> {
    try {
      const { count, error: err } = await supabase
        .from('advertisements')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (err) throw err

      return count || 0
    } catch {
      return 0
    }
  }

  return {
    advertisements: readonly(advertisements),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchAdvertisements,
    fetchById,
    updateStatus,
    updateNotes,
    matchVehicle,
    deleteAdvertisement,
    getPendingCount,
  }
}
