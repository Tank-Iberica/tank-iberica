/**
 * Admin Demands Composable
 * Full CRUD operations for demands (solicitantes) in admin panel
 */

export type DemandStatus = 'pending' | 'contacted' | 'matched' | 'archived'

export interface AdminDemand {
  id: string
  user_id: string | null
  vehicle_type: string | null
  category_id: string | null
  subcategory_id: string | null
  attributes_json: Record<string, unknown>
  brand_preference: string | null
  year_min: number | null
  year_max: number | null
  price_min: number | null
  price_max: number | null
  specs: Record<string, unknown> | null
  location: string | null
  description: string | null
  contact_name: string
  contact_phone: string | null
  contact_email: string | null
  contact_preference: string | null
  status: DemandStatus
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

export interface DemandFilters {
  status?: DemandStatus | null
  search?: string
}

export const DEMAND_STATUSES: { value: DemandStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pendiente', color: '#ef4444' },
  { value: 'contacted', label: 'Contactado', color: '#f59e0b' },
  { value: 'matched', label: 'Vinculado', color: '#10b981' },
  { value: 'archived', label: 'Archivado', color: '#6b7280' },
]

const PAGE_SIZE = 50

export function useAdminDemands() {
  const supabase = useSupabaseClient()

  const demands = ref<AdminDemand[]>([])
  const loading = ref(false)
  const saving = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  /**
   * Fetch all demands with filters
   */
  async function fetchDemands(filters: DemandFilters = {}) {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('demands')
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
          `contact_name.ilike.%${filters.search}%,brand_preference.ilike.%${filters.search}%,vehicle_type.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err, count } = await query.range(0, PAGE_SIZE - 1)

      if (err) throw err

      demands.value = (data as unknown as AdminDemand[]) || []
      total.value = count || 0
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching demands'
      demands.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch single demand by ID
   */
  async function fetchById(id: string): Promise<AdminDemand | null> {
    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('demands')
        .select(
          '*, category:category_id(name_es, name_en), subcategory:subcategory_id(name_es, name_en)',
        )
        .eq('id', id)
        .single()

      if (err) throw err

      return data as unknown as AdminDemand
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error fetching demand'
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * Update demand status
   */
  async function updateStatus(id: string, status: DemandStatus): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase
        .from('demands')
        .update({ status, updated_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (err) throw err

      // Update local list
      const index = demands.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        demands.value[index].status = status
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
        .from('demands')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() } as never)
        .eq('id', id)

      if (err) throw err

      // Update local list
      const index = demands.value.findIndex((d) => d.id === id)
      if (index !== -1) {
        demands.value[index].admin_notes = notes
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
   * Match demand with a vehicle
   */
  async function matchVehicle(id: string, vehicleId: string | null): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const updateData: Record<string, unknown> = {
        match_vehicle_id: vehicleId,
        updated_at: new Date().toISOString(),
      }

      if (vehicleId) {
        updateData.status = 'matched'
      }

      const { error: err } = await supabase
        .from('demands')
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
   * Delete demand
   */
  async function deleteDemand(id: string): Promise<boolean> {
    saving.value = true
    error.value = null

    try {
      const { error: err } = await supabase.from('demands').delete().eq('id', id)

      if (err) throw err

      // Remove from local list
      demands.value = demands.value.filter((d) => d.id !== id)
      total.value--

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error deleting demand'
      return false
    } finally {
      saving.value = false
    }
  }

  /**
   * Get count of pending demands
   */
  async function getPendingCount(): Promise<number> {
    try {
      const { count, error: err } = await supabase
        .from('demands')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      if (err) throw err

      return count || 0
    } catch {
      return 0
    }
  }

  return {
    demands: readonly(demands),
    loading: readonly(loading),
    saving: readonly(saving),
    error: readonly(error),
    total: readonly(total),
    fetchDemands,
    fetchById,
    updateStatus,
    updateNotes,
    matchVehicle,
    deleteDemand,
    getPendingCount,
  }
}
