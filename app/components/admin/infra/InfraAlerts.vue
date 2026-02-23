<template>
  <div class="infra-alerts">
    <div class="alerts-toolbar">
      <div class="alerts-filters">
        <button
          class="filter-btn"
          :class="{ active: localAlertFilter === 'all' }"
          @click="localAlertFilter = 'all'"
        >
          {{ $t('admin.infra.alertsAll', 'Todas') }}
        </button>
        <button
          class="filter-btn"
          :class="{ active: localAlertFilter === 'unacknowledged' }"
          @click="localAlertFilter = 'unacknowledged'"
        >
          {{ $t('admin.infra.alertsUnack', 'Pendientes') }}
        </button>
        <select v-model="localComponentFilter" class="filter-select">
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
            @click="$emit('acknowledge', alert.id)"
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
</template>

<script setup lang="ts">
import type { InfraAlert } from '~/composables/useInfraMetrics'

interface Props {
  alerts: InfraAlert[]
}

const props = defineProps<Props>()

defineEmits<{
  acknowledge: [id: string]
}>()

const { t: $t } = useI18n()

const localAlertFilter = ref<'all' | 'unacknowledged'>('unacknowledged')
const localComponentFilter = ref('')

const filteredAlerts = computed(() => {
  let result = [...props.alerts]

  if (localAlertFilter.value === 'unacknowledged') {
    result = result.filter((a) => !a.acknowledged_at)
  }

  if (localComponentFilter.value) {
    result = result.filter((a) => a.component === localComponentFilter.value)
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
</script>

<style scoped>
.infra-alerts {
  display: flex;
  flex-direction: column;
}

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
</style>
