/**
 * Composable for vehicle groups — named collections of vehicles.
 *
 * Groups can be:
 * - Platform curated (dealer_id = null, group_type = 'curated')
 * - Dealer collections (dealer_id set, group_type = 'collection')
 * - Seasonal campaigns (group_type = 'seasonal')
 * - Bulk lots (group_type = 'lot')
 */

export type GroupType = 'curated' | 'collection' | 'seasonal' | 'lot'
export type GroupStatus = 'active' | 'draft' | 'archived'

export interface VehicleGroup {
  id: string
  name: Record<string, string>
  slug: string
  description: Record<string, string>
  dealer_id: string | null
  group_type: GroupType
  icon_url: string | null
  cover_image: string | null
  sort_order: number
  status: GroupStatus
  vertical: string
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface VehicleGroupWithCount extends VehicleGroup {
  vehicle_count: number
}

export function useVehicleGroups() {
  const supabase = useSupabaseClient()
  const { locale } = useI18n()

  const groups = ref<VehicleGroupWithCount[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /** Get localized name from JSONB */
  function localizedField(field: Record<string, string> | null | undefined): string {
    if (!field) return ''
    return field[locale.value] || field.es || field.en || ''
  }

  /**
   * Fetch active groups, optionally filtered by dealer and/or type.
   */
  async function fetchGroups(options?: {
    dealerId?: string
    groupType?: GroupType
    vertical?: string
  }): Promise<void> {
    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('vehicle_groups')
        .select('*, vehicle_group_items(count)')
        .eq('status', 'active')
        .order('sort_order', { ascending: true })

      if (options?.dealerId) {
        query = query.eq('dealer_id', options.dealerId)
      }
      if (options?.groupType) {
        query = query.eq('group_type', options.groupType)
      }
      if (options?.vertical) {
        query = query.eq('vertical', options.vertical)
      }

      const { data, error: err } = await query
      if (err) throw err

      groups.value = ((data ?? []) as Array<VehicleGroup & { vehicle_group_items: Array<{ count: number }> }>).map((g) => ({
        ...g,
        vehicle_count: g.vehicle_group_items?.[0]?.count ?? 0,
      }))
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching groups'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetch vehicles in a specific group.
   */
  async function fetchGroupVehicles(groupId: string) {
    const { data, error: err } = await supabase
      .from('vehicle_group_items')
      .select('vehicle_id, sort_order, vehicles(*,vehicle_images(*))')
      .eq('group_id', groupId)
      .order('sort_order', { ascending: true })

    if (err) throw err
    return (data ?? []).map((item: { vehicle_id: string; sort_order: number; vehicles: unknown }) => ({
      ...item.vehicles,
      _sort_order: item.sort_order,
    }))
  }

  /**
   * Create a new group (dealer or admin).
   */
  async function createGroup(group: {
    name: Record<string, string>
    slug: string
    description?: Record<string, string>
    dealer_id?: string | null
    group_type?: GroupType
    vertical?: string
  }) {
    const { data, error: err } = await supabase
      .from('vehicle_groups')
      .insert({
        name: group.name,
        slug: group.slug,
        description: group.description ?? {},
        dealer_id: group.dealer_id ?? null,
        group_type: group.group_type ?? 'collection',
        vertical: group.vertical ?? 'tracciona',
      })
      .select()
      .single()

    if (err) throw err
    return data
  }

  /**
   * Add vehicle(s) to a group.
   */
  async function addVehiclesToGroup(
    groupId: string,
    vehicleIds: string[],
  ) {
    const items = vehicleIds.map((vid, i) => ({
      group_id: groupId,
      vehicle_id: vid,
      sort_order: i,
    }))

    const { error: err } = await supabase
      .from('vehicle_group_items')
      .upsert(items, { onConflict: 'group_id,vehicle_id' })

    if (err) throw err
  }

  /**
   * Remove vehicle from a group.
   */
  async function removeVehicleFromGroup(groupId: string, vehicleId: string) {
    const { error: err } = await supabase
      .from('vehicle_group_items')
      .delete()
      .eq('group_id', groupId)
      .eq('vehicle_id', vehicleId)

    if (err) throw err
  }

  /**
   * Update group details.
   */
  async function updateGroup(
    groupId: string,
    updates: Partial<Pick<VehicleGroup, 'name' | 'description' | 'status' | 'sort_order' | 'icon_url' | 'cover_image' | 'metadata'>>,
  ) {
    const { error: err } = await supabase
      .from('vehicle_groups')
      .update(updates)
      .eq('id', groupId)

    if (err) throw err
  }

  /**
   * Delete a group (cascade deletes items).
   */
  async function deleteGroup(groupId: string) {
    const { error: err } = await supabase
      .from('vehicle_groups')
      .delete()
      .eq('id', groupId)

    if (err) throw err
  }

  return {
    groups: readonly(groups),
    loading: readonly(loading),
    error: readonly(error),
    localizedField,
    fetchGroups,
    fetchGroupVehicles,
    createGroup,
    addVehiclesToGroup,
    removeVehicleFromGroup,
    updateGroup,
    deleteGroup,
  }
}
