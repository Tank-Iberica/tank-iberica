import type { ChartData, ChartOptions } from 'chart.js'

type TabKey = 'status' | 'alerts' | 'history' | 'migration'
type PeriodValue = '24h' | '7d' | '30d'

export interface ComponentMetricDisplay {
  name: string
  label: string
  value: number
  limit: number
  percent: number | null
  recommendation: { level: string; message: string; action: string } | null
}

export interface ComponentCardData {
  key: string
  name: string
  icon: string
  overallStatus: 'green' | 'yellow' | 'red' | 'gray'
  metrics: ComponentMetricDisplay[]
}

export interface HistoryChartData {
  component: string
  label: string
  chartData: ChartData<'line'>
}

const componentDefinitions = [
  {
    key: 'supabase',
    name: 'Supabase',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="1" fill="currentColor"/><circle cx="16" cy="12" r="1" fill="currentColor"/><circle cx="10" cy="18" r="1" fill="currentColor"/></svg>',
    metrics: [
      { name: 'db_size_bytes', label: 'DB Size' },
      { name: 'connections', label: 'Connections' },
    ],
  },
  {
    key: 'cloudflare',
    name: 'Cloudflare',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M22 12A10 10 0 1012 2a10 10 0 0010 10z"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>',
    metrics: [{ name: 'workers_requests_day', label: 'Workers Req/day' }],
  },
  {
    key: 'cloudinary',
    name: 'Cloudinary',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg>',
    metrics: [
      { name: 'transformations_used', label: 'Transformations' },
      { name: 'storage_used_bytes', label: 'Storage' },
    ],
  },
  {
    key: 'cf_images',
    name: 'CF Images',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
    metrics: [{ name: 'images_stored', label: 'Images Stored' }],
  },
  {
    key: 'resend',
    name: 'Resend',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    metrics: [{ name: 'emails_sent_today', label: 'Emails Sent' }],
  },
  {
    key: 'sentry',
    name: 'Sentry',
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="22" height="22"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
    metrics: [{ name: 'events_month', label: 'Events/month' }],
  },
]

const chartColors: Record<string, string> = {
  supabase: '#3ECF8E',
  cloudflare: '#F6821F',
  cloudinary: '#3448C5',
  cf_images: '#F38020',
  resend: '#000000',
  sentry: '#362D59',
}

export function useAdminInfrastructura() {
  const { t } = useI18n()

  const {
    metrics,
    alerts,
    clusters,
    loading,
    error: infraError,
    fetchMetrics,
    fetchAlerts,
    fetchClusters,
    acknowledgeAlert,
    getLatest,
    getStatusColor,
    criticalAlertCount,
  } = useInfraMetrics()

  const { getRecommendation } = useInfraRecommendations()

  // ── Tabs ────────────────────────────────────────────────
  const activeTab = ref<TabKey>('status')

  const tabs = computed(() => [
    {
      key: 'status' as TabKey,
      label: t('admin.infra.tabs.status', 'Estado actual'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
    },
    {
      key: 'alerts' as TabKey,
      label: t('admin.infra.tabs.alerts', 'Alertas'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
    },
    {
      key: 'history' as TabKey,
      label: t('admin.infra.tabs.history', 'Historial'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    },
    {
      key: 'migration' as TabKey,
      label: t('admin.infra.tabs.migration', 'Migracion'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
    },
  ])

  // ── Component cards (Tab 1) ──────────────────────────────
  const componentCards = computed<ComponentCardData[]>(() => {
    return componentDefinitions.map((def) => {
      const metricDisplays: ComponentMetricDisplay[] = []
      let worstStatus: 'green' | 'yellow' | 'red' | 'gray' = 'gray'

      for (const metricDef of def.metrics) {
        const latest = getLatest(def.key, metricDef.name)
        if (latest) {
          const pct = latest.usage_percent ?? null
          const color = getStatusColor(pct)

          if (worstStatus === 'gray') worstStatus = color
          else if (color === 'red') worstStatus = 'red'
          else if (color === 'yellow' && worstStatus !== 'red') worstStatus = 'yellow'

          const rec = pct !== null ? getRecommendation(def.key, metricDef.name, pct) : null

          metricDisplays.push({
            name: metricDef.name,
            label: metricDef.label,
            value: latest.metric_value,
            limit: latest.metric_limit ?? 0,
            percent: pct,
            recommendation: rec
              ? { level: rec.level, message: rec.message, action: rec.action }
              : null,
          })
        }
      }

      return {
        key: def.key,
        name: def.name,
        icon: def.icon,
        overallStatus: worstStatus,
        metrics: metricDisplays,
      }
    })
  })

  // ── Image Pipeline (Tab 1) ───────────────────────────────
  const pipelineMode = ref('hybrid')
  const cloudinaryOnlyCount = ref(0)
  const cfImagesCount = ref(0)
  const migratingImages = ref(false)
  const configuringVariants = ref(false)
  const pipelineMessage = ref('')
  const pipelineMessageType = ref<'success' | 'error'>('success')

  async function loadPipelineData() {
    try {
      const { data } = await useFetch('/api/infra/pipeline-status')
      if (data.value) {
        const result = data.value as Record<string, unknown>
        pipelineMode.value = (result.mode as string) || 'hybrid'
        cloudinaryOnlyCount.value = (result.cloudinaryOnly as number) || 0
        cfImagesCount.value = (result.cfImages as number) || 0
      }
    } catch {
      // endpoint may not exist yet
    }
  }

  async function migrateImages() {
    migratingImages.value = true
    pipelineMessage.value = ''
    try {
      const { data, error: fetchError } = await useFetch('/api/infra/migrate-images', {
        method: 'POST',
      })
      if (fetchError.value) {
        pipelineMessage.value =
          fetchError.value.message || t('admin.infra.migrationError', 'Error al migrar imagenes')
        pipelineMessageType.value = 'error'
      } else {
        const result = (data.value as Record<string, unknown>) || {}
        pipelineMessage.value = t(
          'admin.infra.imagesMigrated',
          'Imagenes migradas: {count}',
        ).replace('{count}', String(result.migrated || 0))
        pipelineMessageType.value = 'success'
        await loadPipelineData()
      }
    } catch {
      pipelineMessage.value = t('admin.infra.migrationError', 'Error al migrar imagenes')
      pipelineMessageType.value = 'error'
    } finally {
      migratingImages.value = false
    }
  }

  async function setupCfVariants() {
    configuringVariants.value = true
    pipelineMessage.value = ''
    try {
      const { data, error: fetchError } = await useFetch('/api/infra/setup-cf-variants', {
        method: 'POST',
      })
      if (fetchError.value) {
        pipelineMessage.value =
          fetchError.value.message ||
          t('admin.infra.variantsError', 'Error al configurar variantes')
        pipelineMessageType.value = 'error'
      } else {
        const result = (data.value as Record<string, unknown>) || {}
        pipelineMessage.value = t(
          'admin.infra.variantsConfigured',
          'Variantes configuradas: {count}',
        ).replace('{count}', String(result.count || 0))
        pipelineMessageType.value = 'success'
      }
    } catch {
      pipelineMessage.value = t('admin.infra.variantsError', 'Error al configurar variantes')
      pipelineMessageType.value = 'error'
    } finally {
      configuringVariants.value = false
    }
  }

  // ── Alerts tab ───────────────────────────────────────────
  async function handleAcknowledge(alertId: string) {
    await acknowledgeAlert(alertId)
  }

  // ── History / Charts (Tab 3) ─────────────────────────────
  const selectedPeriod = ref<PeriodValue>('7d')

  async function changePeriod(period: PeriodValue) {
    selectedPeriod.value = period
    await fetchMetrics({ period })
  }

  const historyChartDataSets = computed<HistoryChartData[]>(() => {
    const grouped = new Map<string, InfraMetric[]>()
    for (const m of metrics.value) {
      if (!grouped.has(m.component)) grouped.set(m.component, [])
      grouped.get(m.component)!.push(m)
    }

    const charts: HistoryChartData[] = []
    for (const [component, compMetrics] of grouped) {
      const byMetric = new Map<string, InfraMetric[]>()
      for (const m of compMetrics) {
        if (!byMetric.has(m.metric_name)) byMetric.set(m.metric_name, [])
        byMetric.get(m.metric_name)!.push(m)
      }

      const datasets: ChartData<'line'>['datasets'] = []
      let labels: string[] = []

      for (const [metricName, metricValues] of byMetric) {
        const sorted = [...metricValues].sort(
          (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime(),
        )
        if (labels.length === 0) {
          labels = sorted.map((m) =>
            new Date(m.recorded_at).toLocaleDateString('es-ES', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            }),
          )
        }
        const color = chartColors[component] || '#23424A'
        datasets.push({
          label: metricName,
          data: sorted.map((m) => m.metric_value),
          borderColor: color,
          backgroundColor: color + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5,
        })
      }

      if (datasets.length > 0) {
        const def = componentDefinitions.find((d) => d.key === component)
        charts.push({ component, label: def?.name || component, chartData: { labels, datasets } })
      }
    }
    return charts
  })

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 }, maxRotation: 45 } },
      y: {
        beginAtZero: true,
        grid: { color: '#E5E7EB' },
        ticks: {
          font: { size: 11 },
          callback: function (value: string | number) {
            const num = typeof value === 'string' ? Number(value) : value
            if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M'
            if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K'
            return String(num)
          },
        },
      },
    },
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, font: { size: 12 } } },
      tooltip: {
        backgroundColor: '#1F2937',
        titleFont: { size: 13 },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
      },
    },
  }

  // ── Migration Wizard (Tab 4) ─────────────────────────────
  const wizardOpen = ref(false)
  const wizardStep = ref(0)
  const wizardVertical = ref('')
  const wizardTargetCluster = ref('')
  const wizardConfirmed = ref(false)
  const wizardExecuting = ref(false)
  const wizardComplete = ref(false)
  const wizardProgress = ref(0)
  const wizardResult = ref<'success' | 'error'>('success')
  const wizardErrorMessage = ref('')

  function openMigrationWizard() {
    wizardOpen.value = true
    wizardStep.value = 0
    wizardVertical.value = ''
    wizardTargetCluster.value = ''
    wizardConfirmed.value = false
    wizardExecuting.value = false
    wizardComplete.value = false
    wizardProgress.value = 0
    wizardResult.value = 'success'
    wizardErrorMessage.value = ''
  }

  function closeWizard() {
    wizardOpen.value = false
  }

  async function executeMigration() {
    wizardExecuting.value = true
    wizardProgress.value = 0
    const progressInterval = setInterval(() => {
      if (wizardProgress.value < 90) {
        wizardProgress.value += Math.floor(Math.random() * 15) + 5
        if (wizardProgress.value > 90) wizardProgress.value = 90
      }
    }, 800)

    try {
      const { error: fetchError } = await useFetch('/api/infra/migrate-vertical', {
        method: 'POST',
        body: { vertical: wizardVertical.value, targetClusterId: wizardTargetCluster.value },
      })
      clearInterval(progressInterval)
      wizardProgress.value = 100
      if (fetchError.value) {
        wizardResult.value = 'error'
        wizardErrorMessage.value =
          fetchError.value.message || t('admin.infra.migrationError', 'Error en la migracion')
      } else {
        wizardResult.value = 'success'
        await fetchClusters()
      }
    } catch (e) {
      clearInterval(progressInterval)
      wizardProgress.value = 100
      wizardResult.value = 'error'
      wizardErrorMessage.value =
        e instanceof Error ? e.message : t('admin.infra.migrationError', 'Error en la migracion')
    } finally {
      wizardExecuting.value = false
      wizardComplete.value = true
      wizardStep.value = 4
    }
  }

  // ── Init ────────────────────────────────────────────────
  async function init(): Promise<void> {
    await Promise.allSettled([
      fetchMetrics({ period: selectedPeriod.value }),
      fetchAlerts({ all: false }),
      fetchClusters(),
      loadPipelineData(),
    ])
  }

  return {
    // from useInfraMetrics
    alerts,
    clusters,
    loading,
    infraError,
    criticalAlertCount,
    getStatusColor,
    // tabs
    activeTab,
    tabs,
    // component cards
    componentCards,
    // pipeline
    pipelineMode,
    cloudinaryOnlyCount,
    cfImagesCount,
    migratingImages,
    configuringVariants,
    pipelineMessage,
    pipelineMessageType,
    migrateImages,
    setupCfVariants,
    // alerts tab
    handleAcknowledge,
    // history
    historyChartDataSets,
    chartOptions,
    changePeriod,
    // wizard
    wizardOpen,
    wizardStep,
    wizardVertical,
    wizardTargetCluster,
    wizardConfirmed,
    wizardExecuting,
    wizardComplete,
    wizardProgress,
    wizardResult,
    wizardErrorMessage,
    openMigrationWizard,
    closeWizard,
    executeMigration,
    // init
    init,
  }
}
