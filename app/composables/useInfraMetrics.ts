import { useSupabaseClient } from '#imports'

export interface InfraMetric {
  id: string
  vertical: string
  component: string
  metric_name: string
  metric_value: number
  metric_limit: number | null
  usage_percent: number | null
  recorded_at: string
  metadata: Record<string, unknown>
}

export interface InfraAlert {
  id: string
  component: string
  metric_name: string
  alert_level: 'warning' | 'critical' | 'emergency'
  message: string
  usage_percent: number | null
  sent_at: string
  acknowledged_at: string | null
  acknowledged_by: string | null
}

export interface InfraCluster {
  id: string
  name: string
  supabase_url: string
  verticals: string[]
  weight_used: number
  weight_limit: number
  status: 'active' | 'migrating' | 'full'
}

export function useInfraMetrics() {
  const supabase = useSupabaseClient()
  const metrics = ref<InfraMetric[]>([])
  const alerts = ref<InfraAlert[]>([])
  const clusters = ref<InfraCluster[]>([])
  const loading = ref(false)
  const error = ref('')

  function getPeriodDate(period: '24h' | '7d' | '30d'): string {
    const now = new Date()
    switch (period) {
      case '24h':
        now.setHours(now.getHours() - 24)
        break
      case '7d':
        now.setDate(now.getDate() - 7)
        break
      case '30d':
        now.setDate(now.getDate() - 30)
        break
    }
    return now.toISOString()
  }

  async function fetchMetrics(opts?: { component?: string; period?: '24h' | '7d' | '30d' }) {
    loading.value = true
    error.value = ''
    try {
      let query = supabase
        .from('infra_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })

      if (opts?.component) {
        query = query.eq('component', opts.component)
      }

      if (opts?.period) {
        const since = getPeriodDate(opts.period)
        query = query.gte('recorded_at', since)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        error.value = dbError.message
        return
      }

      metrics.value = (data ?? []) as InfraMetric[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching metrics'
    } finally {
      loading.value = false
    }
  }

  async function fetchAlerts(opts?: { all?: boolean; component?: string }) {
    loading.value = true
    error.value = ''
    try {
      let query = supabase.from('infra_alerts').select('*').order('sent_at', { ascending: false })

      if (!opts?.all) {
        query = query.is('acknowledged_at', null)
      }

      if (opts?.component) {
        query = query.eq('component', opts.component)
      }

      const { data, error: dbError } = await query

      if (dbError) {
        error.value = dbError.message
        return
      }

      alerts.value = (data ?? []) as InfraAlert[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching alerts'
    } finally {
      loading.value = false
    }
  }

  async function acknowledgeAlert(alertId: string) {
    error.value = ''
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      const { error: dbError } = await supabase
        .from('infra_alerts')
        .update({
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: user?.id ?? null,
        } as never)
        .eq('id', alertId)

      if (dbError) {
        error.value = dbError.message
        return
      }

      const idx = alerts.value.findIndex((a) => a.id === alertId)
      if (idx !== -1) {
        alerts.value = alerts.value.map((a, i) =>
          i === idx
            ? { ...a, acknowledged_at: new Date().toISOString(), acknowledged_by: user?.id ?? null }
            : a,
        )
      }
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error acknowledging alert'
    }
  }

  async function fetchClusters() {
    loading.value = true
    error.value = ''
    try {
      const { data, error: dbError } = await supabase
        .from('infra_clusters')
        .select('*')
        .order('name', { ascending: true })

      if (dbError) {
        error.value = dbError.message
        return
      }

      clusters.value = (data ?? []) as InfraCluster[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Error fetching clusters'
    } finally {
      loading.value = false
    }
  }

  function getLatest(component: string, metricName: string): InfraMetric | null {
    const match = metrics.value.find(
      (m) => m.component === component && m.metric_name === metricName,
    )
    return match ?? null
  }

  function getStatusColor(usagePercent: number | null): 'green' | 'yellow' | 'red' | 'gray' {
    if (usagePercent === null) return 'gray'
    if (usagePercent >= 90) return 'red'
    if (usagePercent >= 70) return 'yellow'
    return 'green'
  }

  const criticalAlertCount = computed(
    () =>
      alerts.value.filter(
        (a) =>
          !a.acknowledged_at && (a.alert_level === 'critical' || a.alert_level === 'emergency'),
      ).length,
  )

  return {
    metrics: readonly(metrics),
    alerts: readonly(alerts),
    clusters: readonly(clusters),
    loading: readonly(loading),
    error: readonly(error),
    fetchMetrics,
    fetchAlerts,
    acknowledgeAlert,
    fetchClusters,
    getLatest,
    getStatusColor,
    criticalAlertCount,
  }
}
