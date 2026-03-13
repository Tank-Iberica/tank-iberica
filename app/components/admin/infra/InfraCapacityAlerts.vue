<script setup lang="ts">
/**
 * InfraCapacityAlerts — Admin infra capacity monitoring panel.
 *
 * Shows capacity usage per metric (storage, connections) and
 * lists unresolved alerts with resolve action.
 *
 * Gated behind feature="capacity_alerts" (admin-only).
 *
 * #142 Bloque 18
 */
import { useAdminCapacityAlerts, type CapacityAlert } from '~/composables/admin/useAdminCapacityAlerts'

const { alerts, loading, error, criticalCount, warningCount, fetchAlerts, resolveAlert, statusColor, metricLabel } =
  useAdminCapacityAlerts()

onMounted(() => fetchAlerts({ onlyUnresolved: true }))

function formatPct(val: number): string {
  return `${Math.round(val)}%`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function barColor(alert: CapacityAlert): string {
  return alert.is_critical ? 'var(--color-error, #ef4444)' : 'var(--color-warning, #f59e0b)'
}

async function handleResolve(id: string) {
  await resolveAlert(id)
}
</script>

<template>
  <FeatureGate feature="capacity_alerts" locked-mode="hidden">
    <div class="capacity-alerts">
      <!-- Header -->
      <div class="capacity-alerts__header">
        <h3 class="capacity-alerts__title">Alertas de Capacidad</h3>
        <div class="capacity-alerts__badges">
          <span v-if="criticalCount > 0" class="badge badge--critical">
            {{ criticalCount }} crítica{{ criticalCount > 1 ? 's' : '' }}
          </span>
          <span v-if="warningCount > 0" class="badge badge--warning">
            {{ warningCount }} aviso{{ warningCount > 1 ? 's' : '' }}
          </span>
          <span v-if="criticalCount === 0 && warningCount === 0 && !loading" class="badge badge--ok">
            OK
          </span>
        </div>
        <button class="btn-refresh" :disabled="loading" type="button" @click="fetchAlerts()">
          <span v-if="loading" aria-hidden="true">...</span>
          <span v-else aria-hidden="true">↺</span>
          <span class="sr-only">Actualizar</span>
        </button>
      </div>

      <!-- Error -->
      <p v-if="error" class="capacity-alerts__error" role="alert">
        Error cargando alertas: {{ error }}
      </p>

      <!-- Empty state -->
      <div
        v-else-if="!loading && alerts.length === 0"
        class="capacity-alerts__empty"
        role="status"
      >
        <span aria-hidden="true">✓</span>
        Todos los recursos dentro del límite
      </div>

      <!-- Alert list -->
      <ul v-else class="capacity-alerts__list" aria-label="Alertas de capacidad activas">
        <li
          v-for="alert in alerts"
          :key="alert.id"
          class="capacity-alert-item"
          :class="{ 'capacity-alert-item--critical': alert.is_critical }"
        >
          <div class="capacity-alert-item__header">
            <span
              class="capacity-alert-item__badge"
              :class="statusColor(alert) === 'red' ? 'badge--critical' : 'badge--warning'"
            >
              {{ alert.is_critical ? 'CRÍTICO' : 'AVISO' }}
            </span>
            <span class="capacity-alert-item__metric">{{ metricLabel(alert.metric) }}</span>
            <span class="capacity-alert-item__date">{{ formatDate(alert.created_at) }}</span>
          </div>

          <!-- Usage bar -->
          <div class="capacity-bar" :aria-label="`${metricLabel(alert.metric)}: ${formatPct(alert.current_value)}`">
            <div
              class="capacity-bar__fill"
              :style="{
                width: `${Math.min(100, alert.current_value)}%`,
                background: barColor(alert),
              }"
              role="progressbar"
              :aria-valuenow="alert.current_value"
              aria-valuemin="0"
              aria-valuemax="100"
            />
            <span class="capacity-bar__label">{{ formatPct(alert.current_value) }}</span>
          </div>

          <!-- Details -->
          <div class="capacity-alert-item__details">
            <span>Umbral: {{ formatPct(alert.threshold) }}</span>
            <span v-if="alert.details?.currentGb">
              {{ alert.details.currentGb }}GB / {{ Number((Number(alert.details.limitBytes) / (1024 ** 3)).toFixed(1)) }}GB
            </span>
            <span v-if="alert.details?.currentCount">
              {{ alert.details.currentCount }} / {{ alert.details.limitCount }} conexiones
            </span>
          </div>

          <!-- Resolve -->
          <button
            class="capacity-alert-item__resolve"
            type="button"
            @click="handleResolve(alert.id)"
          >
            Marcar como resuelto
          </button>
        </li>
      </ul>

      <!-- Loading skeleton -->
      <div v-if="loading && alerts.length === 0" class="capacity-alerts__loading" aria-busy="true">
        <div v-for="i in 2" :key="i" class="skeleton" aria-hidden="true" />
      </div>
    </div>
  </FeatureGate>
</template>

<style scoped>
.capacity-alerts {
  background: var(--bg-surface, #fff);
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.5rem;
  padding: 1rem;
}

@media (min-width: 768px) {
  .capacity-alerts {
    padding: 1.5rem;
  }
}

.capacity-alerts__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.capacity-alerts__title {
  font-size: 1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-text, #111827);
  flex: 1;
}

.capacity-alerts__badges {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.btn-refresh {
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  min-height: 2.75rem;
  color: var(--color-text-secondary, #374151);
  transition: background-color 0.15s;
}

.btn-refresh:hover:not(:disabled),
.btn-refresh:focus-visible {
  background: var(--bg-muted, #f3f4f6);
  outline: 2px solid var(--color-primary, #23424a);
  outline-offset: 2px;
}

.btn-refresh:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge--critical {
  background: #fee2e2;
  color: #b91c1c;
}

.badge--warning {
  background: #fef3c7;
  color: #92400e;
}

.badge--ok {
  background: #d1fae5;
  color: #065f46;
}

.capacity-alerts__error {
  font-size: 0.875rem;
  color: var(--color-error, #ef4444);
  margin: 0;
}

.capacity-alerts__empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted, #6b7280);
  padding: 0.5rem 0;
}

.capacity-alerts__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.capacity-alert-item {
  padding: 0.75rem;
  border: 1px solid var(--color-border, #e5e7eb);
  border-radius: 0.375rem;
  background: var(--bg-muted, #fafafa);
}

.capacity-alert-item--critical {
  border-color: #fca5a5;
  background: #fff5f5;
}

.capacity-alert-item__header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.capacity-alert-item__metric {
  font-weight: 500;
  font-size: 0.875rem;
  flex: 1;
  color: var(--color-text, #111827);
}

.capacity-alert-item__date {
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
}

/* Usage bar */
.capacity-bar {
  position: relative;
  height: 0.5rem;
  background: var(--color-border, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 0.375rem;
}

.capacity-bar__fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.capacity-bar__label {
  position: absolute;
  right: 0;
  top: -1.25rem;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text-secondary, #374151);
}

.capacity-alert-item__details {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  font-size: 0.75rem;
  color: var(--color-text-muted, #6b7280);
  margin-top: 0.25rem;
}

.capacity-alert-item__resolve {
  display: inline-flex;
  align-items: center;
  margin-top: 0.5rem;
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
  border: 1px solid var(--color-border, #d1d5db);
  border-radius: 0.375rem;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-secondary, #374151);
  min-height: 2.75rem;
  transition: background-color 0.15s;
}

.capacity-alert-item__resolve:hover,
.capacity-alert-item__resolve:focus-visible {
  background: var(--bg-muted, #f3f4f6);
  outline: 2px solid var(--color-primary, #23424a);
  outline-offset: 2px;
}

.capacity-alerts__loading {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.skeleton {
  height: 4rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 0.375rem;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
