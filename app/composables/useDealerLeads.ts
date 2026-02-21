/**
 * Composable for managing dealer leads.
 * Fetches, filters, and updates lead status with full workflow support.
 *
 * Lead status workflow: new -> viewed -> contacted -> negotiating -> won/lost
 */

export type LeadStatus = 'new' | 'viewed' | 'contacted' | 'negotiating' | 'won' | 'lost'

export const LEAD_STATUSES: LeadStatus[] = [
  'new',
  'viewed',
  'contacted',
  'negotiating',
  'won',
  'lost',
]

export interface Lead {
  id: string
  dealer_id: string
  vehicle_id: string | null
  buyer_name: string | null
  buyer_email: string | null
  buyer_phone: string | null
  buyer_location: string | null
  message: string | null
  status: LeadStatus
  dealer_notes: string | null
  close_reason: string | null
  created_at: string | null
  updated_at: string | null
  vehicle_brand: string | null
  vehicle_model: string | null
  vehicle_year: number | null
  status_history: StatusChange[]
}

export interface StatusChange {
  from: LeadStatus
  to: LeadStatus
  changed_at: string
  notes: string | null
}

export interface LeadFilters {
  status: LeadStatus | null
  vehicleId: string | null
  search: string
}

export function useDealerLeads(dealerId: Ref<string | null> | string | null) {
  const supabase = useSupabaseClient()

  const leads = ref<Lead[]>([])
  const currentLead = ref<Lead | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const total = ref(0)

  function getDealerId(): string | null {
    if (typeof dealerId === 'string') return dealerId
    if (dealerId && 'value' in dealerId) return dealerId.value
    return null
  }

  async function loadLeads(filters?: Partial<LeadFilters>): Promise<void> {
    const id = getDealerId()
    if (!id) {
      error.value = 'Dealer ID not available'
      return
    }

    loading.value = true
    error.value = null

    try {
      let query = supabase
        .from('leads')
        .select('*, vehicles(brand, model, year)', { count: 'exact' })
        .eq('dealer_id', id)
        .order('created_at', { ascending: false })

      if (filters?.status) {
        query = query.eq('status', filters.status)
      }

      if (filters?.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId)
      }

      if (filters?.search) {
        query = query.or(
          `buyer_name.ilike.%${filters.search}%,buyer_email.ilike.%${filters.search}%`,
        )
      }

      const { data, error: err, count } = await query

      if (err) throw err

      leads.value = (
        (data || []) as Array<{
          id: string
          dealer_id: string
          vehicle_id: string | null
          buyer_name: string | null
          buyer_email: string | null
          buyer_phone: string | null
          buyer_location: string | null
          message: string | null
          status: LeadStatus
          dealer_notes: string | null
          close_reason: string | null
          created_at: string | null
          updated_at: string | null
          status_history: StatusChange[] | null
          vehicles: { brand: string; model: string; year: number | null } | null
        }>
      ).map((lead) => ({
        id: lead.id,
        dealer_id: lead.dealer_id,
        vehicle_id: lead.vehicle_id,
        buyer_name: lead.buyer_name,
        buyer_email: lead.buyer_email,
        buyer_phone: lead.buyer_phone,
        buyer_location: lead.buyer_location,
        message: lead.message,
        status: lead.status,
        dealer_notes: lead.dealer_notes,
        close_reason: lead.close_reason,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        vehicle_brand: lead.vehicles?.brand || null,
        vehicle_model: lead.vehicles?.model || null,
        vehicle_year: lead.vehicles?.year || null,
        status_history: lead.status_history || [],
      }))

      total.value = count || 0
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading leads'
    } finally {
      loading.value = false
    }
  }

  async function loadLead(leadId: string): Promise<Lead | null> {
    const id = getDealerId()
    if (!id) return null

    loading.value = true
    error.value = null

    try {
      const { data, error: err } = await supabase
        .from('leads')
        .select('*, vehicles(brand, model, year)')
        .eq('id', leadId)
        .eq('dealer_id', id)
        .single()

      if (err) throw err

      const lead = data as {
        id: string
        dealer_id: string
        vehicle_id: string | null
        buyer_name: string | null
        buyer_email: string | null
        buyer_phone: string | null
        buyer_location: string | null
        message: string | null
        status: LeadStatus
        dealer_notes: string | null
        close_reason: string | null
        created_at: string | null
        updated_at: string | null
        status_history: StatusChange[] | null
        vehicles: { brand: string; model: string; year: number | null } | null
      }

      currentLead.value = {
        id: lead.id,
        dealer_id: lead.dealer_id,
        vehicle_id: lead.vehicle_id,
        buyer_name: lead.buyer_name,
        buyer_email: lead.buyer_email,
        buyer_phone: lead.buyer_phone,
        buyer_location: lead.buyer_location,
        message: lead.message,
        status: lead.status,
        dealer_notes: lead.dealer_notes,
        close_reason: lead.close_reason,
        created_at: lead.created_at,
        updated_at: lead.updated_at,
        vehicle_brand: lead.vehicles?.brand || null,
        vehicle_model: lead.vehicles?.model || null,
        vehicle_year: lead.vehicles?.year || null,
        status_history: lead.status_history || [],
      }

      return currentLead.value
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error loading lead'
      return null
    } finally {
      loading.value = false
    }
  }

  async function updateLeadStatus(
    leadId: string,
    newStatus: LeadStatus,
    notes?: string,
  ): Promise<boolean> {
    error.value = null

    try {
      // Get current lead to build status history
      const existing = leads.value.find((l) => l.id === leadId) || currentLead.value
      const oldStatus = existing?.status || 'new'

      const statusChange: StatusChange = {
        from: oldStatus as LeadStatus,
        to: newStatus,
        changed_at: new Date().toISOString(),
        notes: notes || null,
      }

      const existingHistory = existing?.status_history || []

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        status_history: [...existingHistory, statusChange],
      }

      if (notes) {
        updateData.dealer_notes = notes
      }

      const { error: err } = await supabase.from('leads').update(updateData).eq('id', leadId)

      if (err) throw err

      // Update local state
      const idx = leads.value.findIndex((l) => l.id === leadId)
      if (idx >= 0) {
        leads.value[idx] = {
          ...leads.value[idx],
          status: newStatus,
          updated_at: updateData.updated_at as string,
          status_history: updateData.status_history as StatusChange[],
          dealer_notes: (notes || leads.value[idx].dealer_notes) as string | null,
        }
      }

      if (currentLead.value?.id === leadId) {
        currentLead.value = {
          ...currentLead.value,
          status: newStatus,
          updated_at: updateData.updated_at as string,
          status_history: updateData.status_history as StatusChange[],
          dealer_notes: (notes || currentLead.value.dealer_notes) as string | null,
        }
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating lead status'
      return false
    }
  }

  async function updateLeadNotes(leadId: string, dealerNotes: string): Promise<boolean> {
    error.value = null

    try {
      const { error: err } = await supabase
        .from('leads')
        .update({
          dealer_notes: dealerNotes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (err) throw err

      // Update local state
      const idx = leads.value.findIndex((l) => l.id === leadId)
      if (idx >= 0) {
        leads.value[idx] = { ...leads.value[idx], dealer_notes: dealerNotes }
      }

      if (currentLead.value?.id === leadId) {
        currentLead.value = { ...currentLead.value, dealer_notes: dealerNotes }
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating notes'
      return false
    }
  }

  async function updateCloseReason(leadId: string, reason: string): Promise<boolean> {
    error.value = null

    try {
      const { error: err } = await supabase
        .from('leads')
        .update({
          close_reason: reason,
          updated_at: new Date().toISOString(),
        })
        .eq('id', leadId)

      if (err) throw err

      if (currentLead.value?.id === leadId) {
        currentLead.value = { ...currentLead.value, close_reason: reason }
      }

      return true
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Error updating close reason'
      return false
    }
  }

  return {
    leads: readonly(leads),
    currentLead: readonly(currentLead),
    loading: readonly(loading),
    error,
    total: readonly(total),
    loadLeads,
    loadLead,
    updateLeadStatus,
    updateLeadNotes,
    updateCloseReason,
  }
}
