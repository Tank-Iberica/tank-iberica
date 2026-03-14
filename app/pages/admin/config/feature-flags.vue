<script setup lang="ts">
import { useAdminFeatureFlags } from '~/composables/admin/useAdminFeatureFlags'
definePageMeta({
  layout: 'admin',
  middleware: 'admin',
})

const { t } = useI18n()
const {
  groupedFlags,
  loading,
  saving,
  error,
  saved,
  loadFlags,
  toggleFlag,
  createFlag,
  deleteFlag,
  updateFlag,
} = useAdminFeatureFlags()

const showCreateModal = ref(false)
const newFlag = reactive({
  key: '',
  description: '',
  enabled: false,
  percentage: 100,
  vertical: null as string | null,
})

const expandedKeys = ref<Set<string>>(new Set())

function toggleExpand(key: string) {
  if (expandedKeys.value.has(key)) {
    expandedKeys.value.delete(key)
  } else {
    expandedKeys.value.add(key)
  }
}

async function handleCreate() {
  await createFlag({
    key: newFlag.key.toLowerCase().replaceAll(/\s+/g, '_'),
    enabled: newFlag.enabled,
    description: newFlag.description,
    percentage: newFlag.percentage,
    vertical: newFlag.vertical || null,
  })
  if (!error.value) {
    showCreateModal.value = false
    newFlag.key = ''
    newFlag.description = ''
    newFlag.enabled = false
    newFlag.percentage = 100
    newFlag.vertical = null
  }
}

async function handleAddOverride(key: string, vertical: string) {
  const globalFlag = groupedFlags.value.get(key)?.global
  await createFlag({
    key,
    enabled: globalFlag?.enabled ?? false,
    description: globalFlag?.description ?? '',
    percentage: globalFlag?.percentage ?? 100,
    vertical,
  })
}

const confirmDelete = ref<{ key: string; vertical: string | null } | null>(null)

async function handleDelete() {
  if (!confirmDelete.value) return
  await deleteFlag(confirmDelete.value.key, confirmDelete.value.vertical)
  confirmDelete.value = null
}

onMounted(() => {
  loadFlags()
})
</script>

<template>
  <div class="feature-flags-page">
    <div class="page-header">
      <div>
        <NuxtLink to="/admin/config" class="back-link"> &larr; {{ t('common.back') }} </NuxtLink>
        <h2>{{ t('admin.featureFlags.title') }}</h2>
        <p class="subtitle">{{ t('admin.featureFlags.subtitle') }}</p>
      </div>
      <button class="btn-primary" @click="showCreateModal = true">
        + {{ t('admin.featureFlags.createFlag') }}
      </button>
    </div>

    <div v-if="error" class="alert alert-error">{{ error }}</div>
    <div v-if="saved" class="alert alert-success">{{ t('common.savedSuccessfully') }}</div>

    <div v-if="loading" class="loading-state">
      <div class="spinner" />
    </div>

    <div v-else class="flags-list">
      <div v-for="[key, group] in groupedFlags" :key="key" class="flag-card">
        <div class="flag-header">
          <div class="flag-info">
            <div class="flag-key-row">
              <code class="flag-key">{{ key }}</code>
              <span v-if="group.overrides.length" class="override-badge">
                {{ group.overrides.length }} {{ t('admin.featureFlags.overrides') }}
              </span>
            </div>
            <p v-if="group.global?.description" class="flag-desc">
              {{ group.global.description }}
            </p>
          </div>

          <div class="flag-actions">
            <label class="toggle-switch">
              <input
                type="checkbox"
                :checked="group.global?.enabled ?? false"
                :disabled="saving"
                @change="toggleFlag(key, null, ($event.target as HTMLInputElement).checked)"
              >
              <span class="toggle-slider" />
            </label>
            <button
              class="btn-icon"
              :title="t('admin.featureFlags.expand')"
              @click="toggleExpand(key)"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                width="18"
                height="18"
              >
                <path :d="expandedKeys.has(key) ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" />
              </svg>
            </button>
          </div>
        </div>

        <div v-if="expandedKeys.has(key)" class="flag-details">
          <div class="detail-section">
            <h4>{{ t('admin.featureFlags.globalSettings') }}</h4>
            <div class="detail-grid">
              <div class="detail-field">
                <label>{{ t('admin.featureFlags.rolloutPercentage') }}</label>
                <div class="range-input">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    :value="group.global?.percentage ?? 100"
                    @change="
                      updateFlag(key, null, {
                        percentage: Number(($event.target as HTMLInputElement).value),
                      })
                    "
                  >
                  <span>{{ group.global?.percentage ?? 100 }}%</span>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-section">
            <div class="section-header-row">
              <h4>{{ t('admin.featureFlags.verticalOverrides') }}</h4>
              <button class="btn-sm" @click="handleAddOverride(key, 'tracciona')">
                + {{ t('admin.featureFlags.addOverride') }}
              </button>
            </div>

            <div v-if="group.overrides.length === 0" class="empty-overrides">
              {{ t('admin.featureFlags.noOverrides') }}
            </div>

            <div
              v-for="override in group.overrides"
              :key="override.vertical ?? ''"
              class="override-row"
            >
              <code class="vertical-tag">{{ override.vertical }}</code>
              <label class="toggle-switch toggle-sm">
                <input
                  type="checkbox"
                  :checked="override.enabled"
                  :disabled="saving"
                  @change="
                    toggleFlag(key, override.vertical, ($event.target as HTMLInputElement).checked)
                  "
                >
                <span class="toggle-slider" />
              </label>
              <span class="override-pct">{{ override.percentage }}%</span>
              <button
                class="btn-icon btn-danger-icon"
                :title="t('common.delete')"
                @click="confirmDelete = { key, vertical: override.vertical }"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  width="16"
                  height="16"
                >
                  <path
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div v-if="groupedFlags.size === 0 && !loading" class="empty-state">
        <p>{{ t('admin.featureFlags.noFlags') }}</p>
      </div>
    </div>

    <!-- Create Modal -->
    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
        <div class="modal-content">
          <h3>{{ t('admin.featureFlags.createFlag') }}</h3>
          <form @submit.prevent="handleCreate">
            <div class="form-group">
              <label>{{ t('admin.featureFlags.flagKey') }}</label>
              <input
                v-model="newFlag.key"
                type="text"
                required
                :placeholder="t('admin.featureFlags.keyPlaceholder')"
                pattern="[a-z0-9_]+"
              >
            </div>
            <div class="form-group">
              <label>{{ t('admin.featureFlags.description') }}</label>
              <input v-model="newFlag.description" type="text" >
            </div>
            <div class="form-group">
              <label>{{ t('admin.featureFlags.verticalScope') }}</label>
              <select v-model="newFlag.vertical">
                <option :value="null">{{ t('admin.featureFlags.global') }}</option>
                <option value="tracciona">tracciona</option>
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="toggle-label">
                  <input v-model="newFlag.enabled" type="checkbox" >
                  {{ t('admin.featureFlags.enabled') }}
                </label>
              </div>
              <div class="form-group">
                <label>{{ t('admin.featureFlags.rolloutPercentage') }}</label>
                <input v-model.number="newFlag.percentage" type="number" min="0" max="100" >
              </div>
            </div>
            <div class="modal-actions">
              <button type="button" class="btn-secondary" @click="showCreateModal = false">
                {{ t('common.cancel') }}
              </button>
              <button type="submit" class="btn-primary" :disabled="saving">
                {{ t('common.create') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>

    <!-- Delete Confirmation -->
    <Teleport to="body">
      <div v-if="confirmDelete" class="modal-overlay" @click.self="confirmDelete = null">
        <div class="modal-content modal-sm">
          <h3>{{ t('common.confirmDelete') }}</h3>
          <p>
            {{
              t('admin.featureFlags.confirmDeleteMsg', {
                key: confirmDelete.key,
                vertical: confirmDelete.vertical || 'global',
              })
            }}
          </p>
          <div class="modal-actions">
            <button class="btn-secondary" @click="confirmDelete = null">
              {{ t('common.cancel') }}
            </button>
            <button class="btn-danger" @click="handleDelete">
              {{ t('common.delete') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.feature-flags-page {
  padding: 0;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  margin-bottom: var(--spacing-6);
  flex-wrap: wrap;
}

.page-header h2 {
  margin: var(--spacing-1) 0 var(--spacing-1);
  font-size: 1.5rem;
}

.back-link {
  font-size: 0.85rem;
  color: var(--color-primary);
  text-decoration: none;
}

.subtitle {
  margin: 0;
  color: var(--color-gray-500);
  font-size: 0.9rem;
}

.flags-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
}

.flag-card {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow: hidden;
}

.flag-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-4);
  gap: var(--spacing-3);
}

.flag-info {
  flex: 1;
  min-width: 0;
}

.flag-key-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  flex-wrap: wrap;
}

.flag-key {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  background: var(--bg-secondary);
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
}

.override-badge {
  font-size: 0.7rem;
  background: var(--color-primary);
  color: white;
  padding: 0.125rem var(--spacing-2);
  border-radius: 999px;
}

.flag-desc {
  margin: var(--spacing-1) 0 0;
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.flag-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  flex-shrink: 0;
}

/* Toggle switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 2.75rem;
  height: 1.5rem;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  inset: 0;
  background: var(--color-gray-300);
  border-radius: 999px;
  cursor: pointer;
  transition: background 0.2s;
}

.toggle-slider::before {
  content: '';
  position: absolute;
  width: 1.125rem;
  height: 1.125rem;
  left: 0.1875rem;
  bottom: 0.1875rem;
  background: white;
  border-radius: 50%;
  transition: transform 0.2s;
}

.toggle-switch input:checked + .toggle-slider {
  background: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
  transform: translateX(1.25rem);
}

.toggle-sm {
  width: 2.25rem;
  height: 1.25rem;
}

.toggle-sm .toggle-slider::before {
  width: 0.875rem;
  height: 0.875rem;
}

.toggle-sm input:checked + .toggle-slider::before {
  transform: translateX(1rem);
}

/* Details expanded */
.flag-details {
  padding: 0 var(--spacing-4) var(--spacing-4);
  border-top: 1px solid var(--color-border);
}

.detail-section {
  padding-top: var(--spacing-3);
}

.detail-section h4 {
  margin: 0 0 var(--spacing-2);
  font-size: 0.85rem;
  color: var(--color-gray-600);
}

.section-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2);
}

.section-header-row h4 {
  margin: 0;
}

.detail-grid {
  display: grid;
  gap: var(--spacing-3);
}

.detail-field label {
  display: block;
  font-size: 0.8rem;
  color: var(--color-gray-500);
  margin-bottom: var(--spacing-1);
}

.range-input {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
}

.range-input input[type='range'] {
  flex: 1;
  accent-color: var(--color-primary);
}

.range-input span {
  font-size: 0.85rem;
  font-weight: 600;
  min-width: 2.5rem;
  text-align: right;
}

/* Override rows */
.override-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-3);
  padding: var(--spacing-2) 0;
  border-bottom: 1px solid var(--color-border);
}

.override-row:last-child {
  border-bottom: none;
}

.vertical-tag {
  font-size: 0.8rem;
  background: var(--bg-secondary);
  padding: 0.125rem var(--spacing-2);
  border-radius: var(--border-radius-sm);
  min-width: 5rem;
}

.override-pct {
  font-size: 0.8rem;
  color: var(--color-gray-500);
}

.empty-overrides {
  font-size: 0.85rem;
  color: var(--color-gray-400);
  padding: var(--spacing-2) 0;
}

/* Buttons */
.btn-primary {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.btn-primary:disabled {
  opacity: 0.6;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.btn-sm {
  font-size: 0.75rem;
  padding: var(--spacing-1) var(--spacing-2);
  background: var(--bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-sm);
  cursor: pointer;
  min-height: 2rem;
}

.btn-danger {
  background: var(--color-error);
  color: white;
  border: none;
  padding: var(--spacing-2) var(--spacing-4);
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--spacing-1);
  color: var(--color-gray-500);
  min-width: 2.75rem;
  min-height: 2.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-danger-icon {
  color: var(--color-error);
}

/* Alert */
.alert {
  padding: var(--spacing-3) var(--spacing-4);
  border-radius: var(--border-radius-md);
  margin-bottom: var(--spacing-4);
  font-size: 0.875rem;
}

.alert-error {
  background: #fef2f2;
  color: var(--color-error);
  border: 1px solid #fecaca;
}

.alert-success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

/* Loading */
.loading-state {
  display: flex;
  justify-content: center;
  padding: var(--spacing-8);
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-border);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: var(--spacing-8);
  color: var(--color-gray-400);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-4);
}

.modal-content {
  background: var(--bg-primary);
  border-radius: var(--border-radius-lg);
  padding: var(--spacing-6);
  max-width: 30rem;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-sm {
  max-width: 24rem;
}

.modal-content h3 {
  margin: 0 0 var(--spacing-4);
  font-size: 1.125rem;
}

.form-group {
  margin-bottom: var(--spacing-3);
}

.form-group label {
  display: block;
  font-size: 0.85rem;
  margin-bottom: var(--spacing-1);
  color: var(--color-gray-600);
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group select {
  width: 100%;
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-border);
  border-radius: var(--border-radius-md);
  font-size: 0.875rem;
  min-height: 2.75rem;
}

.form-row {
  display: flex;
  gap: var(--spacing-4);
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--spacing-2);
  margin-top: var(--spacing-4);
}

@media (max-width: 29.9375em) {
  .page-header {
    flex-direction: column;
  }

  .flag-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .flag-actions {
    width: 100%;
    justify-content: space-between;
  }

  .form-row {
    flex-direction: column;
    gap: 0;
  }

  .override-row {
    flex-wrap: wrap;
  }
}
</style>
