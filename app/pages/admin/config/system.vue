<script setup lang="ts">
import { useAdminVerticalConfig } from '~/composables/admin/useAdminVerticalConfig'

definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const supabase = useSupabaseClient()
const { config, loading, saving, error, saved, loadConfig, saveFields } = useAdminVerticalConfig()

// Local form state
const form = ref({
  require_vehicle_approval: false,
  require_article_approval: false,
})

// Activity logs state
interface ActivityLog {
  id: string
  created_at: string | null
  actor_type: string
  action: string
  entity_type: string | null
  details: Record<string, unknown> | null
}

const logs = ref<ActivityLog[]>([])
const logsLoading = ref(false)
const logsError = ref<string | null>(null)

onMounted(async () => {
  const cfg = await loadConfig()
  if (cfg) {
    form.value.require_vehicle_approval = cfg.require_vehicle_approval ?? false
    form.value.require_article_approval = cfg.require_article_approval ?? false
  }
  await fetchLogs()
})

const { t } = useI18n()

async function fetchLogs() {
  logsLoading.value = true
  logsError.value = null
  try {
    const { data, error: err } = await supabase
      .from('activity_logs')
      .select('id, created_at, actor_type, action, entity_type, details')
      .order('created_at', { ascending: false })
      .limit(20)

    if (err) throw err
    logs.value = (data as ActivityLog[]) || []
  } catch (err: unknown) {
    logsError.value = err instanceof Error ? err.message : t('admin.configSystem.logsError')
  } finally {
    logsLoading.value = false
  }
}

async function handleSave() {
  const changed: Record<string, boolean> = {}

  if (form.value.require_vehicle_approval !== (config.value?.require_vehicle_approval ?? false)) {
    changed.require_vehicle_approval = form.value.require_vehicle_approval
  }
  if (form.value.require_article_approval !== (config.value?.require_article_approval ?? false)) {
    changed.require_article_approval = form.value.require_article_approval
  }

  if (Object.keys(changed).length === 0) return
  await saveFields(changed)
}

function formatDate(date: string | null): string {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDetails(details: Record<string, unknown> | null): string {
  if (!details || Object.keys(details).length === 0) return '-'
  try {
    return JSON.stringify(details, null, 0).slice(0, 120)
  } catch {
    return '-'
  }
}
</script>

<template>
  <div class="admin-system">
    <div class="section-header">
      <h2>{{ $t('admin.configSystem.title') }}</h2>
      <p class="section-subtitle">{{ $t('admin.configSystem.subtitle') }}</p>
    </div>

    <div v-if="loading" class="loading-state">{{ $t('admin.common.loadingConfig') }}</div>

    <template v-else>
      <!-- Success / Error feedback -->
      <div v-if="saved" class="success-banner">{{ $t('admin.common.savedOk') }}</div>
      <div v-if="error" class="error-banner">
        {{ error }}
      </div>

      <!-- Moderacion section -->
      <div class="config-card">
        <h3 class="card-title">{{ $t('admin.configSystem.moderationSection') }}</h3>
        <p class="card-description">{{ $t('admin.configSystem.moderationDesc') }}</p>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.require_vehicle_approval" type="checkbox" >
            <span class="toggle-text">
              <strong>{{ $t('admin.configSystem.requireVehicleApproval') }}</strong>
              <small>{{ $t('admin.configSystem.requireVehicleApprovalDesc') }}</small>
            </span>
          </label>
        </div>

        <div class="toggle-group">
          <label class="toggle-label">
            <input v-model="form.require_article_approval" type="checkbox" >
            <span class="toggle-text">
              <strong>{{ $t('admin.configSystem.requireArticleApproval') }}</strong>
              <small>{{ $t('admin.configSystem.requireArticleApprovalDesc') }}</small>
            </span>
          </label>
        </div>
      </div>

      <!-- Save button -->
      <div class="actions-bar">
        <button class="btn-primary" :disabled="saving" @click="handleSave">
          {{ saving ? $t('admin.common.saving') : $t('admin.common.saveChanges') }}
        </button>
      </div>

      <!-- Activity Logs section -->
      <div class="config-card logs-card">
        <div class="logs-header">
          <h3 class="card-title">{{ $t('admin.configSystem.logsSection') }}</h3>
          <button class="btn-refresh" :disabled="logsLoading" @click="fetchLogs">
            {{ logsLoading ? $t('admin.common.loading') : $t('admin.common.refresh') }}
          </button>
        </div>
        <p class="card-description">{{ $t('admin.configSystem.logsDesc') }}</p>

        <div v-if="logsError" class="error-banner">
          {{ logsError }}
        </div>

        <div v-if="logsLoading && !logs.length" class="loading-state">
          {{ $t('admin.configSystem.logsLoading') }}
        </div>

        <div v-else-if="!logs.length" class="empty-state">
          {{ $t('admin.configSystem.logsEmpty') }}
        </div>

        <div v-else class="table-container">
          <table class="logs-table">
            <thead>
              <tr>
                <th>{{ $t('admin.configSystem.colDate') }}</th>
                <th>{{ $t('admin.configSystem.colActor') }}</th>
                <th>{{ $t('admin.configSystem.colAction') }}</th>
                <th>{{ $t('admin.configSystem.colEntity') }}</th>
                <th class="details-col">{{ $t('admin.configSystem.colDetails') }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="date-cell">
                  {{ formatDate(log.created_at) }}
                </td>
                <td>
                  <span class="actor-badge" :class="'actor--' + log.actor_type">
                    {{ log.actor_type }}
                  </span>
                </td>
                <td>{{ log.action }}</td>
                <td>{{ log.entity_type || '-' }}</td>
                <td class="details-cell">
                  {{ formatDetails(log.details) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.admin-system {
  padding: 0;
}

.section-header {
  margin-bottom: var(--spacing-8);
}

.section-header h2 {
  margin: 0 0 var(--spacing-2);
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: var(--spacing-10);
  color: var(--color-gray-500);
}

.success-banner {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
  font-weight: 500;
}

.error-banner {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-4);
}

.config-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: var(--spacing-6);
  box-shadow: var(--shadow-card);
  margin-bottom: var(--spacing-5);
}

.card-title {
  margin: 0 0 var(--spacing-1);
  font-size: 1.25rem;
  color: var(--color-gray-800);
}

.card-description {
  margin: 0 0 var(--spacing-5);
  color: var(--color-gray-500);
  font-size: 0.9rem;
}

.toggle-group {
  margin-bottom: var(--spacing-4);
}

.toggle-group:last-child {
  margin-bottom: 0;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  cursor: pointer;
  padding: var(--spacing-3);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
  transition: border-color 0.2s;
}

.toggle-label:hover {
  border-color: var(--color-primary);
}

.toggle-label input[type='checkbox'] {
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.toggle-text strong {
  font-size: 0.95rem;
  color: var(--color-gray-800);
}

.toggle-text small {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.actions-bar {
  margin-top: var(--spacing-6);
  margin-bottom: var(--spacing-8);
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-3) var(--spacing-6);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 2.75rem;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logs-card {
  margin-top: var(--spacing-2);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-1);
}

.btn-refresh {
  background: var(--bg-secondary);
  color: var(--color-gray-700);
  border: 1px solid var(--border-color);
  padding: 0.375rem 0.875rem;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  min-height: 2.25rem;
}

.btn-refresh:hover:not(:disabled) {
  background: var(--bg-tertiary);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--text-disabled);
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius);
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 37.5rem;
}

.logs-table th,
.logs-table td {
  padding: 0.625rem 0.875rem;
  text-align: left;
  border-bottom: 1px solid var(--color-gray-100);
  font-size: 0.85rem;
}

.logs-table th {
  background: var(--color-gray-50);
  font-weight: 600;
  color: var(--color-gray-700);
  white-space: nowrap;
}

.logs-table tbody tr:hover {
  background: var(--color-gray-50);
}

.logs-table tbody tr:last-child td {
  border-bottom: none;
}

.date-cell {
  white-space: nowrap;
  color: var(--color-gray-500);
  font-size: 0.8rem;
}

.actor-badge {
  display: inline-block;
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.actor--admin {
  background: var(--color-purple-bg);
  color: var(--color-violet-700);
}

.actor--dealer {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.actor--system {
  background: var(--bg-secondary);
  color: var(--color-gray-600);
}

.actor--cron {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.details-col {
  min-width: 9.375rem;
}

.details-cell {
  color: var(--color-gray-500);
  font-size: 0.8rem;
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 48em) {
  .config-card {
    padding: var(--spacing-8);
  }

  .details-cell {
    max-width: 18.75rem;
  }
}
</style>
