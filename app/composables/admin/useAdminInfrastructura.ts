import type { ChartOptions } from 'chart.js'
import {
  componentDefinitions,
  chartColors,
  buildComponentCard,
  buildHistoryCharts,
  type TabKey,
  type PeriodValue,
  type ComponentCardData,
  type HistoryChartData,
  type GetLatestFn,
  type GetStatusColorFn,
  type GetRecommendationFn,
} from '~/utils/infraCharts'

// Re-export types for consumers
export type { ComponentMetricDisplay, ComponentCardData, HistoryChartData } from '~/utils/infraCharts'

/** Composable for admin infrastructura. */
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
    {
      key: 'crons' as TabKey,
      label: t('admin.infra.tabs.crons', 'Cron Jobs'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
    },
  ])

  // ── Component cards (Tab 1) ──────────────────────────────
  const componentCards = computed<ComponentCardData[]>(() =>
    componentDefinitions.map((def) =>
      buildComponentCard(
        def,
        getLatest as GetLatestFn,
        getStatusColor as GetStatusColorFn,
        getRecommendation as GetRecommendationFn,
      ),
    ),
  )

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
        ).replace('{count}', String(Number(result.migrated) || 0))
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
        ).replace('{count}', String(Number(result.count) || 0))
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

  const historyChartDataSets = computed<HistoryChartData[]>(() =>
    buildHistoryCharts([...metrics.value], chartColors, componentDefinitions),
  )

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
        wizardProgress.value += (crypto.getRandomValues(new Uint8Array(1))[0]! % 15) + 5
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
