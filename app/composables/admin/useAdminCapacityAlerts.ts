/**
 * useAdminCapacityAlerts
 *
 * Reads recent capacity alerts from the capacity_alerts table.
 * Provides resolve action and status color helpers.
 *
 * #142 Bloque 18
 */
import { useSupabaseClient } from '#imports'

export interface CapacityAlert {
  id: string
  vertical: string
  metric: 'storage' | 'connections' | 'bandwidth'
  current_value: number
  threshold: number
  is_critical: boolean
  details: Record<string, unknown>
  notified_at: string | null
  resolved_at: string | null
  created_at: string
}

export function useAdminCapacityAlerts() {
  const supabase = useSupabaseClient()
  const alerts = ref<CapacityAlert[]>([])
  const loading = ref(false)
  const error = ref('')

  async function fetchAlerts(opts: { onlyUnresolved?: boolean } = {}) {
    loading.value = true
    error.value = ''
    try {
      let query = supabase
        .from('capacity_alerts')
        .select('id, vertical, metric, current_value, threshold, is_critical, details, notified_at, resolved_at, created_at')
        .order('created_at', { ascending: false })
        .limit(50)

      if (opts.onlyUnresolved !== false) {
        query = query.is('resolved_at', null)
      }

      const { data, error: dbErr } = await query
      if (dbErr) {
        error.value = dbErr.message
        return
      }
      alerts.value = (data ?? []) as unknown as CapacityAlert[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error loading capacity alerts'
    } finally {
      loading.value = false
    }
  }

  async function resolveAlert(alertId: string) {
    const { error: dbErr } = await supabase
      .from('capacity_alerts')
      .update({ resolved_at: new Date().toISOString() } as never)
      .eq('id', alertId)

    if (dbErr) {
      error.value = dbErr.message
      return
    }

    alerts.value = alerts.value.filter((a) => a.id !== alertId)
  }

  function statusColor(alert: CapacityAlert): 'red' | 'yellow' {
    return alert.is_critical ? 'red' : 'yellow'
  }

  function metricLabel(metric: CapacityAlert['metric']): string {
    const labels: Record<CapacityAlert['metric'], string> = {
      storage: 'Almacenamiento DB',
      connections: 'Conexiones activas',
      bandwidth: 'Ancho de banda',
    }
    return labels[metric] ?? metric
  }

  const criticalCount = computed(
    () => alerts.value.filter((a) => a.is_critical && !a.resolved_at).length,
  )

  const warningCount = computed(
    () => alerts.value.filter((a) => !a.is_critical && !a.resolved_at).length,
  )

  return {
    alerts: readonly(alerts),
    loading: readonly(loading),
    error: readonly(error),
    criticalCount,
    warningCount,
    fetchAlerts,
    resolveAlert,
    statusColor,
    metricLabel,
  }
}
