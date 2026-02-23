<template>
  <div class="infra-overview">
    <h2 class="section-heading">
      {{ $t('admin.infra.componentStatus', 'Estado de componentes') }}
    </h2>

    <!-- Component Cards Grid -->
    <div class="component-grid">
      <div v-for="comp in componentCards" :key="comp.key" class="component-card">
        <div class="component-card-header">
          <!-- eslint-disable-next-line vue/no-v-html -->
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
    <InfraImagePipeline
      :pipeline-mode="pipelineMode"
      :cloudinary-only-count="cloudinaryOnlyCount"
      :cf-images-count="cfImagesCount"
      :migrating-images="migratingImages"
      :configuring-variants="configuringVariants"
      :pipeline-message="pipelineMessage"
      :pipeline-message-type="pipelineMessageType"
      @migrate-images="$emit('migrate-images')"
      @setup-cf-variants="$emit('setup-cf-variants')"
    />

    <!-- Clusters Section -->
    <InfraClusters :clusters="clusters" :get-status-color="getStatusColor" />
  </div>
</template>

<script setup lang="ts">
import type { InfraCluster } from '~/composables/useInfraMetrics'

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

interface Props {
  componentCards: ComponentCardData[]
  clusters: InfraCluster[]
  pipelineMode: string
  cloudinaryOnlyCount: number
  cfImagesCount: number
  migratingImages: boolean
  configuringVariants: boolean
  pipelineMessage: string
  pipelineMessageType: 'success' | 'error'
  getStatusColor: (percent: number | null) => 'green' | 'yellow' | 'red' | 'gray'
}

defineProps<Props>()

defineEmits<{
  'migrate-images': []
  'setup-cf-variants': []
}>()

const { t: $t } = useI18n()

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
</script>

<style scoped>
.infra-overview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-8);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0;
}

.component-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--spacing-4);
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
</style>
