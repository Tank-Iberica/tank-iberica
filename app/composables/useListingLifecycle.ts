/**
 * Listing lifecycle composable — formal state machine for vehicle status transitions.
 *
 * Vehicle statuses: draft → published → sold/archived/rented/paused/expired/maintenance
 *
 * Provides:
 * - Transition validation (which status changes are allowed?)
 * - Transition execution with audit trail via analytics_events
 * - Status metadata (labels, icons, colors per status)
 * - Bulk operations for dealer fleet management
 *
 * Used by admin and dealer dashboard for product management.
 * Sync point S3: Agent D (Bloque 26) depends on this.
 */

export type VehicleStatus =
  | 'draft'
  | 'published'
  | 'sold'
  | 'archived'
  | 'rented'
  | 'maintenance'
  | 'paused'
  | 'expired'

/**
 * Allowed status transitions (state machine).
 * Key = current status, Value = array of valid target statuses.
 */
export const STATUS_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  draft: ['published'],
  published: ['draft', 'sold', 'archived', 'rented', 'paused', 'maintenance'],
  sold: ['archived'],
  archived: ['draft'],
  rented: ['published', 'sold', 'archived', 'maintenance'],
  maintenance: ['published', 'draft', 'archived'],
  paused: ['published', 'draft', 'archived'],
  expired: ['draft', 'archived'],
}

/**
 * Check if a status transition is valid.
 */
export function isValidTransition(
  from: VehicleStatus,
  to: VehicleStatus,
): boolean {
  if (from === to) return false
  return (STATUS_TRANSITIONS[from] ?? []).includes(to)
}

/**
 * Get all valid target statuses from current status.
 */
export function getValidTargets(current: VehicleStatus): VehicleStatus[] {
  return STATUS_TRANSITIONS[current] ?? []
}

export interface StatusMeta {
  label: { es: string; en: string }
  color: string
  icon: string
  isFinal: boolean
}

/**
 * Metadata for each vehicle status — labels, colors, icons.
 */
export const STATUS_META: Record<VehicleStatus, StatusMeta> = {
  draft: {
    label: { es: 'Borrador', en: 'Draft' },
    color: '#6b7280',
    icon: 'mdi:file-edit-outline',
    isFinal: false,
  },
  published: {
    label: { es: 'Publicado', en: 'Published' },
    color: '#22c55e',
    icon: 'mdi:check-circle',
    isFinal: false,
  },
  sold: {
    label: { es: 'Vendido', en: 'Sold' },
    color: '#3b82f6',
    icon: 'mdi:cash-check',
    isFinal: true,
  },
  archived: {
    label: { es: 'Archivado', en: 'Archived' },
    color: '#9ca3af',
    icon: 'mdi:archive',
    isFinal: true,
  },
  rented: {
    label: { es: 'Alquilado', en: 'Rented' },
    color: '#8b5cf6',
    icon: 'mdi:key-variant',
    isFinal: false,
  },
  maintenance: {
    label: { es: 'En mantenimiento', en: 'Maintenance' },
    color: '#f59e0b',
    icon: 'mdi:wrench',
    isFinal: false,
  },
  paused: {
    label: { es: 'Pausado', en: 'Paused' },
    color: '#ef4444',
    icon: 'mdi:pause-circle',
    isFinal: false,
  },
  expired: {
    label: { es: 'Expirado', en: 'Expired' },
    color: '#dc2626',
    icon: 'mdi:clock-alert',
    isFinal: false,
  },
}

/**
 * Get localized status label.
 */
export function getStatusLabel(
  status: VehicleStatus,
  locale: string = 'es',
): string {
  const meta = STATUS_META[status]
  if (!meta) return status
  return locale === 'en' ? meta.label.en : meta.label.es
}

export interface TransitionResult {
  success: boolean
  error?: string
  previousStatus?: VehicleStatus
  newStatus?: VehicleStatus
}

export function useListingLifecycle() {
  const supabase = useSupabaseClient()

  const transitioning = ref(false)
  const error = ref<string | null>(null)

  /**
   * Execute a status transition with validation and audit trail.
   */
  async function transition(
    vehicleId: string,
    targetStatus: VehicleStatus,
    options?: {
      dealerId?: string
      reason?: string
      salePrice?: number
      buyerName?: string
    },
  ): Promise<TransitionResult> {
    transitioning.value = true
    error.value = null

    try {
      // Get current vehicle status
      const { data: vehicle, error: fetchErr } = await supabase
        .from('vehicles')
        .select('id, status, dealer_id')
        .eq('id', vehicleId)
        .single()

      if (fetchErr || !vehicle) {
        const msg = 'Vehicle not found'
        error.value = msg
        return { success: false, error: msg }
      }

      const currentStatus = vehicle.status as VehicleStatus

      // Validate transition
      if (!isValidTransition(currentStatus, targetStatus)) {
        const msg = `Invalid transition: ${currentStatus} → ${targetStatus}`
        error.value = msg
        return { success: false, error: msg }
      }

      // Prepare update payload
      const updatePayload: Record<string, unknown> = {
        status: targetStatus,
        updated_at: new Date().toISOString(),
      }

      // Handle sale-specific fields
      if (targetStatus === 'sold' && options?.salePrice) {
        updatePayload.sale_price = options.salePrice
        updatePayload.sold_at = new Date().toISOString()
      }

      // Execute status update
      const { error: updateErr } = await supabase
        .from('vehicles')
        .update(updatePayload)
        .eq('id', vehicleId)

      if (updateErr) {
        error.value = updateErr.message
        return { success: false, error: updateErr.message }
      }

      // Log the transition as an analytics event (audit trail)
      await supabase.from('analytics_events').insert({
        event_type: 'status_transition',
        entity_type: 'vehicle',
        entity_id: vehicleId,
        metadata: {
          from: currentStatus,
          to: targetStatus,
          reason: options?.reason ?? null,
          dealer_id: options?.dealerId ?? vehicle.dealer_id,
          sale_price: options?.salePrice ?? null,
          buyer_name: options?.buyerName ?? null,
          timestamp: new Date().toISOString(),
        },
      })

      return {
        success: true,
        previousStatus: currentStatus,
        newStatus: targetStatus,
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Transition failed'
      error.value = msg
      return { success: false, error: msg }
    } finally {
      transitioning.value = false
    }
  }

  /**
   * Bulk status transition for multiple vehicles.
   */
  async function bulkTransition(
    vehicleIds: string[],
    targetStatus: VehicleStatus,
    options?: { dealerId?: string; reason?: string },
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> {
    const succeeded: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (const id of vehicleIds) {
      const result = await transition(id, targetStatus, options)
      if (result.success) {
        succeeded.push(id)
      } else {
        failed.push({ id, error: result.error ?? 'Unknown error' })
      }
    }

    return { succeeded, failed }
  }

  /**
   * Get transition history for a vehicle from analytics_events.
   */
  async function getTransitionHistory(
    vehicleId: string,
    limit: number = 20,
  ): Promise<Array<{
    from: VehicleStatus
    to: VehicleStatus
    reason: string | null
    timestamp: string
  }>> {
    const { data, error: fetchErr } = await supabase
      .from('analytics_events')
      .select('metadata, created_at')
      .eq('entity_id', vehicleId)
      .eq('event_type', 'status_transition')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (fetchErr || !data) return []

    return (data as Array<{ metadata: Record<string, unknown>; created_at: string }>).map((row) => ({
      from: (row.metadata?.from as VehicleStatus) ?? 'draft',
      to: (row.metadata?.to as VehicleStatus) ?? 'draft',
      reason: (row.metadata?.reason as string) ?? null,
      timestamp: row.created_at,
    }))
  }

  return {
    transitioning: readonly(transitioning),
    error: readonly(error),
    transition,
    bulkTransition,
    getTransitionHistory,
  }
}
