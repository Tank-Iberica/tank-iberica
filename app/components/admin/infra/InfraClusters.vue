<template>
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
</template>

<script setup lang="ts">
import type { InfraCluster } from '~/composables/useInfraMetrics'

interface Props {
  clusters: InfraCluster[]
  getStatusColor: (percent: number | null) => 'green' | 'yellow' | 'red' | 'gray'
}

defineProps<Props>()

const { t: $t } = useI18n()

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
</script>

<style scoped>
.section-block {
  padding: var(--spacing-4);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius-md);
}

.section-heading {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin: 0 0 var(--spacing-4) 0;
}

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
</style>
