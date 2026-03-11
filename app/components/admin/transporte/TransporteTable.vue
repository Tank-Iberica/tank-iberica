<script setup lang="ts">
import { formatPriceCents } from '~/composables/shared/useListingUtils'
import type { TransportRequest } from '~/composables/admin/useAdminTransporte'
import { STATUS_OPTIONS } from '~/composables/admin/useAdminTransporte'

defineProps<{
  requests: TransportRequest[]
  expandedId: string | null
  editingNotes: string
  savingNotes: boolean
  updatingStatus: string | null
  getStatusClass: (status: string) => string
  getStatusLabel: (status: string) => string
  formatDate: (dateStr: string | null) => string
}>()

const emit = defineEmits<{
  (e: 'toggleExpand' | 'saveNotes' | 'update:editingNotes', value: string): void
  (e: 'updateStatus', id: string, status: string): void
}>()

const { t } = useI18n()

function onStatusChange(requestId: string, event: Event) {
  const target = event.target as HTMLSelectElement
  emit('updateStatus', requestId, target.value)
}

function onNotesInput(event: Event) {
  const target = event.target as HTMLTextAreaElement
  emit('update:editingNotes', target.value)
}
</script>

<template>
  <div class="table-wrapper desktop-only">
    <table class="data-table">
      <thead>
        <tr>
          <th>{{ t('admin.transporte.colVehicle') }}</th>
          <th>{{ t('admin.transporte.colRequester') }}</th>
          <th>{{ t('admin.transporte.colOrigin') }}</th>
          <th>{{ t('admin.transporte.colDestination') }}</th>
          <th>{{ t('admin.transporte.colPrice') }}</th>
          <th>{{ t('admin.transporte.colStatus') }}</th>
          <th>{{ t('admin.transporte.colDate') }}</th>
        </tr>
      </thead>
      <tbody>
        <template v-for="req in requests" :key="req.id">
          <tr
            class="table-row"
            :class="{ expanded: expandedId === req.id }"
            @click="emit('toggleExpand', req.id)"
          >
            <td class="cell-vehicle">{{ req.vehicles?.title || '-' }}</td>
            <td class="cell-requester">{{ req.user_id?.slice(0, 8) }}...</td>
            <td>{{ req.origin || '-' }}</td>
            <td>{{ req.destination_postal_code || '-' }}</td>
            <td>{{ formatPriceCents(req.estimated_price_cents) }}</td>
            <td>
              <span class="status-badge" :class="getStatusClass(req.status)">
                {{ getStatusLabel(req.status) }}
              </span>
            </td>
            <td>{{ formatDate(req.created_at) }}</td>
          </tr>
          <!-- Expanded row -->
          <tr v-if="expandedId === req.id" class="expanded-row">
            <td colspan="7">
              <div class="expanded-content">
                <div class="expanded-field">
                  <label>{{ t('admin.transporte.status') }}</label>
                  <select
                    :value="req.status"
                    :disabled="updatingStatus === req.id"
                    @change="onStatusChange(req.id, $event)"
                  >
                    <option v-for="opt in STATUS_OPTIONS" :key="opt" :value="opt">
                      {{ getStatusLabel(opt) }}
                    </option>
                  </select>
                </div>
                <div class="expanded-field notes-field">
                  <label>{{ t('admin.transporte.adminNotes') }}</label>
                  <textarea
                    :value="editingNotes"
                    rows="3"
                    :placeholder="t('admin.transporte.notesPlaceholder')"
                    @input="onNotesInput"
                  />
                  <button
                    class="btn-save-notes"
                    :disabled="savingNotes"
                    @click.stop="emit('saveNotes', req.id)"
                  >
                    {{ savingNotes ? t('admin.transporte.saving') : t('common.save') }}
                  </button>
                </div>
              </div>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.desktop-only {
  display: none;
}

.table-wrapper {
  background: var(--bg-primary);
  border-radius: var(--border-radius-md);
  box-shadow: var(--shadow-card);
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

.data-table th {
  text-align: left;
  padding: var(--spacing-3) var(--spacing-4);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-auxiliary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--color-gray-200);
  white-space: nowrap;
}

.data-table td {
  padding: var(--spacing-3) var(--spacing-4);
  color: var(--text-primary);
  border-bottom: 1px solid var(--color-gray-100);
}

.table-row {
  cursor: pointer;
  transition: background 0.15s;
}

.table-row:hover {
  background: var(--bg-secondary);
}

.table-row.expanded {
  background: var(--bg-secondary);
}

.cell-vehicle {
  font-weight: 600;
  max-width: 12.5rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cell-requester {
  font-family: monospace;
  font-size: 0.8rem;
  color: var(--text-auxiliary);
}

/* Status badges */
.status-badge {
  display: inline-block;
  padding: var(--spacing-1) var(--spacing-3);
  border-radius: var(--border-radius-md);
  font-size: 0.8rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-badge.status-pending {
  background: var(--color-warning-bg, var(--color-warning-bg));
  color: var(--color-warning-text);
}

.status-badge.status-accepted {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-badge.status-transit {
  background: var(--color-info-bg, var(--color-info-bg));
  color: var(--color-info);
}

.status-badge.status-completed {
  background: var(--color-success-bg, var(--color-success-bg));
  color: var(--color-success);
}

.status-badge.status-cancelled {
  background: var(--color-error-bg, var(--color-error-bg));
  color: var(--color-error);
}

/* Expanded row */
.expanded-row td {
  padding: 0;
  border-bottom: 2px solid var(--color-gray-200);
}

.expanded-content {
  padding: var(--spacing-4);
  display: flex;
  gap: var(--spacing-6);
  flex-wrap: wrap;
  background: var(--bg-secondary);
}

.expanded-field {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.expanded-field label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.expanded-field select {
  padding: var(--spacing-2) var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  min-height: 2.75rem;
  background: var(--bg-primary);
  cursor: pointer;
}

.expanded-field select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.notes-field {
  flex: 1;
  min-width: 15rem;
}

.notes-field textarea {
  width: 100%;
  padding: 0.625rem var(--spacing-3);
  border: 1px solid var(--color-gray-200);
  border-radius: var(--border-radius);
  font-size: 0.9rem;
  font-family: inherit;
  resize: vertical;
  min-height: 3.75rem;
}

.notes-field textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: var(--shadow-focus);
}

.btn-save-notes {
  align-self: flex-start;
  padding: var(--spacing-2) var(--spacing-4);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  font-size: 0.85rem;
  cursor: pointer;
  transition: background 0.2s;
  min-height: 2.75rem;
  margin-top: var(--spacing-2);
}

.btn-save-notes:hover {
  background: var(--color-primary-dark);
}

.btn-save-notes:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (min-width: 48em) {
  .desktop-only {
    display: block;
  }
}
</style>
