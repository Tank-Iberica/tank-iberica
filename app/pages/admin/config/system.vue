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
  margin-bottom: 32px;
}

.section-header h2 {
  margin: 0 0 8px;
  font-size: 1.75rem;
  color: var(--color-text);
}

.section-subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 1rem;
}

.loading-state {
  text-align: center;
  padding: 40px;
  color: #6b7280;
}

.success-banner {
  background: #f0fdf4;
  color: #16a34a;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
  font-weight: 500;
}

.error-banner {
  background: #fef2f2;
  color: #dc2626;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.config-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.card-title {
  margin: 0 0 4px;
  font-size: 1.25rem;
  color: #1f2937;
}

.card-description {
  margin: 0 0 20px;
  color: #6b7280;
  font-size: 0.9rem;
}

.toggle-group {
  margin-bottom: 16px;
}

.toggle-group:last-child {
  margin-bottom: 0;
}

.toggle-label {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  cursor: pointer;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: border-color 0.2s;
}

.toggle-label:hover {
  border-color: var(--color-primary, #23424a);
}

.toggle-label input[type='checkbox'] {
  width: 20px;
  height: 20px;
  margin-top: 2px;
  flex-shrink: 0;
  cursor: pointer;
  accent-color: var(--color-primary, #23424a);
}

.toggle-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.toggle-text strong {
  font-size: 0.95rem;
  color: #1f2937;
}

.toggle-text small {
  font-size: 0.8rem;
  color: #6b7280;
}

.actions-bar {
  margin-top: 24px;
  margin-bottom: 32px;
  display: flex;
  justify-content: flex-end;
}

.btn-primary {
  background: var(--color-primary, #23424a);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 0.95rem;
  transition: background 0.2s;
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark, #1a3238);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.logs-card {
  margin-top: 8px;
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.btn-refresh {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: 500;
  transition: all 0.2s;
  min-height: 36px;
}

.btn-refresh:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.empty-state {
  text-align: center;
  padding: 32px;
  color: #9ca3af;
  font-size: 0.95rem;
}

.table-container {
  overflow-x: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 600px;
}

.logs-table th,
.logs-table td {
  padding: 10px 14px;
  text-align: left;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.85rem;
}

.logs-table th {
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  white-space: nowrap;
}

.logs-table tbody tr:hover {
  background: #f9fafb;
}

.logs-table tbody tr:last-child td {
  border-bottom: none;
}

.date-cell {
  white-space: nowrap;
  color: #6b7280;
  font-size: 0.8rem;
}

.actor-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.actor--admin {
  background: #ede9fe;
  color: #6d28d9;
}

.actor--dealer {
  background: #dbeafe;
  color: #1d4ed8;
}

.actor--system {
  background: #f3f4f6;
  color: #4b5563;
}

.actor--cron {
  background: #fef3c7;
  color: #92400e;
}

.details-col {
  min-width: 150px;
}

.details-cell {
  color: #6b7280;
  font-size: 0.8rem;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 768px) {
  .config-card {
    padding: 32px;
  }

  .details-cell {
    max-width: 300px;
  }
}
</style>
