<script setup lang="ts">
definePageMeta({
  layout: 'default',
  middleware: ['auth'],
})

const { t } = useI18n()
const supabase = useSupabaseClient()
const { userId } = useAuth()

interface SearchAlert {
  id: string
  filters: Record<string, unknown>
  frequency: 'instant' | 'daily' | 'weekly'
  is_active: boolean
  created_at: string
}

const alerts = ref<SearchAlert[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

async function loadAlerts() {
  if (!userId.value) return

  loading.value = true
  error.value = null

  try {
    const { data, error: err } = await supabase
      .from('search_alerts')
      .select('id, filters, frequency, is_active, created_at')
      .eq('user_id', userId.value)
      .order('created_at', { ascending: false })

    if (err) throw err
    alerts.value = (data ?? []) as SearchAlert[]
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Error loading alerts'
  } finally {
    loading.value = false
  }
}

async function toggleActive(alert: SearchAlert) {
  const newValue = !alert.is_active

  try {
    const { error: err } = await supabase
      .from('search_alerts')
      .update({ is_active: newValue })
      .eq('id', alert.id)

    if (err) throw err
    alert.is_active = newValue
  } catch {
    // Revert on failure — silent
  }
}

async function deleteAlert(alertId: string) {
  try {
    const { error: err } = await supabase.from('search_alerts').delete().eq('id', alertId)

    if (err) throw err
    alerts.value = alerts.value.filter((a) => a.id !== alertId)
  } catch {
    // Silent fail
  }
}

/** Build a human-readable summary from filter JSON */
function filterSummary(filters: Record<string, unknown>): string {
  const parts: string[] = []
  if (filters.brand) parts.push(String(filters.brand))
  if (filters.model) parts.push(String(filters.model))
  if (filters.category) parts.push(String(filters.category))
  if (filters.price_min || filters.price_max) {
    const min = filters.price_min ? `${Number(filters.price_min).toLocaleString()}` : '0'
    const max = filters.price_max ? `${Number(filters.price_max).toLocaleString()}` : '...'
    parts.push(`${min} - ${max} \u20AC`)
  }
  if (filters.year_min || filters.year_max) {
    parts.push(`${filters.year_min ?? '...'} - ${filters.year_max ?? '...'}`)
  }
  return parts.length > 0 ? parts.join(' \u00B7 ') : t('profile.alerts.noFilters')
}

function frequencyLabel(frequency: string): string {
  return t(`profile.alerts.freq_${frequency}`)
}

useHead({
  title: t('profile.alerts.title'),
})

onMounted(() => {
  loadAlerts()
})
</script>

<template>
  <div class="alerts-page">
    <div class="alerts-container">
      <h1 class="page-title">
        {{ $t('profile.alerts.title') }}
      </h1>
      <p class="page-subtitle">
        {{ $t('profile.alerts.subtitle') }}
      </p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        {{ $t('common.loading') }}
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        {{ error }}
      </div>

      <!-- Empty -->
      <div v-else-if="alerts.length === 0" class="empty-state">
        <p class="empty-title">{{ $t('profile.alerts.emptyTitle') }}</p>
        <p class="empty-desc">{{ $t('profile.alerts.emptyDesc') }}</p>
        <NuxtLink to="/catalogo" class="btn-primary">
          {{ $t('profile.alerts.createFromCatalog') }}
        </NuxtLink>
      </div>

      <!-- Alert list -->
      <div v-else class="alerts-list">
        <div
          v-for="alert in alerts"
          :key="alert.id"
          class="alert-card"
          :class="{ 'alert-card--inactive': !alert.is_active }"
        >
          <div class="alert-info">
            <p class="alert-filters">{{ filterSummary(alert.filters) }}</p>
            <div class="alert-meta">
              <span class="alert-frequency">{{ frequencyLabel(alert.frequency) }}</span>
              <span class="alert-date">{{ new Date(alert.created_at).toLocaleDateString() }}</span>
            </div>
          </div>

          <div class="alert-actions">
            <!-- Toggle active -->
            <label class="toggle" :class="{ 'toggle--active': alert.is_active }">
              <input
                type="checkbox"
                class="toggle__input"
                :checked="alert.is_active"
                @change="toggleActive(alert)"
              >
              <span class="toggle__slider" />
            </label>

            <!-- Delete -->
            <button
              class="btn-delete"
              :aria-label="$t('common.delete')"
              @click="deleteAlert(alert.id)"
            >
              <svg
                viewBox="0 0 20 20"
                fill="currentColor"
                width="16"
                height="16"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.alerts-page {
  min-height: 60vh;
  padding: 1.5rem 0 3rem;
}

.alerts-container {
  max-width: 720px;
  margin: 0 auto;
  padding: 0 1rem;
}

.page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}

.page-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

/* Loading & error */
.loading-state,
.error-state {
  text-align: center;
  padding: 3rem 1rem;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.error-state {
  color: var(--color-error);
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 3rem 1.5rem;
  background: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.empty-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-semibold);
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-desc {
  font-size: var(--font-size-sm);
  color: var(--text-auxiliary);
  margin-bottom: 1.5rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  color: var(--color-white);
  background: var(--color-primary);
  border: none;
  border-radius: var(--border-radius);
  cursor: pointer;
  text-decoration: none;
  transition: background var(--transition-fast);
  min-height: 44px;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

/* Alert list */
.alerts-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert-card {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-sm);
  transition: opacity var(--transition-fast);
}

.alert-card--inactive {
  opacity: 0.6;
}

.alert-info {
  flex: 1;
  min-width: 0;
}

.alert-filters {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  color: var(--text-primary);
  margin-bottom: 0.375rem;
  word-break: break-word;
}

.alert-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: var(--font-size-xs);
  color: var(--text-auxiliary);
}

.alert-frequency {
  background: var(--bg-secondary);
  padding: 0.125rem 0.5rem;
  border-radius: var(--border-radius-sm);
  font-weight: var(--font-weight-medium);
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-shrink: 0;
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  cursor: pointer;
  width: 44px;
  height: 24px;
  min-height: 44px;
  min-width: 44px;
  justify-content: center;
}

.toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle__slider {
  position: absolute;
  width: 44px;
  height: 24px;
  background-color: var(--color-gray-300);
  border-radius: var(--border-radius-full);
  transition: background-color var(--transition-fast);
}

.toggle__slider::before {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: var(--color-white);
  border-radius: 50%;
  transition: transform var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.toggle--active .toggle__slider {
  background-color: var(--color-primary);
}

.toggle--active .toggle__slider::before {
  transform: translateX(20px);
}

/* Delete button */
.btn-delete {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-auxiliary);
  border-radius: var(--border-radius);
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.btn-delete:hover {
  color: var(--color-error);
  background: var(--bg-secondary);
}

/* ---- Tablet ---- */
@media (min-width: 768px) {
  .alerts-container {
    padding: 0 2rem;
  }

  .page-title {
    font-size: var(--font-size-3xl);
  }

  .page-subtitle {
    font-size: var(--font-size-base);
    margin-bottom: 2rem;
  }
}
</style>
