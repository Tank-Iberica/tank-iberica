<template>
  <div class="infra-page">
    <!-- Page Header -->
    <div class="infra-header">
      <h1 class="infra-title">{{ $t('admin.infra.seoTitle', 'Infraestructura') }}</h1>
      <span v-if="criticalAlertCount > 0" class="infra-alert-badge">
        {{ criticalAlertCount }}
      </span>
    </div>

    <!-- Tab Bar -->
    <div class="tab-bar">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <!-- eslint-disable-next-line vue/no-v-html -->
        <span class="tab-icon" v-html="tab.icon" />
        <span class="tab-label">{{ tab.label }}</span>
      </button>
    </div>

    <!-- Loading overlay -->
    <div v-if="loading" class="infra-loading">
      <div class="infra-spinner" />
      <span>{{ $t('admin.infra.loading', 'Cargando datos...') }}</span>
    </div>

    <!-- Error banner -->
    <div v-if="infraError" class="infra-error-banner">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        class="error-icon"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      <span>{{ infraError }}</span>
    </div>

    <!-- Tab Content -->
    <div v-show="activeTab === 'status'" class="tab-content">
      <InfraOverview
        :component-cards="componentCards"
        :clusters="clusters"
        :pipeline-mode="pipelineMode"
        :cloudinary-only-count="cloudinaryOnlyCount"
        :cf-images-count="cfImagesCount"
        :migrating-images="migratingImages"
        :configuring-variants="configuringVariants"
        :pipeline-message="pipelineMessage"
        :pipeline-message-type="pipelineMessageType"
        :get-status-color="getStatusColor"
        @migrate-images="migrateImages"
        @setup-cf-variants="setupCfVariants"
      />
    </div>

    <div v-show="activeTab === 'alerts'" class="tab-content">
      <InfraAlerts :alerts="alerts" @acknowledge="handleAcknowledge" />
    </div>

    <div v-show="activeTab === 'history'" class="tab-content">
      <InfraHistory
        :history-chart-data-sets="historyChartDataSets"
        :chart-options="chartOptions"
        @change-period="changePeriod"
      />
    </div>

    <div v-show="activeTab === 'migration'" class="tab-content">
      <InfraMigration
        :clusters="clusters"
        :wizard-open="wizardOpen"
        :wizard-step="wizardStep"
        :wizard-vertical="wizardVertical"
        :wizard-target-cluster="wizardTargetCluster"
        :wizard-confirmed="wizardConfirmed"
        :wizard-executing="wizardExecuting"
        :wizard-complete="wizardComplete"
        :wizard-progress="wizardProgress"
        :wizard-result="wizardResult"
        :wizard-error-message="wizardErrorMessage"
        :get-status-color="getStatusColor"
        @open-wizard="openMigrationWizard"
        @close-wizard="closeWizard"
        @update:wizard-step="wizardStep = $event"
        @update:wizard-vertical="wizardVertical = $event"
        @update:wizard-target-cluster="wizardTargetCluster = $event"
        @update:wizard-confirmed="wizardConfirmed = $event"
        @execute-migration="executeMigration"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChartData, ChartOptions } from 'chart.js'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'admin'],
})

const { t: $t } = useI18n()

useHead({
  title: $t('admin.infra.seoTitle', 'Infraestructura - Admin'),
})

// ---------------------------------------------------------------------------
// Composables
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabKey = 'status' | 'alerts' | 'history' | 'migration'

const activeTab = ref<TabKey>('status')

const tabs = computed(() => [
  {
    key: 'status' as TabKey,
    label: $t('admin.infra.tabs.status', 'Estado actual'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
  },
  {
    key: 'alerts' as TabKey,
    label: $t('admin.infra.tabs.alerts', 'Alertas'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>',
  },
  {
    key: 'history' as TabKey,
    label: $t('admin.infra.tabs.history', 'Historial'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  },
  {
    key: 'migration' as TabKey,
    label: $t('admin.infra.tabs.migration', 'Migracion'),
    icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>',
  },
])

// ---------------------------------------------------------------------------
// Component cards for Tab 1
// ---------------------------------------------------------------------------

interface ComponentMetricDisplay {
  name: string
  label: string
  value: number
  limit: number
  percent: number | null
  recommendation: { level: string; message: string; action: string } | null
}

interface ComponentCardData {
  key: string
  name: string
  icon: string
  overallStatus: 'green' | 'yellow' | 'red' | 'gray'
  metrics: ComponentMetricDisplay[]
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

// ---------------------------------------------------------------------------
// Image Pipeline (Tab 1)
// ---------------------------------------------------------------------------

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
    // Pipeline status endpoint may not exist yet
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
        fetchError.value.message || $t('admin.infra.migrationError', 'Error al migrar imagenes')
      pipelineMessageType.value = 'error'
    } else {
      const result = (data.value as Record<string, unknown>) || {}
      pipelineMessage.value = $t(
        'admin.infra.imagesMigrated',
        'Imagenes migradas: {count}',
      ).replace('{count}', String(result.migrated || 0))
      pipelineMessageType.value = 'success'
      await loadPipelineData()
    }
  } catch {
    pipelineMessage.value = $t('admin.infra.migrationError', 'Error al migrar imagenes')
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
        fetchError.value.message || $t('admin.infra.variantsError', 'Error al configurar variantes')
      pipelineMessageType.value = 'error'
    } else {
      const result = (data.value as Record<string, unknown>) || {}
      pipelineMessage.value = $t(
        'admin.infra.variantsConfigured',
        'Variantes configuradas: {count}',
      ).replace('{count}', String(result.count || 0))
      pipelineMessageType.value = 'success'
    }
  } catch {
    pipelineMessage.value = $t('admin.infra.variantsError', 'Error al configurar variantes')
    pipelineMessageType.value = 'error'
  } finally {
    configuringVariants.value = false
  }
}

// ---------------------------------------------------------------------------
// Tab 2: Alerts
// ---------------------------------------------------------------------------

async function handleAcknowledge(alertId: string) {
  await acknowledgeAlert(alertId)
}

// ---------------------------------------------------------------------------
// Tab 3: History / Charts
// ---------------------------------------------------------------------------

type PeriodValue = '24h' | '7d' | '30d'

const selectedPeriod = ref<PeriodValue>('7d')

async function changePeriod(period: PeriodValue) {
  selectedPeriod.value = period
  await fetchMetrics({ period })
}

const chartColors: Record<string, string> = {
  supabase: '#3ECF8E',
  cloudflare: '#F6821F',
  cloudinary: '#3448C5',
  cf_images: '#F38020',
  resend: '#000000',
  sentry: '#362D59',
}

interface HistoryChartData {
  component: string
  label: string
  chartData: ChartData<'line'>
}

const historyChartDataSets = computed<HistoryChartData[]>(() => {
  // Group metrics by component
  const grouped = new Map<string, typeof metrics.value>()

  for (const m of metrics.value) {
    if (!grouped.has(m.component)) {
      grouped.set(m.component, [])
    }
    grouped.get(m.component)!.push(m)
  }

  const charts: HistoryChartData[] = []

  for (const [component, compMetrics] of grouped) {
    // Group by metric_name within this component
    const byMetric = new Map<string, typeof compMetrics>()
    for (const m of compMetrics) {
      if (!byMetric.has(m.metric_name)) {
        byMetric.set(m.metric_name, [])
      }
      byMetric.get(m.metric_name)!.push(m)
    }

    const datasets: ChartData<'line'>['datasets'] = []
    let labels: string[] = []

    for (const [metricName, metricValues] of byMetric) {
      // Sort by recorded_at ascending
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
      charts.push({
        component,
        label: def?.name || component,
        chartData: { labels, datasets },
      })
    }
  }

  return charts
})

const chartOptions: ChartOptions<'line'> = {
  responsive: true,
  maintainAspectRatio: false,
  interaction: {
    mode: 'index',
    intersect: false,
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 }, maxRotation: 45 },
    },
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
    legend: {
      position: 'bottom',
      labels: { usePointStyle: true, font: { size: 12 } },
    },
    tooltip: {
      backgroundColor: '#1F2937',
      titleFont: { size: 13 },
      bodyFont: { size: 12 },
      padding: 10,
      cornerRadius: 8,
    },
  },
}

// ---------------------------------------------------------------------------
// Tab 4: Migration Wizard
// ---------------------------------------------------------------------------

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

  // Simulate progress increments
  const progressInterval = setInterval(() => {
    if (wizardProgress.value < 90) {
      wizardProgress.value += Math.floor(Math.random() * 15) + 5
      if (wizardProgress.value > 90) wizardProgress.value = 90
    }
  }, 800)

  try {
    const { error: fetchError } = await useFetch('/api/infra/migrate-vertical', {
      method: 'POST',
      body: {
        vertical: wizardVertical.value,
        targetClusterId: wizardTargetCluster.value,
      },
    })

    clearInterval(progressInterval)

    if (fetchError.value) {
      wizardProgress.value = 100
      wizardResult.value = 'error'
      wizardErrorMessage.value =
        fetchError.value.message || $t('admin.infra.migrationError', 'Error en la migracion')
    } else {
      wizardProgress.value = 100
      wizardResult.value = 'success'
      // Refresh clusters data
      await fetchClusters()
    }
  } catch (e) {
    clearInterval(progressInterval)
    wizardProgress.value = 100
    wizardResult.value = 'error'
    wizardErrorMessage.value =
      e instanceof Error ? e.message : $t('admin.infra.migrationError', 'Error en la migracion')
  } finally {
    wizardExecuting.value = false
    wizardComplete.value = true
    wizardStep.value = 4
  }
}

// ---------------------------------------------------------------------------
// Initial data loading
// ---------------------------------------------------------------------------

onMounted(async () => {
  await Promise.allSettled([
    fetchMetrics({ period: selectedPeriod.value }),
    fetchAlerts({ all: false }),
    fetchClusters(),
    loadPipelineData(),
  ])
})
</script>

<style scoped>
/* ================================================
   Infrastructure Page — Mobile-first
   ================================================ */

.infra-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0;
}

/* Page Header */
.infra-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-6);
}

.infra-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin: 0;
}

.infra-alert-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 24px;
  padding: 0 6px;
  background: var(--color-error);
  color: var(--color-white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  border-radius: var(--border-radius-full);
}

/* Tab Bar */
.tab-bar {
  display: flex;
  gap: var(--spacing-1);
  border-bottom: 2px solid var(--border-color);
  margin-bottom: var(--spacing-6);
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}

.tab-bar::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  padding: var(--spacing-3) var(--spacing-4);
  background: none;
  border: none;
  border-bottom: 3px solid transparent;
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  white-space: nowrap;
  transition: all var(--transition-fast);
  min-height: 48px;
  min-width: 44px;
  cursor: pointer;
  margin-bottom: -2px;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-btn.active {
  color: var(--color-primary);
  border-bottom-color: var(--color-primary);
  font-weight: var(--font-weight-semibold);
}

.tab-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tab-label {
  display: none;
}

@media (min-width: 480px) {
  .tab-label {
    display: inline;
  }
}

/* Loading */
.infra-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-8);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
}

.infra-spinner {
  width: 24px;
  height: 24px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Error Banner */
.infra-error-banner {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: var(--border-radius-md);
  color: #b91c1c;
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-4);
}

.error-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Tab Content */
.tab-content {
  min-height: 200px;
}
</style>
