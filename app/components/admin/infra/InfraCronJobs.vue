<template>
  <section class="cron-jobs">
    <div class="cron-header">
      <h2 class="cron-title">{{ $t('admin.cron.title', 'Jobs programados') }}</h2>
      <p class="cron-subtitle">
        {{ $t('admin.cron.subtitle', 'Estado de los cron jobs de la plataforma') }}
      </p>
    </div>

    <div class="cron-table-wrapper">
      <table class="cron-table">
        <thead>
          <tr>
            <th>{{ $t('admin.cron.col.job', 'Job') }}</th>
            <th>{{ $t('admin.cron.col.endpoint', 'Endpoint') }}</th>
            <th>{{ $t('admin.cron.col.schedule', 'Frecuencia') }}</th>
            <th>{{ $t('admin.cron.col.purpose', 'Propósito') }}</th>
            <th>{{ $t('admin.cron.col.runManual', 'Ejecutar') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="job in cronJobs" :key="job.endpoint" class="cron-row">
            <td class="job-name">{{ job.name }}</td>
            <td class="job-endpoint"><code>{{ job.endpoint }}</code></td>
            <td class="job-schedule">
              <span class="schedule-badge">{{ job.schedule }}</span>
            </td>
            <td class="job-purpose">{{ job.purpose }}</td>
            <td class="job-actions">
              <button
                class="btn-run"
                :disabled="runningJob === job.endpoint"
                :aria-label="$t('admin.cron.runNow', 'Ejecutar ahora')"
                @click="runJob(job)"
              >
                <span v-if="runningJob === job.endpoint" class="spinner" aria-hidden="true" />
                <span v-else>▶</span>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Run result -->
    <div v-if="lastResult" class="run-result" :class="lastResult.ok ? 'result--ok' : 'result--err'">
      <strong>{{ lastResult.job }}</strong>:
      {{ lastResult.ok ? $t('admin.cron.success', 'OK') : $t('admin.cron.error', 'Error') }}
      <span v-if="lastResult.message">— {{ lastResult.message }}</span>
    </div>
  </section>
</template>

<script setup lang="ts">
interface CronJob {
  name: string
  endpoint: string
  schedule: string
  purpose: string
}

interface RunResult {
  job: string
  ok: boolean
  message?: string
}

const { t } = useI18n()

const runningJob = ref<string | null>(null)
const lastResult = ref<RunResult | null>(null)

const cronJobs: CronJob[] = [
  {
    name: 'Publish Scheduled',
    endpoint: '/api/cron/publish-scheduled',
    schedule: 'Cada 15 min',
    purpose: 'Publica artículos y vehículos programados',
  },
  {
    name: 'Price Drop Alert',
    endpoint: '/api/cron/price-drop-alert',
    schedule: 'Diario 08:00',
    purpose: 'Notifica bajadas de precio a usuarios con alertas',
  },
  {
    name: 'Search Alerts',
    endpoint: '/api/cron/search-alerts',
    schedule: 'Diario 09:00',
    purpose: 'Envía alertas de nuevos vehículos según búsquedas guardadas',
  },
  {
    name: 'Dealer Weekly Stats',
    endpoint: '/api/cron/dealer-weekly-stats',
    schedule: 'Lunes 07:00',
    purpose: 'Email de estadísticas semanales a dealers',
  },
  {
    name: 'Freshness Check',
    endpoint: '/api/cron/freshness-check',
    schedule: 'Diario 10:00',
    purpose: 'Marca como obsoletos vehículos sin actualizar en 90 días',
  },
  {
    name: 'Reservation Expiry',
    endpoint: '/api/cron/reservation-expiry',
    schedule: 'Cada hora',
    purpose: 'Libera reservas expiradas (>48h sin confirmación)',
  },
  {
    name: 'Auto Auction',
    endpoint: '/api/cron/auto-auction',
    schedule: 'Cada 5 min',
    purpose: 'Cierra subastas vencidas y notifica ganador',
  },
  {
    name: 'Founding Expiry',
    endpoint: '/api/cron/founding-expiry',
    schedule: 'Diario 06:00',
    purpose: 'Expira suscripciones founding sin renovar',
  },
  {
    name: 'WhatsApp Retry',
    endpoint: '/api/cron/whatsapp-retry',
    schedule: 'Cada 30 min',
    purpose: 'Reintenta mensajes WhatsApp fallidos',
  },
  {
    name: 'Favorite Sold',
    endpoint: '/api/cron/favorite-sold',
    schedule: 'Diario 11:00',
    purpose: 'Notifica a usuarios cuando un favorito se marca como vendido',
  },
  {
    name: 'Favorite Price Drop',
    endpoint: '/api/cron/favorite-price-drop',
    schedule: 'Diario 11:30',
    purpose: 'Notifica bajada de precio en vehículos favoritos',
  },
  {
    name: 'Infra Metrics',
    endpoint: '/api/cron/infra-metrics',
    schedule: 'Cada hora',
    purpose: 'Recoge métricas de infraestructura (CPU, queries, storage)',
  },
  {
    name: 'Generate Editorial',
    endpoint: '/api/cron/generate-editorial',
    schedule: 'Diario 06:30',
    purpose: 'Genera artículos editoriales de noticias del sector con IA',
  },
]

async function runJob(job: CronJob): Promise<void> {
  runningJob.value = job.endpoint
  lastResult.value = null
  try {
    const res = await $fetch(job.endpoint, {
      method: 'POST',
      headers: { 'x-cron-secret': '' }, // Requires actual secret — for documentation only
    })
    lastResult.value = { job: job.name, ok: true, message: JSON.stringify(res) }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : t('admin.cron.error', 'Error')
    lastResult.value = { job: job.name, ok: false, message: msg }
  } finally {
    runningJob.value = null
  }
}
</script>

<style scoped>
.cron-jobs {
  padding: 1.5rem 0;
}

.cron-header {
  margin-bottom: 1.25rem;
}

.cron-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem;
}

.cron-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.cron-table-wrapper {
  overflow-x: auto;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
}

.cron-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.cron-table th {
  background: var(--bg-secondary);
  padding: 0.625rem 0.875rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--border-color-light);
  white-space: nowrap;
}

.cron-row {
  border-bottom: 1px solid var(--border-color-light);
  transition: background var(--transition-fast);
}

.cron-row:last-child { border-bottom: none; }
.cron-row:hover { background: var(--bg-secondary); }

.cron-table td {
  padding: 0.625rem 0.875rem;
  vertical-align: middle;
}

.job-name {
  font-weight: 500;
  white-space: nowrap;
}

.job-endpoint code {
  font-size: 0.75rem;
  background: var(--bg-tertiary);
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  white-space: nowrap;
}

.schedule-badge {
  display: inline-block;
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  background: var(--color-info-bg);
  color: var(--color-info-text);
  border-radius: 1rem;
  white-space: nowrap;
}

.job-purpose {
  color: var(--text-secondary);
  max-width: 20rem;
}

.btn-run {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: 1px solid var(--color-primary);
  border-radius: var(--border-radius-sm);
  background: transparent;
  color: var(--color-primary);
  cursor: pointer;
  font-size: 0.75rem;
  transition: background var(--transition-fast);
}

.btn-run:hover:not(:disabled) {
  background: var(--color-primary);
  color: var(--color-white);
}

.btn-run:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  display: inline-block;
  width: 0.875rem;
  height: 0.875rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.run-result {
  margin-top: 1rem;
  padding: 0.75rem 1rem;
  border-radius: var(--border-radius);
  font-size: 0.875rem;
}

.result--ok {
  background: var(--color-success-bg);
  color: var(--color-success-text);
  border: 1px solid var(--color-success-border);
}

.result--err {
  background: var(--color-error-bg);
  color: var(--color-error-text);
  border: 1px solid var(--color-error-border);
}
</style>
