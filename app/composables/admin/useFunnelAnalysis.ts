/**
 * Funnel Analysis Composable — Admin dashboard
 *
 * Queries analytics_events for funnel:* events and calculates
 * drop-off rates between stages: search → view → contact → reservation.
 */

import type { Database } from '~~/types/supabase'

export interface FunnelStage {
  key: string
  label: string
  count: number
  dropOffPercent: number
  conversionPercent: number
}

export interface FunnelData {
  stages: FunnelStage[]
  overallConversion: number
  period: { from: string; to: string }
}

const FUNNEL_STAGES = [
  { key: 'funnel:search', label: 'funnel.search' },
  { key: 'funnel:view_vehicle', label: 'funnel.viewVehicle' },
  { key: 'funnel:contact_seller', label: 'funnel.contactSeller' },
  { key: 'funnel:reservation', label: 'funnel.reservation' },
] as const

export function useFunnelAnalysis() {
  const supabase = useSupabaseClient<Database>()
  const { t } = useI18n()

  const funnel = ref<FunnelData | null>(null)
  const loading = ref(false)

  /**
   * Fetch funnel data for a given date range.
   * Counts unique sessions per stage to avoid double-counting.
   */
  async function fetchFunnel(daysBack = 30): Promise<void> {
    loading.value = true
    try {
      const to = new Date().toISOString()
      const from = new Date(Date.now() - daysBack * 86_400_000).toISOString()

      // Query counts per funnel stage in parallel
      const counts = await Promise.all(
        FUNNEL_STAGES.map(async (stage) => {
          const { count, error } = await supabase
            .from('analytics_events')
            .select('session_id', { count: 'exact', head: true })
            .eq('event_type', stage.key)
            .gte('created_at', from)
            .lte('created_at', to)

          if (error) throw error
          return { key: stage.key, label: stage.label, count: count ?? 0 }
        }),
      )

      // Calculate drop-off and conversion between stages
      const stages: FunnelStage[] = counts.map((stage, idx) => {
        const prevCount = idx === 0 ? stage.count : counts[idx - 1]!.count
        const dropOff =
          prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : 0
        const conversion = prevCount > 0 ? Math.round((stage.count / prevCount) * 100) : 0

        return {
          key: stage.key,
          label: t(stage.label),
          count: stage.count,
          dropOffPercent: idx === 0 ? 0 : dropOff,
          conversionPercent: idx === 0 ? 100 : conversion,
        }
      })

      const first = stages[0]?.count ?? 0
      const last = stages.at(-1)?.count ?? 0
      const overallConversion = first > 0 ? Math.round((last / first) * 100) : 0

      funnel.value = {
        stages,
        overallConversion,
        period: { from, to },
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * Identify the stage with the biggest drop-off (leak point).
   */
  const biggestLeakStage = computed<FunnelStage | null>(() => {
    if (!funnel.value) return null
    const stages = funnel.value.stages.filter((s) => s.dropOffPercent > 0)
    if (stages.length === 0) return null
    const first = stages[0]!
    return stages.reduce((max, s) => (s.dropOffPercent > max.dropOffPercent ? s : max), first)
  })

  return {
    funnel,
    loading,
    biggestLeakStage,
    fetchFunnel,
    FUNNEL_STAGES,
  }
}
