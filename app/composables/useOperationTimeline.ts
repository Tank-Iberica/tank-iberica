/**
 * Operation Timeline Composable
 *
 * Tracks the lifecycle of a vehicle transaction:
 * listed → contacted → visit → offer → payment → delivery → completed
 */

import type { Database } from '~~/types/supabase'

export type OperationStage =
  | 'listed'
  | 'contacted'
  | 'visit_scheduled'
  | 'visit_done'
  | 'offer_made'
  | 'offer_accepted'
  | 'payment_pending'
  | 'payment_received'
  | 'documentation'
  | 'delivery_scheduled'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'

export interface TimelineEntry {
  id: string
  vehicle_id: string
  dealer_id: string
  buyer_id: string | null
  stage: OperationStage
  notes: string | null
  metadata: Record<string, unknown>
  created_by: string
  created_at: string
}

/** Ordered stages for the happy path (used for progress calculation) */
const HAPPY_PATH: OperationStage[] = [
  'listed',
  'contacted',
  'visit_scheduled',
  'visit_done',
  'offer_made',
  'offer_accepted',
  'payment_pending',
  'payment_received',
  'documentation',
  'delivery_scheduled',
  'delivered',
  'completed',
]

/** Composable for operation timeline. */
export function useOperationTimeline() {
  const supabase = useSupabaseClient<Database>()
  const user = useSupabaseUser()
  const { t } = useI18n()

  const entries = ref<TimelineEntry[]>([])
  const loading = ref(false)

  const currentStage = computed<OperationStage | null>(() => {
    if (entries.value.length === 0) return null
    return entries.value.at(-1)?.stage ?? null
  })

  const progressPercent = computed<number>(() => {
    if (!currentStage.value) return 0
    const idx = HAPPY_PATH.indexOf(currentStage.value)
    if (idx === -1) return 0
    return Math.round(((idx + 1) / HAPPY_PATH.length) * 100)
  })

  const isCancelled = computed<boolean>(() => {
    return currentStage.value === 'cancelled' || currentStage.value === 'returned'
  })

  const isCompleted = computed<boolean>(() => {
    return currentStage.value === 'completed'
  })

  async function fetchTimeline(vehicleId: string): Promise<void> {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('operation_timeline')
        .select(
          'id, vehicle_id, dealer_id, buyer_id, stage, notes, metadata, created_by, created_at',
        )
        .eq('vehicle_id', vehicleId)
        .order('created_at', { ascending: true })

      if (error) throw error
      entries.value = (data ?? []) as TimelineEntry[]
    } finally {
      loading.value = false
    }
  }

  async function addEntry(
    vehicleId: string,
    dealerId: string,
    stage: OperationStage,
    opts?: { buyerId?: string; notes?: string; metadata?: Record<string, unknown> },
  ): Promise<void> {
    if (!user.value) return

    const { error } = await supabase.from('operation_timeline').insert({
      vehicle_id: vehicleId,
      dealer_id: dealerId,
      buyer_id: opts?.buyerId || null,
      stage,
      notes: opts?.notes || null,
      metadata: (opts?.metadata || {}) as import('~/types/database.types').Json,
      created_by: user.value.id,
    })

    if (error) throw error
    await fetchTimeline(vehicleId)
  }

  function stageLabel(stage: OperationStage): string {
    return t(`timeline.stages.${stage}`)
  }

  return {
    entries,
    loading,
    currentStage,
    progressPercent,
    isCancelled,
    isCompleted,
    HAPPY_PATH,
    fetchTimeline,
    addEntry,
    stageLabel,
  }
}
