<script setup lang="ts">
/**
 * ImportarPreviewStep — Step 2: parsed data table with validation status.
 */
import type { ParsedRow } from '~/composables/dashboard/useDashboardImportar'

const { t } = useI18n()

defineProps<{
  parsedRows: ParsedRow[]
  validRowsCount: number
  invalidRowsCount: number
}>()

const emit = defineEmits<{
  (e: 'back'): void
  (e: 'publish', asDraft: boolean): void
}>()
</script>

<template>
  <section class="step-section">
    <div class="preview-header">
      <h2>{{ t('dashboard.import.preview') }}</h2>
      <div class="preview-stats">
        <span class="stat-valid">{{ validRowsCount }} {{ t('dashboard.import.valid') }}</span>
        <span v-if="invalidRowsCount > 0" class="stat-invalid">
          {{ invalidRowsCount }} {{ t('dashboard.import.invalid') }}
        </span>
      </div>
    </div>

    <div class="table-wrapper">
      <table class="preview-table">
        <thead>
          <tr>
            <th>{{ t('dashboard.import.status') }}</th>
            <th>{{ t('dashboard.vehicles.brand') }}</th>
            <th>{{ t('dashboard.vehicles.model') }}</th>
            <th>{{ t('dashboard.vehicles.year') }}</th>
            <th>{{ t('dashboard.vehicles.km') }}</th>
            <th>{{ t('dashboard.vehicles.price') }}</th>
            <th>{{ t('dashboard.vehicles.category') }}</th>
            <th>{{ t('dashboard.import.errors.title') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in parsedRows" :key="idx" :class="{ 'row-invalid': !row.isValid }">
            <td>
              <span v-if="row.isValid" class="status-ok">&#10003;</span>
              <span v-else class="status-error">&#10007;</span>
            </td>
            <td>{{ row.brand || '-' }}</td>
            <td>{{ row.model || '-' }}</td>
            <td>{{ row.year || '-' }}</td>
            <td>{{ row.km || '-' }}</td>
            <td>{{ row.price || '-' }}</td>
            <td>{{ row.category || '-' }}</td>
            <td>
              <span v-if="row.errors.length" class="error-list">
                {{ row.errors.join(', ') }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="preview-actions">
      <button type="button" class="btn-secondary" @click="emit('back')">
        {{ t('dashboard.import.back') }}
      </button>
      <button
        v-if="validRowsCount > 0"
        type="button"
        class="btn-secondary"
        @click="emit('publish', true)"
      >
        {{ t('dashboard.import.publishDraft') }}
      </button>
      <button
        v-if="validRowsCount > 0"
        type="button"
        class="btn-primary"
        @click="emit('publish', false)"
      >
        {{ t('dashboard.import.publishAll') }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.step-section {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}

.preview-header {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}

.preview-header h2 {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text-primary);
}

.preview-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-valid {
  color: var(--color-success);
}

.stat-invalid {
  color: var(--color-error);
}

.table-wrapper {
  overflow-x: auto;
  margin-bottom: 1.25rem;
}

.preview-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.preview-table th {
  text-align: left;
  padding: 0.75rem 0.5rem;
  background: var(--bg-secondary);
  border-bottom: 0.125rem solid var(--color-gray-200);
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
}

.preview-table td {
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid var(--color-gray-100);
}

.row-invalid {
  background: var(--color-error-bg, var(--color-error-bg));
}

.status-ok {
  color: var(--color-success);
  font-weight: 700;
  font-size: 1.1rem;
}

.status-error {
  color: var(--color-error);
  font-weight: 700;
  font-size: 1.1rem;
}

.error-list {
  color: var(--color-error);
  font-size: var(--font-size-sm);
}

.preview-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 600;
  cursor: pointer;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-secondary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.5rem;
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-secondary);
}

@media (min-width: 48em) {
  .preview-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .preview-actions {
    flex-wrap: nowrap;
  }
}
</style>
