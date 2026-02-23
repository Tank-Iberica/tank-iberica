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

    <!-- ============================== -->
    <!-- TAB 1: Estado actual            -->
    <!-- ============================== -->
    <div v-show="activeTab === 'status'" class="tab-content">
      <h2 class="section-heading">
        {{ $t('admin.infra.componentStatus', 'Estado de componentes') }}
      </h2>

      <!-- Component Cards Grid -->
      <div class="component-grid">
        <div v-for="comp in componentCards" :key="comp.key" class="component-card">
          <div class="component-card-header">
            <span class="component-icon" v-html="comp.icon" />
            <span class="component-name">{{ comp.name }}</span>
            <span
              class="status-dot"
              :class="'status-' + comp.overallStatus"
              :title="statusLabel(comp.overallStatus)"
            />
          </div>

          <div v-if="comp.metrics.length === 0" class="component-not-configured">
            {{ $t('admin.infra.notConfigured', 'No configurado') }}
          </div>

          <div v-else class="component-metrics">
            <div v-for="metric in comp.metrics" :key="metric.name" class="metric-row">
              <div class="metric-label-row">
                <span class="metric-label">{{ metric.label }}</span>
                <span class="metric-value-text">
                  {{ formatMetricValue(metric.value) }} / {{ formatMetricValue(metric.limit) }}
                </span>
              </div>
              <div class="progress-bar-container">
                <div
                  class="progress-bar-fill"
                  :class="'progress-' + getStatusColor(metric.percent)"
                  :style="{ width: Math.min(metric.percent ?? 0, 100) + '%' }"
                />
              </div>
              <!-- Recommendation -->
              <div
                v-if="metric.recommendation"
                class="metric-recommendation"
                :class="'rec-' + metric.recommendation.level"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="rec-icon"
                >
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div class="rec-content">
                  <span class="rec-message">{{ metric.recommendation.message }}</span>
                  <span class="rec-action">{{ metric.recommendation.action }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Image Pipeline Section -->
      <div class="section-block">
        <h2 class="section-heading">
          {{ $t('admin.infra.imagePipeline', 'Pipeline de imagenes') }}
        </h2>
        <div class="pipeline-grid">
          <div class="pipeline-card">
            <span class="pipeline-label">{{ $t('admin.infra.pipelineMode', 'Modo actual') }}</span>
            <span class="pipeline-value">{{ pipelineMode }}</span>
          </div>
          <div class="pipeline-card">
            <span class="pipeline-label">{{
              $t('admin.infra.cloudinaryOnly', 'Solo Cloudinary')
            }}</span>
            <span class="pipeline-value">{{ cloudinaryOnlyCount }}</span>
          </div>
          <div class="pipeline-card">
            <span class="pipeline-label">{{ $t('admin.infra.cfImagesCount', 'CF Images') }}</span>
            <span class="pipeline-value">{{ cfImagesCount }}</span>
          </div>
        </div>
        <div class="pipeline-actions">
          <button class="btn-primary" :disabled="migratingImages" @click="migrateImages">
            {{
              migratingImages
                ? $t('admin.infra.migrating', 'Migrando...')
                : $t('admin.infra.migrateImages', 'Migrar imagenes pendientes')
            }}
          </button>
          <button class="btn-secondary" :disabled="configuringVariants" @click="setupCfVariants">
            {{
              configuringVariants
                ? $t('admin.infra.configuring', 'Configurando...')
                : $t('admin.infra.setupVariants', 'Configurar variantes CF')
            }}
          </button>
        </div>
        <div v-if="pipelineMessage" class="pipeline-message" :class="pipelineMessageType">
          {{ pipelineMessage }}
        </div>
      </div>

      <!-- Clusters Section -->
      <div class="section-block">
        <h2 class="section-heading">{{ $t('admin.infra.clusters', 'Clusters') }}</h2>
        <div v-if="clusters.length === 0" class="empty-state">
          {{ $t('admin.infra.noClusters', 'No hay clusters configurados') }}
        </div>
        <div v-else class="cluster-list">
          <div v-for="cluster in clusters" :key="cluster.id" class="cluster-card">
            <div class="cluster-header">
              <span class="cluster-name">{{ cluster.name }}</span>
              <span class="cluster-badge" :class="'badge-' + cluster.status">
                {{ clusterStatusLabel(cluster.status) }}
              </span>
            </div>
            <div class="cluster-verticals">
              <span v-for="vertical in cluster.verticals" :key="vertical" class="vertical-tag">
                {{ vertical }}
              </span>
            </div>
            <div class="cluster-weight">
              <div class="metric-label-row">
                <span class="metric-label">{{ $t('admin.infra.capacity', 'Capacidad') }}</span>
                <span class="metric-value-text">
                  {{ cluster.weight_used }} / {{ cluster.weight_limit }}
                </span>
              </div>
              <div class="progress-bar-container">
                <div
                  class="progress-bar-fill"
                  :class="'progress-' + getStatusColor(clusterPercent(cluster))"
                  :style="{ width: Math.min(clusterPercent(cluster), 100) + '%' }"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================== -->
    <!-- TAB 2: Alertas                  -->
    <!-- ============================== -->
    <div v-show="activeTab === 'alerts'" class="tab-content">
      <div class="alerts-toolbar">
        <div class="alerts-filters">
          <button
            class="filter-btn"
            :class="{ active: alertFilter === 'all' }"
            @click="alertFilter = 'all'"
          >
            {{ $t('admin.infra.alertsAll', 'Todas') }}
          </button>
          <button
            class="filter-btn"
            :class="{ active: alertFilter === 'unacknowledged' }"
            @click="alertFilter = 'unacknowledged'"
          >
            {{ $t('admin.infra.alertsUnack', 'Pendientes') }}
          </button>
          <select v-model="alertComponentFilter" class="filter-select">
            <option value="">{{ $t('admin.infra.allComponents', 'Todos los componentes') }}</option>
            <option value="supabase">Supabase</option>
            <option value="cloudflare">Cloudflare</option>
            <option value="cloudinary">Cloudinary</option>
            <option value="cf_images">CF Images</option>
            <option value="resend">Resend</option>
            <option value="sentry">Sentry</option>
          </select>
        </div>
      </div>

      <div v-if="filteredAlerts.length === 0" class="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="empty-icon"
        >
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
        <span>{{ $t('admin.infra.noAlerts', 'Sin alertas pendientes') }}</span>
      </div>

      <div v-else class="alerts-list">
        <div
          v-for="alert in filteredAlerts"
          :key="alert.id"
          class="alert-item"
          :class="{ acknowledged: !!alert.acknowledged_at }"
        >
          <div class="alert-meta">
            <span class="alert-timestamp">{{ formatTimestamp(alert.sent_at) }}</span>
            <span class="alert-component">{{ alert.component }}</span>
          </div>
          <div class="alert-body">
            <span class="alert-level-badge" :class="'level-' + alert.alert_level">
              {{ alertLevelLabel(alert.alert_level) }}
            </span>
            <span class="alert-metric">{{ alert.metric_name }}</span>
            <span class="alert-message">{{ alert.message }}</span>
          </div>
          <div class="alert-actions">
            <button
              v-if="!alert.acknowledged_at"
              class="btn-acknowledge"
              @click="handleAcknowledge(alert.id)"
            >
              {{ $t('admin.infra.acknowledge', 'Confirmar') }}
            </button>
            <span v-else class="acknowledged-label">
              {{ $t('admin.infra.acknowledged', 'Confirmada') }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================== -->
    <!-- TAB 3: Historial                -->
    <!-- ============================== -->
    <div v-show="activeTab === 'history'" class="tab-content">
      <div class="history-toolbar">
        <div class="period-selector">
          <button
            v-for="p in periods"
            :key="p.value"
            class="period-btn"
            :class="{ active: selectedPeriod === p.value }"
            @click="changePeriod(p.value)"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <div v-if="historyChartDataSets.length === 0" class="empty-state">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          class="empty-icon"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
        <span>{{
          $t('admin.infra.noHistory', 'Sin datos historicos para el periodo seleccionado')
        }}</span>
      </div>

      <div v-else class="charts-grid">
        <div v-for="chart in historyChartDataSets" :key="chart.component" class="chart-card">
          <h3 class="chart-title">{{ chart.label }}</h3>
          <div class="chart-container">
            <Line :data="chart.chartData" :options="chartOptions" />
          </div>
        </div>
      </div>
    </div>

    <!-- ============================== -->
    <!-- TAB 4: Migracion                -->
    <!-- ============================== -->
    <div v-show="activeTab === 'migration'" class="tab-content">
      <!-- Clusters overview -->
      <h2 class="section-heading">
        {{ $t('admin.infra.clusterOverview', 'Clusters disponibles') }}
      </h2>

      <div v-if="clusters.length === 0" class="empty-state">
        {{ $t('admin.infra.noClusters', 'No hay clusters configurados') }}
      </div>

      <div v-else class="cluster-list migration-clusters">
        <div v-for="cluster in clusters" :key="cluster.id" class="cluster-card">
          <div class="cluster-header">
            <span class="cluster-name">{{ cluster.name }}</span>
            <span class="cluster-badge" :class="'badge-' + cluster.status">
              {{ clusterStatusLabel(cluster.status) }}
            </span>
          </div>
          <div class="cluster-verticals">
            <span v-for="vertical in cluster.verticals" :key="vertical" class="vertical-tag">
              {{ vertical }}
            </span>
          </div>
          <div class="cluster-weight">
            <div class="metric-label-row">
              <span class="metric-label">{{ $t('admin.infra.capacity', 'Capacidad') }}</span>
              <span class="metric-value-text">
                {{ cluster.weight_used }} / {{ cluster.weight_limit }}
              </span>
            </div>
            <div class="progress-bar-container">
              <div
                class="progress-bar-fill"
                :class="'progress-' + getStatusColor(clusterPercent(cluster))"
                :style="{ width: Math.min(clusterPercent(cluster), 100) + '%' }"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- New Migration Button -->
      <div class="migration-actions">
        <button class="btn-primary btn-new-migration" @click="openMigrationWizard">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            class="btn-icon"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {{ $t('admin.infra.newMigration', 'Nueva migracion') }}
        </button>
      </div>

      <!-- Migration Wizard Modal -->
      <Teleport to="body">
        <div v-if="wizardOpen" class="wizard-overlay" @click.self="closeWizard">
          <div class="wizard-modal">
            <div class="wizard-header">
              <h3 class="wizard-title">
                {{ $t('admin.infra.migrationWizard', 'Asistente de migracion') }}
              </h3>
              <button class="wizard-close" @click="closeWizard">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <!-- Step indicator -->
            <div class="wizard-steps-indicator">
              <div
                v-for="(step, idx) in wizardStepLabels"
                :key="idx"
                class="wizard-step-dot"
                :class="{ active: wizardStep === idx, completed: wizardStep > idx }"
              >
                <span class="step-number">{{ idx + 1 }}</span>
                <span class="step-label">{{ step }}</span>
              </div>
            </div>

            <!-- Step 0: Select vertical -->
            <div v-if="wizardStep === 0" class="wizard-body">
              <label class="wizard-label">
                {{ $t('admin.infra.selectVertical', 'Seleccionar vertical a migrar') }}
              </label>
              <select v-model="wizardVertical" class="wizard-select">
                <option value="">
                  {{ $t('admin.infra.chooseVertical', '-- Seleccionar --') }}
                </option>
                <option v-for="v in allVerticalsInClusters" :key="v" :value="v">
                  {{ v }}
                </option>
              </select>
              <div v-if="wizardVertical" class="wizard-info">
                {{ $t('admin.infra.sourceCluster', 'Cluster origen') }}:
                <strong>{{ sourceClusterForVertical }}</strong>
              </div>
            </div>

            <!-- Step 1: Select target cluster -->
            <div v-if="wizardStep === 1" class="wizard-body">
              <label class="wizard-label">
                {{ $t('admin.infra.selectTarget', 'Seleccionar cluster destino') }}
              </label>
              <select v-model="wizardTargetCluster" class="wizard-select">
                <option value="">{{ $t('admin.infra.chooseTarget', '-- Seleccionar --') }}</option>
                <option v-for="c in targetClusterOptions" :key="c.id" :value="c.id">
                  {{ c.name }} ({{ c.weight_used }}/{{ c.weight_limit }})
                </option>
                <option value="__new__">
                  {{ $t('admin.infra.createNew', '+ Crear nuevo cluster') }}
                </option>
              </select>
              <div
                v-if="wizardTargetCluster === '__new__'"
                class="wizard-info wizard-new-cluster-info"
              >
                <p>
                  {{ $t('admin.infra.newClusterInstructions', 'Para crear un nuevo cluster:') }}
                </p>
                <ol>
                  <li>
                    {{
                      $t('admin.infra.newCluster1', 'Crear nuevo proyecto en Supabase Dashboard')
                    }}
                  </li>
                  <li>{{ $t('admin.infra.newCluster2', 'Ejecutar migraciones SQL base') }}</li>
                  <li>
                    {{ $t('admin.infra.newCluster3', 'Registrar el cluster en infra_clusters') }}
                  </li>
                  <li>
                    {{ $t('admin.infra.newCluster4', 'Volver aqui para continuar la migracion') }}
                  </li>
                </ol>
              </div>
            </div>

            <!-- Step 2: Review migration plan -->
            <div v-if="wizardStep === 2" class="wizard-body">
              <h4 class="wizard-subtitle">
                {{ $t('admin.infra.reviewPlan', 'Plan de migracion') }}
              </h4>
              <div class="review-grid">
                <div class="review-item">
                  <span class="review-label">{{ $t('admin.infra.vertical', 'Vertical') }}</span>
                  <span class="review-value">{{ wizardVertical }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">{{ $t('admin.infra.source', 'Origen') }}</span>
                  <span class="review-value">{{ sourceClusterForVertical }}</span>
                </div>
                <div class="review-item">
                  <span class="review-label">{{ $t('admin.infra.target', 'Destino') }}</span>
                  <span class="review-value">{{ targetClusterName }}</span>
                </div>
              </div>
              <div class="review-tables">
                <h5>{{ $t('admin.infra.tablesToMigrate', 'Tablas a migrar') }}</h5>
                <ul class="tables-list">
                  <li>vehicles</li>
                  <li>vehicle_images</li>
                  <li>categories</li>
                  <li>subcategories</li>
                  <li>filters / filter_options</li>
                  <li>content_translations</li>
                  <li>users (vertical-scoped)</li>
                  <li>vertical_config</li>
                </ul>
              </div>
              <div class="review-warnings">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="warning-icon"
                >
                  <path
                    d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
                  />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <span>{{
                  $t(
                    'admin.infra.migrationWarning',
                    'La migracion puede tardar varios minutos. No cerrar esta ventana durante el proceso.',
                  )
                }}</span>
              </div>
            </div>

            <!-- Step 3: Execute -->
            <div v-if="wizardStep === 3" class="wizard-body">
              <div v-if="!wizardExecuting && !wizardComplete" class="execute-confirmation">
                <label class="confirm-check">
                  <input v-model="wizardConfirmed" type="checkbox" >
                  <span>{{
                    $t(
                      'admin.infra.confirmMigration',
                      'Confirmo que quiero ejecutar esta migracion',
                    )
                  }}</span>
                </label>
                <button
                  class="btn-primary btn-execute"
                  :disabled="!wizardConfirmed || wizardExecuting"
                  @click="executeMigration"
                >
                  {{ $t('admin.infra.execute', 'Ejecutar migracion') }}
                </button>
              </div>
              <div v-if="wizardExecuting" class="executing-state">
                <div class="infra-spinner" />
                <span>{{ $t('admin.infra.executing', 'Ejecutando migracion...') }}</span>
                <div class="progress-bar-container wizard-progress">
                  <div
                    class="progress-bar-fill progress-green"
                    :style="{ width: wizardProgress + '%' }"
                  />
                </div>
                <span class="progress-text">{{ wizardProgress }}%</span>
              </div>
            </div>

            <!-- Step 4: Result -->
            <div v-if="wizardStep === 4" class="wizard-body">
              <div v-if="wizardResult === 'success'" class="result-success">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="result-icon"
                >
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                <h4>{{ $t('admin.infra.migrationSuccess', 'Migracion completada') }}</h4>
                <p>
                  {{
                    $t(
                      'admin.infra.migrationSuccessMsg',
                      'La vertical se ha migrado correctamente al cluster destino.',
                    )
                  }}
                </p>
                <div class="result-next-steps">
                  <h5>{{ $t('admin.infra.nextSteps', 'Proximos pasos') }}:</h5>
                  <ol>
                    <li>
                      {{ $t('admin.infra.step1Done', 'Verificar datos en el nuevo cluster') }}
                    </li>
                    <li>
                      {{ $t('admin.infra.step2Done', 'Actualizar DNS / env vars si necesario') }}
                    </li>
                    <li>
                      {{ $t('admin.infra.step3Done', 'Monitorizar rendimiento durante 24h') }}
                    </li>
                  </ol>
                </div>
              </div>
              <div v-else class="result-error">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  class="result-icon result-icon-error"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <h4>{{ $t('admin.infra.migrationFailed', 'Error en la migracion') }}</h4>
                <p>{{ wizardErrorMessage }}</p>
              </div>
            </div>

            <!-- Wizard footer -->
            <div class="wizard-footer">
              <button
                v-if="wizardStep > 0 && wizardStep < 4 && !wizardExecuting"
                class="btn-secondary"
                @click="wizardStep--"
              >
                {{ $t('admin.infra.back', 'Atras') }}
              </button>
              <div class="wizard-footer-spacer" />
              <button
                v-if="wizardStep < 3 && canAdvanceWizard"
                class="btn-primary"
                @click="wizardStep++"
              >
                {{ $t('admin.infra.next', 'Siguiente') }}
              </button>
              <button v-if="wizardStep === 4" class="btn-primary" @click="closeWizard">
                {{ $t('admin.infra.close', 'Cerrar') }}
              </button>
            </div>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line } from 'vue-chartjs'
import type { ChartData, ChartOptions } from 'chart.js'
import type { InfraCluster } from '~/composables/useInfraMetrics'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
)

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

function statusLabel(status: string): string {
  switch (status) {
    case 'green':
      return $t('admin.infra.statusOk', 'Normal')
    case 'yellow':
      return $t('admin.infra.statusWarning', 'Atencion')
    case 'red':
      return $t('admin.infra.statusCritical', 'Critico')
    default:
      return $t('admin.infra.statusNA', 'No disponible')
  }
}

function formatMetricValue(value: number): string {
  if (value >= 1_000_000_000) return (value / 1_000_000_000).toFixed(1) + ' GB'
  if (value >= 1_000_000) return (value / 1_000_000).toFixed(1) + ' MB'
  if (value >= 1_000) return (value / 1_000).toFixed(1) + 'K'
  return String(value)
}

function clusterPercent(cluster: InfraCluster): number {
  if (!cluster.weight_limit) return 0
  return Math.round((cluster.weight_used / cluster.weight_limit) * 100)
}

function clusterStatusLabel(status: string): string {
  switch (status) {
    case 'active':
      return $t('admin.infra.clusterActive', 'Activo')
    case 'migrating':
      return $t('admin.infra.clusterMigrating', 'Migrando')
    case 'full':
      return $t('admin.infra.clusterFull', 'Lleno')
    default:
      return status
  }
}

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

const alertFilter = ref<'all' | 'unacknowledged'>('unacknowledged')
const alertComponentFilter = ref('')

const filteredAlerts = computed(() => {
  let result = [...alerts.value]

  if (alertFilter.value === 'unacknowledged') {
    result = result.filter((a) => !a.acknowledged_at)
  }

  if (alertComponentFilter.value) {
    result = result.filter((a) => a.component === alertComponentFilter.value)
  }

  return result
})

function formatTimestamp(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function alertLevelLabel(level: string): string {
  switch (level) {
    case 'warning':
      return $t('admin.infra.levelWarning', 'Warning')
    case 'critical':
      return $t('admin.infra.levelCritical', 'Critical')
    case 'emergency':
      return $t('admin.infra.levelEmergency', 'Emergency')
    default:
      return level
  }
}

async function handleAcknowledge(alertId: string) {
  await acknowledgeAlert(alertId)
}

// ---------------------------------------------------------------------------
// Tab 3: History / Charts
// ---------------------------------------------------------------------------

type PeriodValue = '24h' | '7d' | '30d'

const selectedPeriod = ref<PeriodValue>('7d')

const periods = [
  { value: '24h' as PeriodValue, label: '24h' },
  { value: '7d' as PeriodValue, label: '7d' },
  { value: '30d' as PeriodValue, label: '30d' },
]

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

const wizardStepLabels = computed(() => [
  $t('admin.infra.wizStep1', 'Vertical'),
  $t('admin.infra.wizStep2', 'Destino'),
  $t('admin.infra.wizStep3', 'Revisar'),
  $t('admin.infra.wizStep4', 'Ejecutar'),
  $t('admin.infra.wizStep5', 'Resultado'),
])

const allVerticalsInClusters = computed(() => {
  const verticals: string[] = []
  for (const c of clusters.value) {
    for (const v of c.verticals) {
      if (!verticals.includes(v)) verticals.push(v)
    }
  }
  return verticals
})

const sourceClusterForVertical = computed(() => {
  if (!wizardVertical.value) return ''
  const c = clusters.value.find((cl) => cl.verticals.includes(wizardVertical.value))
  return c?.name || ''
})

const targetClusterOptions = computed(() => {
  const sourceCluster = clusters.value.find((cl) => cl.verticals.includes(wizardVertical.value))
  return clusters.value.filter((c) => c.id !== sourceCluster?.id && c.status !== 'full')
})

const targetClusterName = computed(() => {
  if (wizardTargetCluster.value === '__new__') {
    return $t('admin.infra.newCluster', 'Nuevo cluster')
  }
  const c = clusters.value.find((cl) => cl.id === wizardTargetCluster.value)
  return c?.name || ''
})

const canAdvanceWizard = computed(() => {
  switch (wizardStep.value) {
    case 0:
      return !!wizardVertical.value
    case 1:
      return !!wizardTargetCluster.value && wizardTargetCluster.value !== '__new__'
    case 2:
      return true
    default:
      return false
  }
})

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

/* Section Heading */
.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

/* ================================
   Component Cards Grid
   ================================ */
.component-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-8);
}

@media (min-width: 768px) {
  .component-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .component-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.component-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast);
}

.component-card:hover {
  box-shadow: var(--shadow-md);
}

.component-card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

.component-icon {
  display: flex;
  align-items: center;
  color: var(--color-primary);
  flex-shrink: 0;
}

.component-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  flex: 1;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-green {
  background: var(--color-success);
  box-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
}

.status-yellow {
  background: var(--color-warning);
  box-shadow: 0 0 6px rgba(245, 158, 11, 0.4);
}

.status-red {
  background: var(--color-error);
  box-shadow: 0 0 6px rgba(239, 68, 68, 0.4);
}

.status-gray {
  background: var(--color-gray-400);
}

.component-not-configured {
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  font-style: italic;
  padding: var(--spacing-3) 0;
}

/* Metric Rows */
.component-metrics {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
}

.metric-row {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.metric-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.metric-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.metric-value-text {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

/* Progress Bar */
.progress-bar-container {
  height: 8px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.progress-green {
  background: var(--color-success);
}

.progress-yellow {
  background: var(--color-warning);
}

.progress-red {
  background: var(--color-error);
}

.progress-gray {
  background: var(--color-gray-400);
}

/* Recommendations */
.metric-recommendation {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-2);
  padding: var(--spacing-2) var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-xs);
  margin-top: var(--spacing-1);
}

.rec-warning {
  background: #fefce8;
  border: 1px solid #fde68a;
  color: #92400e;
}

.rec-critical {
  background: #fff7ed;
  border: 1px solid #fed7aa;
  color: #9a3412;
}

.rec-emergency {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

.rec-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin-top: 1px;
}

.rec-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rec-message {
  font-weight: var(--font-weight-medium);
}

.rec-action {
  font-weight: var(--font-weight-normal);
  opacity: 0.85;
}

/* ================================
   Image Pipeline
   ================================ */
.section-block {
  margin-bottom: var(--spacing-8);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.pipeline-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

@media (min-width: 480px) {
  .pipeline-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.pipeline-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  text-align: center;
}

.pipeline-label {
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.pipeline-value {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-primary);
  margin-top: var(--spacing-1);
}

.pipeline-actions {
  display: flex;
  gap: var(--spacing-3);
  flex-wrap: wrap;
}

.pipeline-message {
  margin-top: var(--spacing-3);
  padding: var(--spacing-3);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
}

.pipeline-message.success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.pipeline-message.error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}

/* ================================
   Clusters
   ================================ */
.cluster-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.cluster-card {
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
}

.cluster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-3);
}

.cluster-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.cluster-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  padding: 2px 10px;
  border-radius: var(--border-radius-full);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-migrating {
  background: #fef3c7;
  color: #92400e;
}

.badge-full {
  background: #fee2e2;
  color: #991b1b;
}

.cluster-verticals {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  margin-bottom: var(--spacing-3);
}

.vertical-tag {
  font-size: var(--font-size-xs);
  padding: 2px 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
}

.cluster-weight {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

/* ================================
   Alerts (Tab 2)
   ================================ */
.alerts-toolbar {
  margin-bottom: var(--spacing-4);
}

.alerts-filters {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  align-items: center;
}

.filter-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.filter-btn:hover {
  background: var(--bg-tertiary);
}

.filter-btn.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: var(--color-white);
}

.filter-select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  background: var(--bg-primary);
  min-height: 44px;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-3);
  padding: var(--spacing-12);
  color: var(--text-auxiliary);
  font-size: var(--font-size-sm);
  text-align: center;
}

.empty-icon {
  width: 40px;
  height: 40px;
  opacity: 0.5;
}

/* Alerts List */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
}

.alert-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2);
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.alert-item.acknowledged {
  opacity: 0.6;
  background: var(--bg-secondary);
}

@media (min-width: 768px) {
  .alert-item {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.alert-timestamp {
  white-space: nowrap;
}

.alert-component {
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.alert-body {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--spacing-2);
  flex: 1;
}

.alert-level-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: var(--border-radius-full);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.level-warning {
  background: #dcfce7;
  color: #166534;
}

.level-critical {
  background: #fff7ed;
  color: #9a3412;
}

.level-emergency {
  background: #fee2e2;
  color: #991b1b;
}

.alert-metric {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
}

.alert-message {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.alert-actions {
  flex-shrink: 0;
}

.btn-acknowledge {
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-acknowledge:hover {
  background: var(--color-primary-dark);
}

.acknowledged-label {
  font-size: var(--font-size-xs);
  color: var(--color-success);
  font-weight: var(--font-weight-medium);
}

/* ================================
   History / Charts (Tab 3)
   ================================ */
.history-toolbar {
  margin-bottom: var(--spacing-6);
}

.period-selector {
  display: flex;
  gap: var(--spacing-1);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-1);
  width: fit-content;
}

.period-btn {
  padding: var(--spacing-2) var(--spacing-4);
  background: transparent;
  border: none;
  border-radius: var(--border-radius-sm);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.period-btn:hover {
  background: var(--bg-tertiary);
}

.period-btn.active {
  background: var(--color-primary);
  color: var(--color-white);
  box-shadow: var(--shadow-sm);
}

.charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
}

@media (min-width: 768px) {
  .charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.chart-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-4);
  box-shadow: var(--shadow-sm);
}

.chart-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-3) 0;
}

.chart-container {
  height: 250px;
  position: relative;
}

@media (min-width: 1024px) {
  .chart-container {
    height: 300px;
  }
}

/* ================================
   Migration (Tab 4)
   ================================ */
.migration-clusters {
  margin-bottom: var(--spacing-6);
}

.migration-actions {
  margin-bottom: var(--spacing-6);
}

.btn-new-migration {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-2);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

/* ================================
   Buttons (shared)
   ================================ */
.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--color-primary);
  color: var(--color-white);
  border: none;
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  cursor: pointer;
  transition: background var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-5);
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all var(--transition-fast);
  min-height: 44px;
  min-width: 44px;
}

.btn-secondary:hover {
  background: var(--bg-tertiary);
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ================================
   Migration Wizard Modal
   ================================ */
.wizard-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--spacing-4);
}

.wizard-modal {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  width: 100%;
  max-width: 640px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  display: flex;
  flex-direction: column;
}

.wizard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--border-color);
}

.wizard-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.wizard-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  color: var(--text-auxiliary);
  cursor: pointer;
  border-radius: var(--border-radius);
  transition: background var(--transition-fast);
}

.wizard-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.wizard-close svg {
  width: 20px;
  height: 20px;
}

/* Step Indicator */
.wizard-steps-indicator {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-4) var(--spacing-5);
  border-bottom: 1px solid var(--border-color-light);
  gap: var(--spacing-2);
  overflow-x: auto;
}

.wizard-step-dot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  flex: 1;
  min-width: 0;
}

.step-number {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  background: var(--bg-tertiary);
  color: var(--text-auxiliary);
  flex-shrink: 0;
}

.wizard-step-dot.active .step-number {
  background: var(--color-primary);
  color: var(--color-white);
}

.wizard-step-dot.completed .step-number {
  background: var(--color-success);
  color: var(--color-white);
}

.step-label {
  font-size: 10px;
  color: var(--text-auxiliary);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 80px;
}

.wizard-step-dot.active .step-label {
  color: var(--color-primary);
  font-weight: var(--font-weight-medium);
}

/* Wizard Body */
.wizard-body {
  padding: var(--spacing-5);
  flex: 1;
}

.wizard-label {
  display: block;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: var(--spacing-3);
}

.wizard-select {
  width: 100%;
  padding: var(--spacing-3);
  border: 2px solid var(--border-color);
  border-radius: var(--border-radius);
  font-size: var(--font-size-base);
  color: var(--text-primary);
  background: var(--bg-primary);
  min-height: 44px;
}

.wizard-select:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(35, 66, 74, 0.1);
}

.wizard-info {
  margin-top: var(--spacing-3);
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.wizard-new-cluster-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1e40af;
}

.wizard-new-cluster-info ol {
  margin: var(--spacing-2) 0 0 var(--spacing-4);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.wizard-new-cluster-info li {
  font-size: var(--font-size-sm);
}

/* Review Step */
.wizard-subtitle {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-3);
  margin-bottom: var(--spacing-4);
}

@media (min-width: 480px) {
  .review-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

.review-item {
  padding: var(--spacing-3);
  background: var(--bg-secondary);
  border-radius: var(--border-radius-sm);
  text-align: center;
}

.review-label {
  display: block;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: var(--spacing-1);
}

.review-value {
  display: block;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
}

.review-tables {
  margin-bottom: var(--spacing-4);
}

.review-tables h5 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-secondary);
  margin: 0 0 var(--spacing-2) 0;
}

.tables-list {
  margin: 0;
  padding: 0 0 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

.tables-list li {
  font-family: monospace;
  font-size: var(--font-size-xs);
}

.review-warnings {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-3);
  background: #fefce8;
  border: 1px solid #fde68a;
  border-radius: var(--border-radius-sm);
  font-size: var(--font-size-sm);
  color: #92400e;
}

.warning-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
  margin-top: 1px;
}

/* Execute Step */
.execute-confirmation {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  align-items: flex-start;
}

.confirm-check {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--text-primary);
  cursor: pointer;
}

.confirm-check input[type='checkbox'] {
  width: 20px;
  height: 20px;
  min-height: auto;
  accent-color: var(--color-primary);
  cursor: pointer;
}

.btn-execute {
  width: 100%;
}

.executing-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-6) 0;
  text-align: center;
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.wizard-progress {
  width: 100%;
  max-width: 300px;
  height: 10px;
}

.progress-text {
  font-weight: var(--font-weight-semibold);
  color: var(--color-primary);
}

/* Result Step */
.result-success,
.result-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--spacing-3);
  padding: var(--spacing-4) 0;
}

.result-icon {
  width: 48px;
  height: 48px;
  color: var(--color-success);
}

.result-icon-error {
  color: var(--color-error);
}

.result-success h4,
.result-error h4 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  margin: 0;
}

.result-success p,
.result-error p {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.result-next-steps {
  text-align: left;
  width: 100%;
  padding: var(--spacing-4);
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  margin-top: var(--spacing-2);
}

.result-next-steps h5 {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-2) 0;
}

.result-next-steps ol {
  margin: 0;
  padding: 0 0 0 var(--spacing-4);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-1);
}

/* Wizard Footer */
.wizard-footer {
  display: flex;
  align-items: center;
  padding: var(--spacing-4) var(--spacing-5);
  border-top: 1px solid var(--border-color);
  gap: var(--spacing-3);
}

.wizard-footer-spacer {
  flex: 1;
}
</style>
